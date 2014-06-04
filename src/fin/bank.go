// Copyright 2014 Google Inc. All Rights Reserved.

package main

import (
	"crypto/sha1"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"

	"bank/qif"
	"fin/tags"
)

const tagsPath = "tags"

func check(err error) {
	if err != nil {
		panic(err)
	}
}

func qifId(e *qif.Entry) string {
	h := sha1.New()
	io.WriteString(h, e.Number+"\n")
	io.WriteString(h, e.Date.Format("2006/01/02")+"\n")
	io.WriteString(h, strconv.Itoa(e.Amount)+"\n")
	io.WriteString(h, e.Payee+"\n")
	io.WriteString(h, e.Address+"\n")
	return fmt.Sprintf("%x", h.Sum(nil))
}

func parse(path string, entries []*qif.Entry) []*qif.Entry {
	f, err := os.Open(path)
	check(err)
	defer f.Close()

	r := qif.NewReader(f)
	ttype, err := r.ReadHeader()
	if err != nil {
		err = fmt.Errorf("reading %s: %s", path, err.Error())
		check(err)
	}
	log.Printf("type %q\n", ttype)

	for {
		entry, err := r.ReadEntry()
		if err != nil {
			if err == io.EOF {
				break
			}
			check(err)
		}
		if entry.Payee == "" {
			continue
		}

		entries = append(entries, entry)
	}

	return entries
}

func main() {
	tags, err := tags.Load(tagsPath)
	check(err)

	var entries []*qif.Entry
	for _, arg := range os.Args[1:] {
		entries = parse(arg, entries)
	}

	webMain(entries, tags)
}
