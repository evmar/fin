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

// StringSet models a set of strings.
type StringSet map[string]bool

func NewStringSet() StringSet {
	return make(StringSet)
}

func (s StringSet) Add(str string) {
	s[str] = true
}

func (s StringSet) AddMulti(strs []string) {
	for _, str := range strs {
		s[str] = true
	}
}

func (s StringSet) Remove(str string) {
	delete(s, str)
}

func (s StringSet) Strings() []string {
	var strs []string
	for str, _ := range s {
		strs = append(strs, str)
	}
	return strs
}
