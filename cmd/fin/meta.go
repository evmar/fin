// Copyright 2022 Evan Martin. All Rights Reserved.
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
	"os"
)

type Meta struct {
	Tags []string `json:"tags"`
}
type Metas map[string]*Meta

func LoadMetas(path string) (Metas, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var metas Metas
	if err := json.NewDecoder(f).Decode(&metas); err != nil {
		return nil, err
	}
	return metas, nil
}

func (m Metas) Save(path string) error {
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

	if err := json.NewEncoder(f).Encode(m); err != nil {
		return err
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
