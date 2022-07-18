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
	"bufio"
	"fmt"
	"os"
	"sort"
	"strings"
)

type Tags map[string][]string

func LoadTags(path string) (Tags, error) {
	t := make(map[string][]string)

	f, err := os.Open(path)
	if err != nil {
		if os.IsNotExist(err) {
			return t, nil
		}
		return nil, err
	}

	s := bufio.NewScanner(f)
	for s.Scan() {
		parts := strings.Split(s.Text(), " ")
		key := parts[0]
		for _, tag := range parts[1:] {
			if tag != "" {
				t[key] = append(t[key], tag)
			}
		}
	}
	if err := s.Err(); err != nil {
		return nil, err
	}
	return t, nil
}

func (t Tags) Save(path string) error {
	tpath := path + ".tmp"
	f, err := os.Create(tpath)
	if err != nil {
		return err
	}
	defer func() {
		if tpath != "" {
			os.Remove(tpath)
		}
	}()

	var keys []string
	for k := range t {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	for _, k := range keys {
		v := t[k]
		if _, err := fmt.Fprintf(f, "%s %s\n", k, strings.Join(v, " ")); err != nil {
			return err
		}
	}

	if err := f.Close(); err != nil {
		return err
	}

	if err = os.Rename(tpath, path); err != nil {
		return err
	}
	tpath = ""
	return nil
}
