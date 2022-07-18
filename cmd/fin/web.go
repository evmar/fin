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
	"encoding/json"
	"io"
	"log"
	"net/http"
	"sort"

	"github.com/evmar/fin/bank/qif"
)

type web struct {
	tagsPath string
	tags     Tags
	entries  []*qif.Entry
}

func (web *web) toJson(w io.Writer) {
	jentries := []map[string]interface{}{}
	for _, e := range web.entries {
		je := make(map[string]interface{})
		id := qifId(e)
		je["id"] = id
		je["number"] = e.Number
		je["date"] = e.Date.Format("2006/01/02")
		je["amount"] = e.Amount
		je["payee"] = e.Payee
		je["addr"] = e.Address
		if tags, ok := web.tags[id]; ok {
			je["tags"] = tags
		}
		jentries = append(jentries, je)
	}
	data := map[string]interface{}{
		"entries": jentries,
	}
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("encode json: %s", err)
	}
}

func (web *web) updateTagsFromPost(r io.Reader) error {
	type tagUpdate struct {
		Tags []string `json:"tags"`
		Ids  []string `json:"ids"`
	}

	var data tagUpdate
	if err := json.NewDecoder(r).Decode(&data); err != nil {
		return err
	}

	for _, id := range data.Ids {
		tagset := map[string]struct{}{}
		for _, tag := range web.tags[id] {
			tagset[tag] = struct{}{}
		}
		for _, tag := range data.Tags {
			if len(tag) == 0 {
				continue
			}
			if tag[0] == '-' {
				delete(tagset, tag[1:])
			} else {
				tagset[tag] = struct{}{}
			}
		}

		tags := []string{}
		for tag := range tagset {
			tags = append(tags, tag)
		}
		sort.Strings(tags)

		web.tags[id] = tags
	}
	web.tags.Save(web.tagsPath)
	return nil
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
	http.HandleFunc("/data", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")
		web.toJson(w)
	})
	http.Handle("/static/", fs)

	log.Printf("listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
