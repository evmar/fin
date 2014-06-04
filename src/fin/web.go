// Copyright 2014 Google Inc. All Rights Reserved.

package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"sort"

	"bank/qif"
	"fin/tags"
)

var g_tags tags.Tags

func toJson(w io.Writer, entries []*qif.Entry) {
	var jentries []map[string]interface{}
	for _, e := range entries {
		je := make(map[string]interface{})
		id := qifId(e)
		je["id"] = id
		je["number"] = e.Number
		je["date"] = e.Date.Format("2006/01/02")
		je["amount"] = e.Amount
		je["payee"] = e.Payee
		je["addr"] = e.Address
		if tags, ok := g_tags[id]; ok {
			je["tags"] = tags
		}
		jentries = append(jentries, je)
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"entries": jentries,
	})
}

func updateTags(r io.Reader) {
	type tagUpdate struct {
		Tags []string `json:"tags"`
		Ids  []string `json:"ids"`
	}

	var data tagUpdate
	check(json.NewDecoder(r).Decode(&data))

	for _, id := range data.Ids {
		tagset := NewStringSet()
		tagset.AddMulti(g_tags[id])
		for _, tag := range data.Tags {
			if len(tag) == 0 {
				continue
			}
			if tag[0] == '-' {
				tagset.Remove(tag[1:])
			} else {
				tagset.Add(tag)
				tagset[tag] = true
			}
		}
		tags := tagset.Strings()
		sort.Strings(tags)
		g_tags[id] = tags
	}
	g_tags.Save(tagsPath)
}

func webMain(entries []*qif.Entry, tags tags.Tags) {
	g_tags = tags

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}

		if r.Method == "POST" {
			updateTags(r.Body)
			http.Redirect(w, r, "/", 303)
			return
		}

		http.ServeFile(w, r, "view.html")
	})
	http.HandleFunc("/data", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "text/javascript")
		toJson(w, entries)
	})
	http.Handle("/static/", http.StripPrefix("/static/",
		http.FileServer(http.Dir("build"))))

	addr := ":8080"
	log.Printf("listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))

	check(g_tags.Save(tagsPath))
}
