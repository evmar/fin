package csv

import (
	"io"
	"strings"
	"testing"

	"github.com/evmar/fin/bank/qif"
)

const input = `"Status","Date","Description","Debit","Credit"` + "\r\n" +
	`"Cleared","08/04/2015","FOREIGN TRANSACTION FEE                 
","3,117.29",""` + "\r\n" +
	`"Cleared","08/03/2015","GOOGLE *Music          GOOGLE.COM/CH CA 
","",""` + "\r\n"

func TestCSV(t *testing.T) {
	r := strings.NewReader(input)
	cr, err := NewCSVReader(r)
	if err != nil {
		panic(err)
	}

	tcases := []struct {
		date    string
		desc    string
		amount  int
		cleared qif.ClearedType
	}{
		{"08/04/2015", "FOREIGN TRANSACTION FEE", 311729, qif.Cleared},
		{"08/03/2015", "GOOGLE *Music          GOOGLE.COM/CH CA", 0, qif.Cleared},
	}
	for _, tcase := range tcases {
		e, err := cr.ReadEntry()
		if err != nil {
			panic(err)
		}

		if d := e.Date.Format("01/02/2006"); d != tcase.date {
			t.Errorf("bad date: %q", d)
		}
		if e.Payee != tcase.desc {
			t.Errorf("bad desc: %q", e.Payee)
		}
		if e.Amount != tcase.amount {
			t.Errorf("bad amount: got %v, want %v", e.Amount, tcase.amount)
		}
		if e.Cleared != tcase.cleared {
			t.Errorf("bad cleared: %v", e.Cleared)
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
