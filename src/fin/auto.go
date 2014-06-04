// Copyright 2014 Google Inc. All Rights Reserved.

package main

import (
	"fmt"
	"regexp"

	"bank/qif"
	"fin/tags"
)

func terms(entries []*qif.Entry, tags tags.Tags) {
	type Info struct {
		id, count int
		tags      StringSet
	}
	termInfo := make(map[string]*Info)
	nextId := 1
	re := regexp.MustCompile(`\w+`)
	for _, e := range entries {
		terms := NewStringSet()
		terms.AddMulti(re.FindAllString(e.Payee, -1))
		for t := range terms {
			info, ok := termInfo[t]
			if !ok {
				info = &Info{id: nextId, tags: NewStringSet()}
				termInfo[t] = info
				nextId++
			}
			info.count++
			info.tags.AddMulti(tags[qifId(e)])
		}
	}

	for term, info := range termInfo {
		if info.count == 1 {
			delete(termInfo, term)
		}
	}

	for term, info := range termInfo {
		fmt.Println(info.count, term, info.tags.Strings())
	}
}

func autoMain(entries []*qif.Entry, tags tags.Tags) {
	terms(entries, tags)
}
