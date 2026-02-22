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
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

type Entry struct {
	ID     int
	Source string
	Date   string
	Payee  string
	Amount int
	Tags   []string
}

type Tag struct {
	EntryID uint
	Tag     string
}

func openDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "fin.db")
	if err != nil {
		return nil, err
	}

	_, err = db.Exec(`
	create table if not exists entry (
		id integer primary key,
		source text,
		date text,
		payee text,
		amount integer
	)
	`)
	if err != nil {
		return nil, err
	}

	_, err = db.Exec(`
	create table if not exists tag (
		entryid integer not null,
		tag string not null,
		primary key (entryid, tag)
	)
	`)
	if err != nil {
		return nil, err
	}

	return db, nil
}

func allEntries(db *sql.DB) ([]*Entry, error) {
	var entries []*Entry
	byId := map[int]*Entry{}

	rows, err := db.Query(`select id, source, date, payee, amount from entry`)
	if err != nil {
		return nil, fmt.Errorf("select entries: %e", err)
	}
	defer rows.Close()
	for rows.Next() {
		e := &Entry{}
		if err := rows.Scan(&e.ID, &e.Source, &e.Date, &e.Payee, &e.Amount); err != nil {
			return nil, fmt.Errorf("scan: %e", err)
		}
		byId[e.ID] = e
		entries = append(entries, e)
	}

	rows, err = db.Query(`select entryid, tag from tag`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var id int
		var tag string
		if err := rows.Scan(&id, &tag); err != nil {
			return nil, fmt.Errorf("scan: %e", err)
		}
		e := byId[id]
		e.Tags = append(e.Tags, tag)
	}

	return entries, nil
}
