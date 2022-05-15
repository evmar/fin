// Copyright 2014 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package qif

import (
	"bytes"
	"errors"
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
			if errors.Is(err, io.ErrUnexpectedEOF) {
				// Test passed.
				break
			}
			t.Fatalf("expected an unexpected eof, got %#v", err)
		}
	}
}
