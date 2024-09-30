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

func TestCiti(t *testing.T) {
	const input = `"Status","Date","Description","Debit","Credit"` + "\r\n" +
		`"Cleared","08/04/2015","FOREIGN TRANSACTION FEE                 
","3,117.29",""` + "\r\n" +
		`"Cleared","08/03/2015","GOOGLE *Music          GOOGLE.COM/CH CA 
","",""` + "\r\n"

	r := strings.NewReader(input)
	cr, err := NewCSVReader(r)
	if err != nil {
		panic(err)
	}

	expects := []qif.Entry{
		{Date: date(2015, 8, 4), Amount: 311729, Payee: "FOREIGN TRANSACTION FEE", Cleared: 1},
		{Date: date(2015, 8, 3), Amount: 0, Payee: "GOOGLE *Music          GOOGLE.COM/CH CA", Cleared: 1},
	}
	for i, expect := range expects {
		e, err := cr.ReadEntry()
		if err != nil {
			panic(err)
		}
		if *e != expect {
			t.Errorf("%d: got\n%#v\nwant\n%#v", i, *e, expect)
		}
	}

	_, err = cr.ReadEntry()
	if err == nil {
		panic("expected EOF")
	}
	if err != io.EOF {
		panic(err)
	}
}
