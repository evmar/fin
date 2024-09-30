// Package CSV provides a reader that converts a Citi CSV export into
// QIF entries.  (Why? The Citi QIF export has truncated fields.)
package csv

import (
	"encoding/csv"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/evmar/fin/bank/qif"
)

type mode int

const (
	Citi mode = iota
	Venmo
)

type CSVReader struct {
	r      *csv.Reader
	mode   mode
	fields map[string]int
}

func NewCSVReader(r io.Reader) (*CSVReader, error) {
	cr := &CSVReader{r: csv.NewReader(r), fields: map[string]int{}}
	for {
		fields := map[string]int{}
		header, err := cr.r.Read()
		if err != nil {
			return nil, err
		}
		for i, name := range header {
			if name == "" {
				continue
			}
			fields[name] = i
		}

		// venmo CSV starts with a few rows of junk, skip them
		if len(fields) > 1 {
			cr.fields = fields
			break
		}
		cr.mode = Venmo
	}
	return cr, nil
}

func parseNumber(num string) (int, error) {
	num = strings.Replace(num, ",", "", -1)
	num = strings.Replace(num, " ", "", -1)
	num = strings.Replace(num, "$", "", -1)
	numF, err := strconv.ParseFloat(num, 64)
	if err != nil {
		return 0, err
	}
	return int(numF * 100.0), nil
}

func (cr *CSVReader) ReadEntry() (*qif.Entry, error) {
	switch cr.mode {
	case Citi:
		row, err := cr.r.Read()
		if err != nil {
			return nil, err
		}

		e := &qif.Entry{Cleared: qif.Cleared}
		e.Date, err = time.Parse("01/02/2006", row[cr.fields["Date"]])
		if err != nil {
			return nil, err
		}

		if n := row[cr.fields["Credit"]]; n != "" {
			e.Amount, err = parseNumber(n)
			if err != nil {
				return nil, err
			}
		} else if n := row[cr.fields["Debit"]]; n != "" {
			e.Amount, err = parseNumber(n)
			if err != nil {
				return nil, err
			}
		}
		e.Amount = -e.Amount

		e.Payee = strings.TrimSpace(row[cr.fields["Description"]])
		return e, nil
	case Venmo:
		for {
			row, err := cr.r.Read()
			if err != nil {
				return nil, err
			}

			if row[cr.fields["Type"]] != "Payment" { // venmo payments
				continue
			}

			e := &qif.Entry{Cleared: qif.Cleared}

			date := row[cr.fields["Datetime"]]
			if date == "" {
				continue // more junk in venmo csv
			}
			e.Date, err = time.Parse("2006-01-02T15:04:05", date)
			if err != nil {
				return nil, err
			}

			e.Amount, err = parseNumber(row[cr.fields["Amount (total)"]])
			if err != nil {
				return nil, err
			}

			e.Payee = fmt.Sprintf("%s: %s", row[cr.fields["To"]], row[cr.fields["Note"]])

			return e, nil
		}
	}
	panic("unreachable")
}
