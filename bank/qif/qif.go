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

// Package qif parses QIF (Quicken Interchange Format) files, which are
// commonly exported by banks.
package qif

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"log"
	"strconv"
	"time"
)

// ClearedType represents the "cleared" state of a transaction.
type ClearedType int

const (
	NotCleared ClearedType = iota
	Cleared
	Reconciled
)

// Entry represents a single entry in the ledger.
type Entry struct {
	// Number is a string identifier for the transaction.
	// Sample value: "0224169143028400738398".
	Number string

	// Date is the date of the transaction.
	Date time.Time

	// Amount is the amount of money, in cents.
	// Amount will be negative for withdrawals.
	Amount int

	// Payee is the recipient of the transaction as reported by the bank.
	// Sample value: "WHOLEFDS NOE 10379 SAN FRANCISCOCA".
	Payee string

	// Address is the address of the recipient as reported by the bank.
	// Sample value: "SAN FRANCISCCA".
	Address string

	// Cleared is the status of the transaction, or zero if not present.
	Cleared ClearedType
}

type Reader struct {
	s       *bufio.Scanner
	lineNum int
}

// NewReader constructs a new Reader for a given io.Reader.
func NewReader(r io.Reader) *Reader {
	return &Reader{bufio.NewScanner(r), 0}
}

func (r *Reader) line() ([]byte, error) {
	if !r.s.Scan() {
		if err := r.s.Err(); err != nil {
			return nil, err
		}
		return nil, nil
	}
	r.lineNum++
	return r.s.Bytes(), nil
}

// ReadHeader reads the header from the input and returns the value,
// e.g. "CCard".  It must be called first when reading.
func (r *Reader) ReadHeader() (string, error) {
	line, err := r.line()
	if err != nil {
		return "", err
	}
	if line == nil {
		return "", io.ErrUnexpectedEOF
	}
	prefix := []byte("!Type:")
	if !bytes.HasPrefix(line, prefix) {
		return "", fmt.Errorf("bad header")
	}
	id := line[len(prefix):]
	return string(id), nil
}

func isoToUTF(data []byte) string {
	ascii := true
	for _, b := range data {
		if b > 0x7f {
			ascii = false
			break
		}
	}
	if ascii {
		return string(data)
	}

	buf := &bytes.Buffer{}
	for _, b := range data {
		buf.WriteRune(rune(b))
	}
	return buf.String()
}

// ReadEntry reads an Entry from the input, and can be called repeatedly.
// ReadHeader must be called first.  Returns (nil, io.EOF) at the end
// of the input.
func (r *Reader) ReadEntry() (*Entry, error) {
	e := &Entry{}
	read := false
	for {
		line, err := r.line()
		if err != nil {
			return nil, err
		}
		if line == nil {
			break
		}
		code := line[0]
		data := isoToUTF(line[1:])
		switch code {
		case 'A':
			e.Address = data
		case 'C':
			switch data {
			case "":
				e.Cleared = NotCleared
			case "*", "c":
				e.Cleared = Cleared
			case "X", "R":
				e.Cleared = Reconciled
			default:
				log.Printf("qif: unknown cleared status %q", data)
			}
		case 'D':
			t, err := time.Parse("01/02/2006", data)
			if err != nil {
				return nil, fmt.Errorf("line %d: %w", r.lineNum, err)
			}
			e.Date = t
		case 'N':
			e.Number = data
		case 'P':
			e.Payee = data
		case 'T':
			f, err := strconv.ParseFloat(data, 32)
			if err != nil {
				return nil, fmt.Errorf("line %d: %w", r.lineNum, err)
			}
			e.Amount = int(f * 100)
		case '^':
			if read {
				return e, nil
			} else {
				// Empty entry. Sometimes signals EOF, but not
				// reliably. Skip it.
				continue
			}
		default:
			log.Printf("qif: unknown field code %q", code)
		}
		read = true
	}
	if read {
		// We read some data but didn't read to the end of a record.
		return nil, fmt.Errorf("line %d: %w", r.lineNum, io.ErrUnexpectedEOF)
	}
	return nil, io.EOF
}
