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
	"regexp"
	"sort"

	"github.com/martine/fin/bank/qif"
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
func (se ScoredEntries) Less(a, b int) bool { return se[a].score > se[b].score }
func (se ScoredEntries) Swap(a, b int)      { se[a], se[b] = se[b], se[a] }

func neighbors(desc string, entries []*qif.Entry, n int) []*qif.Entry {
	query := index(desc)

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

	closest := make([]*qif.Entry, 0, n)
	for i := 0; i < n; i++ {
		closest = append(closest, se[i].entry)
	}
	return closest
}

func guessTags(desc string, entries []*qif.Entry, allTags Tags) []string {
	n := 5
	ns := neighbors(desc, entries, n)

	tagCounts := map[string]int{}
	for _, e := range ns {
		tags := allTags[qifId(e)]
		for _, tag := range tags {
			tagCounts[tag]++
		}
	}

	thresh := 0.3
	guess := []string{}
	for t, c := range tagCounts {
		score := float64(c) / float64(n)
		if score > thresh {
			guess = append(guess, t)
		}
	}
	return guess
}
