// Copyright 2014 Google Inc. All Rights Reserved.

package tags

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strings"
)

type Tags map[string][]string

func Load(path string) (Tags, error) {
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
	for k, _ := range t {
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
