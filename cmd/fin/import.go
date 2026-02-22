// Copyright 2026 Evan Martin. All Rights Reserved.
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

package main

import (
	"database/sql"
	"io"
	"log"
	"os"
	"path/filepath"

	qifcsv "github.com/evmar/fin/bank/csv"
	"github.com/evmar/fin/bank/qif"
)

type QIFRead interface {
	ReadEntry() (*qif.Entry, error)
}

func parse(path string) ([]*qif.Entry, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var entries []*qif.Entry
	var qr QIFRead

	ext := filepath.Ext(path)
	switch ext {
	case ".qif":
		r := qif.NewReader(f)
		ttype, err := r.ReadHeader()
		if err != nil {
			return nil, err
		}
		log.Printf("%s: %q", path, ttype)
		qr = r
	case ".csv", ".CSV":
		r, err := qifcsv.NewCSVReader(f)
		if err != nil {
			return nil, err
		}
		log.Printf("%s: csv", path)
		qr = r
	default:
		log.Printf("%s: unknown format %q", path, ext)
	}

	for {
		entry, err := qr.ReadEntry()
		if err != nil {
			if err == io.EOF {
				break
			}
			return nil, err
		}

		entries = append(entries, entry)
	}

	return entries, nil
}

func importFile(db *sql.DB, path, name string) error {
	entries, err := parse(path)
	if err != nil {
		return err
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	for _, entry := range entries {
		_, err := tx.Exec("insert into entry (source, date, payee, amount) values (?, ?, ?, ?)",
			name, entry.Date.Format("2006/01/02"), entry.Payee, entry.Amount,
		)
		if err != nil {
			return err
		}
	}
	return tx.Commit()
}
