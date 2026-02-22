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

package main

import (
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"net/http"
)

type web struct {
	db *sql.DB
}

func (web *web) toJson(w io.Writer) error {
	entries, err := allEntries(web.db)
	if err != nil {
		return err
	}

	jentries := []map[string]interface{}{}
	for _, e := range entries {
		je := make(map[string]interface{})
		je["id"] = e.ID
		je["date"] = e.Date
		je["amount"] = e.Amount
		je["payee"] = e.Payee
		je["tags"] = e.Tags
		jentries = append(jentries, je)
	}
	data := map[string]interface{}{
		"entries": jentries,
	}
	return json.NewEncoder(w).Encode(data)
}

func (web *web) updateTagsFromPost(r io.Reader) error {
	type tagUpdate struct {
		Tags []string `json:"tags"`
		Ids  []int    `json:"ids"`
	}

	var data tagUpdate
	if err := json.NewDecoder(r).Decode(&data); err != nil {
		return err
	}

	tx, err := web.db.Begin()
	if err != nil {
		return err
	}

	for _, id := range data.Ids {
		for _, tag := range data.Tags {
			if tag[0] == '-' {
				_, err := tx.Exec(`delete from tag where entryid = ? and tag = ?`, id, tag[1:])
				if err != nil {
					return err
				}
			} else {
				_, err := tx.Exec(`insert or ignore into tag (entryid, tag) values (?, ?)`, id, tag)
				if err != nil {
					return err
				}
			}
		}
	}

	return tx.Commit()
}

func (web *web) start(addr string) {
	fs := http.FileServer(http.Dir("web/build"))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			if r.Method == "POST" {
				if err := web.updateTagsFromPost(r.Body); err != nil {
					http.Error(w, err.Error(), 400)
				}
				return
			}

			http.ServeFile(w, r, "web/build/view.html")
			return
		}

		fs.ServeHTTP(w, r)
	})
	http.HandleFunc("/data", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Add("Content-Type", "application/json")
		if err := web.toJson(w); err != nil {
			log.Print(err)
		}
	})
	http.Handle("/static/", fs)

	log.Printf("listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
