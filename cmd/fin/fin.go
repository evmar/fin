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
	"crypto/sha1"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strconv"

	qifcsv "github.com/evmar/fin/bank/csv"
	"github.com/evmar/fin/bank/qif"
)

func qifId(e *qif.Entry) string {
	h := sha1.New()
	io.WriteString(h, e.Number+"\n")
	io.WriteString(h, e.Date.Format("2006/01/02")+"\n")
	io.WriteString(h, strconv.Itoa(e.Amount)+"\n")
	io.WriteString(h, e.Payee+"\n")
	io.WriteString(h, e.Address+"\n")
	return fmt.Sprintf("%x", h.Sum(nil))
}

type QIFRead interface {
	ReadEntry() (*qif.Entry, error)
}

func parse(path string, entries []*qif.Entry) ([]*qif.Entry, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	fi, err := f.Stat()
	if err != nil {
		return nil, err
	}
	if fi.IsDir() {
		return entries, nil
	}

	var qr QIFRead

	ext := filepath.Ext(path)
	switch ext {
	case ".qif":
		r := qif.NewReader(f)
		ttype, err := r.ReadHeader()
		if err != nil {
			return nil, err
		}
		log.Printf("%s: %q", path, ttype)
		qr = r
	case ".csv", ".CSV":
		r, err := qifcsv.NewCSVReader(f)
		if err != nil {
			return nil, err
		}
		log.Printf("%s: csv", path)
		qr = r
	default:
		log.Printf("%s: unknown format %q", path, ext)
	}

	for {
		entry, err := qr.ReadEntry()
		if err != nil {
			if err == io.EOF {
				break
			}
			return nil, err
		}

		entries = append(entries, entry)
	}

	return entries, nil
}

func run() error {
	var metasPath string
	flag.StringVar(&metasPath, "meta", "", "path to metas")
	flag.Parse()

	mode := ""
	if len(flag.Args()) > 0 {
		mode = flag.Arg(0)
	}
	if mode == "" {
		return fmt.Errorf("must specify mode")
	}

	switch mode {
	case "web":
		if metasPath == "" {
			fmt.Println("must specify tags path")
			flag.PrintDefaults()
			return nil
		}

		metas, err := LoadMetas(metasPath)
		if err != nil {
			return nil
		}

		var entries []*qif.Entry
		for _, path := range flag.Args()[1:] {
			entries, err = parse(path, entries)
			if err != nil {
				return fmt.Errorf("reading %s: %s", path, err.Error())
			}
		}

		w := web{
			entries:   entries,
			metas:     metas,
			metasPath: metasPath,
		}
		w.start(":8888")
	default:
		return fmt.Errorf("unknown mode %q", mode)
	}
	return nil
}

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}
