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
	"fmt"
	"regexp"

	"bank/qif"
)

func terms(entries []*qif.Entry, tags Tags) {
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

func autoMain(entries []*qif.Entry, tags Tags) {
	terms(entries, tags)
}
