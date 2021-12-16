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

type CSVReader struct {
	r      *csv.Reader
	fields map[string]int
}

func NewCSVReader(r io.Reader) (*CSVReader, error) {
	cr := &CSVReader{r: csv.NewReader(r), fields: map[string]int{}}
	header, err := cr.r.Read()
	if err != nil {
		return nil, err
	}
	for i, name := range header {
		cr.fields[name] = i
	}
	return cr, nil
}

func parseNumber(num string) (int, error) {
	num = strings.Replace(num, ",", "", -1)
	numF, err := strconv.ParseFloat(num, 64)
	if err != nil {
		return 0, err
	}
	return int(numF * 100.0), nil
}

func (cr *CSVReader) ReadEntry() (*qif.Entry, error) {
	row, err := cr.r.Read()
	if err != nil {
		return nil, err
	}

	e := &qif.Entry{}
	e.Number = "" // Not provided.
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
		e.Amount = -e.Amount
		if err != nil {
			return nil, err
		}
	}

	e.Payee = strings.TrimSpace(row[cr.fields["Description"]])

	e.Address = "" // Not provided.

	switch status := row[cr.fields["Status"]]; status {
	case "Cleared":
		e.Cleared = qif.Cleared
	default:
		panic(fmt.Sprintf("unknown cleared: %q", status))
	}

	return e, nil
}
