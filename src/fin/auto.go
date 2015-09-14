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
	"log"
	"regexp"
	"sort"

	"bank/qif"
)

var indexRe = regexp.MustCompile(`\w+`)

func index(input string) StringSet {
	terms := NewStringSet()
	terms.AddMulti(indexRe.FindAllString(input, -1))
	return terms
}

type ScoredEntry struct {
	score int
	entry *qif.Entry
}
type ScoredEntries []ScoredEntry

func (se ScoredEntries) Len() int           { return len(se) }
func (se ScoredEntries) Less(a, b int) bool { return se[a].score < se[b].score }
func (se ScoredEntries) Swap(a, b int)      { se[a], se[b] = se[b], se[a] }

func neighbors(input string, entries []*qif.Entry, tags Tags) {
	query := index(input)

	se := ScoredEntries{}
	for _, e := range entries {
		terms := index(e.Payee)
		score := 0
		for t := range terms {
			if _, ok := query[t]; ok {
				score++
			}
		}
		se = append(se, ScoredEntry{score, e})
	}
	sort.Sort(se)

	n := 5
	tagCounts := map[string]int{}
	for _, se := range se[len(se)-n:] {
		log.Printf("%d %#v", se.score, se.entry)

	}
}

func autoMain(entries []*qif.Entry, tags Tags) {
	neighbors("BANK OF AMERICA CREDIT CARD Bill", entries, tags)
}
