package csv

import (
	"io"
	"strings"
	"testing"
	"time"

	"github.com/evmar/fin/bank/qif"
)

func date(year, month, day int) time.Time {
	return time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)
}

func parseAll(input string) ([]*qif.Entry, error) {
	r := strings.NewReader(input)
	cr, err := NewCSVReader(r)
	if err != nil {
		return nil, err
	}

	var entries []*qif.Entry
	for {
		e, err := cr.ReadEntry()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, nil
}

func TestCiti(t *testing.T) {
	const input = `"Status","Date","Description","Debit","Credit"` + "\r\n" +
		`"Cleared","08/04/2015","FOREIGN TRANSACTION FEE                 
","3,117.29",""` + "\r\n" +
		`"Cleared","08/03/2015","GOOGLE *Music          GOOGLE.COM/CH CA 
","",""` + "\r\n"

	entries, err := parseAll(input)
	if err != nil {
		panic(err)
	}
	expects := []qif.Entry{
		{Date: date(2015, 8, 4), Amount: 311729, Payee: "FOREIGN TRANSACTION FEE", Cleared: 1},
		{Date: date(2015, 8, 3), Amount: 0, Payee: "GOOGLE *Music          GOOGLE.COM/CH CA", Cleared: 1},
	}

	if len(entries) != len(expects) {
		t.Fatalf("got %d entries, want %d", len(entries), len(expects))
	}

	for i, expect := range expects {
		e := entries[i]
		if *e != expect {
			t.Errorf("%d: got\n%#v\nwant\n%#v", i, *e, expect)
		}
	}
}
