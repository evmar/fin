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
	"flag"
	"fmt"
	"log"
)

func run() error {
	var metasPath string
	flag.StringVar(&metasPath, "meta", "", "path to metas")
	flag.Parse()

	args := flag.Args()
	mode := ""
	if len(args) > 0 {
		mode = args[0]
	}
	if mode == "" {
		return fmt.Errorf("must specify mode")
	}
	args = args[1:]

	switch mode {
	case "web":
		db, err := openDB()
		if err != nil {
			return err
		}

		w := web{
			db: db,
		}
		w.start(":8888")
	case "import":
		if len(args) != 2 {
			fmt.Println("usage: import path name")
			return nil
		}
		db, err := openDB()
		if err != nil {
			return err
		}
		path, name := args[0], args[1]
		return importFile(db, path, name)
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
