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

func parseAll(input string) ([]qif.Entry, error) {
	r := strings.NewReader(input)
	cr, err := NewCSVReader(r)
	if err != nil {
		return nil, err
	}

	var entries []qif.Entry
	for {
		e, err := cr.ReadEntry()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		entries = append(entries, *e)
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
		if entries[i] != expect {
			t.Errorf("%d: got\n%#v\nwant\n%#v", i, entries[i], expect)
		}
	}
}

func TestVenmo(t *testing.T) {
	const input = `Account Statement - (@foo) - March 31st to May 1st 2024 ,,,,,,,,,,,,,,,,,,,,,
Account Activity,,,,,,,,,,,,,,,,,,,,,
,ID,Datetime,Type,Status,Note,From,To,Amount (total),Amount (tip),Amount (tax),Amount (fee),Tax Rate,Tax Exempt,Funding Source,Destination,Beginning Balance,Ending Balance,Statement Period Venmo Fees,Terminal Location,Year to Date Venmo Fees,Disclaimer
,,,,,,,,,,,,,,,,$8.21,,,,,
,1,2024-04-02T11:12:13,Payment,Complete,Foobar,My Name,Other,- $175.00,,0,,0,,"BANK OF AMERICA, N.A. (SFNB) Personal Checking *1111",,,,,Venmo,,
,2,2024-04-11T07:28:52,Charge,Complete,Foobar2,Other,My Name,- $175.00,,0,,0,,"BANK OF AMERICA, N.A. (SFNB) Personal Checking *1111",,,,,Venmo,,
,3,2024-04-30T20:00:14,Payment,Complete,Foobar3,My Name,Other,- $175.00,,0,,0,,"BANK OF AMERICA, N.A. (SFNB) Personal Checking *1111",,,,,Venmo,,
`

	entries, err := parseAll(input)
	if err != nil {
		panic(err)
	}
	expects := []qif.Entry{
		{Date: time.Date(2024, time.April, 2, 11, 12, 13, 0, time.UTC), Amount: -17500, Payee: "Other: Foobar", Cleared: 1},
		{Date: time.Date(2024, time.April, 30, 20, 0, 14, 0, time.UTC), Amount: -17500, Payee: "Other: Foobar3", Cleared: 1},
	}

	if len(entries) != len(expects) {
		t.Fatalf("got %d entries, want %d", len(entries), len(expects))
	}
	for i, expect := range expects {
		if entries[i] != expect {
			t.Errorf("%d: got\n%#v\nwant\n%#v", i, entries[i], expect)
		}
	}
}
