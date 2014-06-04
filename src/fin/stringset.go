// Copyright 2014 Google Inc. All Rights Reserved.

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
