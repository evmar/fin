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

	"bank/qif"
)

type CSVReader struct {
	r      *csv.Reader
	fields map[string]int
}

func NewCSVReader(r io.Reader) (*CSVReader, error) {
	cr := &CSVReader{r: csv.NewReader(r), fields: map[string]int{}}
	header, err := cr.r.Read()
	if err != nil {
		panic(err)
		return nil, err
	}
	for i, name := range header {
		cr.fields[name] = i
	}
	return cr, nil
}

func (cr *CSVReader) Read() (*qif.Entry, error) {
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

	amount := row[cr.fields["Credit"]]
	if amount == "" {
		amount = "-" + row[cr.fields["Debit"]]
	}
	amountF, err := strconv.ParseFloat(amount, 64)
	if err != nil {
		return nil, err
	}
	e.Amount = int(amountF * 100.0)

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
