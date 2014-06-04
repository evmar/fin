// Copyright 2014 Google Inc. All Rights Reserved.

package qif

import (
	"bytes"
	"io"
	"testing"
	"time"
)

const sampleFile = `!Type:Bank
D11/19/2012
PWELLS FARGO BN 11/19 #00163 WITHDRWL SFO/TERM-2 IR SAN FRANCISCO C
T-3.14
C*
^
D12/31/2012
PCHECKCARD 1117 CITY OF PORTLAND DEPT T PORTLAND OR 2443232690
T-1.59
C*
^
`

func date(y, m, d int) time.Time {
	return time.Date(y, time.Month(m), d, 0, 0, 0, 0, time.UTC)
}

func TestParse(t *testing.T) {
	r := NewReader(bytes.NewBufferString(sampleFile))
	tag, err := r.ReadHeader()
	if err != nil {
		t.Fatalf("failed header read: %#v", err)
	}
	if tag != "Bank" {
		t.Fatalf("expected %q, got %q", "Bank", tag)
	}

	exp := Entry{
		Number:  "",
		Date:    date(2012, 11, 19),
		Amount:  -314,
		Payee:   "WELLS FARGO BN 11/19 #00163 WITHDRWL SFO/TERM-2 IR SAN FRANCISCO C",
		Address: "",
		Cleared: Cleared,
	}
	e, err := r.ReadEntry()
	if err != nil {
		t.Fatalf("failed entry read: %#v", err)
	}
	if *e != exp {
		t.Fatalf("expected %#v, got %#v", exp, e)
	}

	exp = Entry{
		Number:  "",
		Date:    date(2012, 12, 31),
		Amount:  -159,
		Payee:   "CHECKCARD 1117 CITY OF PORTLAND DEPT T PORTLAND OR 2443232690",
		Address: "",
		Cleared: Cleared,
	}
	e, err = r.ReadEntry()
	if err != nil {
		t.Fatalf("failed entry read: %#v", err)
	}
	if *e != exp {
		t.Fatalf("expected %#v, got %#v", exp, e)
	}

	e, err = r.ReadEntry()
	if err != io.EOF {
		t.Fatalf("overlong file")
	}
}

func TestTrunc(t *testing.T) {
	r := NewReader(bytes.NewBufferString(sampleFile[0 : len(sampleFile)-2]))
	_, err := r.ReadHeader()
	if err != nil {
		t.Fatalf("failed header read: %#v", err)
	}

	for {
		_, err := r.ReadEntry()
		if err != nil {
			if err == io.ErrUnexpectedEOF {
				// Test passed.
				break
			}
			t.Fatalf("expected an unexpected eof, got %#v", err)
		}
	}
}
