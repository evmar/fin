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

// Package qfx is an incomplete parser for Quicken's OFX format.
package qfx

// QFX is Quicken's variant of OFX.  OFX has a downloadable spec at
// http://www.ofx.net; the current spec is 3.9mb when zipped.  :~(
//
// NOTE: this implementation is incomplete.  I discovered that my
// exports less data via QFX than it does via the much simpler QIF
// format.

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"strings"
)

type Token int

const (
	tHeader Token = iota
	tWhitespace
	tOpenTag
	tCloseTag
	tText
)

type scanner struct {
	r      io.Reader
	cur    []byte
	buf    [16 << 10]byte
	inBody bool
}

func (s *scanner) fill() error {
	if cap(s.cur)-len(s.cur) < 1024 {
		log.Printf("shifting %d bytes back", len(s.cur))
		copy(s.buf[0:len(s.cur)], s.cur)
		s.cur = s.buf[0:len(s.cur)]
	}

	if s.r != nil {
		n, err := s.r.Read(s.buf[len(s.cur):cap(s.cur)])
		log.Printf("read %d bytes", n)
		s.cur = s.cur[0 : len(s.cur)+n]
		if err != nil {
			if err == io.EOF {
				log.Printf("EOF")
				s.r = nil
			} else {
				return err
			}
		}
	}
	return nil
}

func checkCRLF(data []byte, nl int) error {
	if nl < 1 || data[nl-1] != '\r' {
		return fmt.Errorf("error finding CRLF near %q", data[nl-1])
	}
	return nil
}

func (s *scanner) next() (tok Token, data []byte, err error) {
	if len(s.cur) < 1024 {
		if err = s.fill(); err != nil {
			return
		}
	}
	if len(s.cur) == 0 {
		err = io.EOF
		return
	}

	if !s.inBody {
		// Scan headers.
		end := bytes.Index(s.cur, []byte{'\n'})
		if end == -1 {
			err = fmt.Errorf("error parsing header near %q", s.cur)
			return
		}
		if err = checkCRLF(s.cur, end); err != nil {
			return
		}
		tok = tHeader
		data = s.cur[0 : end-1]
		s.cur = s.cur[end+1:]
		if len(data) == 0 {
			s.inBody = true
		}
		return
	}

	switch s.cur[0] {
	case '<':
		end := bytes.Index(s.cur, []byte{'>'})
		if end == -1 {
			err = fmt.Errorf("error parsing tag near %q", s.cur)
			return
		}
		if s.cur[1] == '/' {
			tok = tCloseTag
			data = s.cur[2:end]
		} else {
			tok = tOpenTag
			data = s.cur[1:end]
		}
		s.cur = s.cur[end+1:]
		return
	case '\r':
		if err = checkCRLF(s.cur, 1); err != nil {
			return
		}
		tok = tWhitespace
		data = s.cur[0:0]
		s.cur = s.cur[2:]
		return
	default:
		end := bytes.Index(s.cur, []byte{'\n'})
		if end == -1 {
			err = fmt.Errorf("error finding end of line near %q", s.cur)
			return
		}
		if err = checkCRLF(s.cur, end); err != nil {
			return
		}
		tok = tText
		data = s.cur[0 : end-1]
		s.cur = s.cur[end+1:]
		return
	}
}

type Reader struct {
	s scanner
}

type Header map[string]string

func NewReader(r io.Reader) *Reader {
	rd := &Reader{}
	rd.s.r = r
	rd.s.cur = rd.s.buf[0:0]
	return rd
}

func (r *Reader) ReadHeader() (Header, error) {
	h := make(Header)
	for {
		tok, data, err := r.s.next()
		if err != nil {
			return nil, err
		}
		if tok != tHeader {
			return nil, fmt.Errorf("unexpected content near %q", r.s.cur)
		}
		if len(data) == 0 {
			break
		}

		parts := bytes.SplitN(data, []byte{':'}, 2)
		if len(parts) != 2 {
			return nil, fmt.Errorf("bad header line: %q", data)
		}
		h[string(parts[0])] = string(parts[1])
	}
	return h, nil
}

func strIndent(indent int) (str string) {
	for i := 0; i < indent; i++ {
		str = str + "  "
	}
	return
}

func (r *Reader) Read() {
	var stack []string

	for {
		tok, data, err := r.s.next()
		if err != nil {
			if err == io.EOF {
				break
			}
			panic(err)
		}
		switch tok {
		case tWhitespace:
			continue
		case tOpenTag:
			stack = append(stack, string(data))
			fmt.Printf("<%s>", data)
		case tCloseTag:
			top := stack[len(stack)-1]
			if string(data) != top {
				log.Printf("stack mismatch: got %q, stack %v")
			}
			stack = stack[0 : len(stack)-1]
			fmt.Printf("</%s>", data)
		case tText:
			top := stack[len(stack)-1]
			fmt.Printf("%s</%s>", strings.Replace(string(data), "&", "&amp;", -1), top)
			log.Printf("scanned text: %q -> %q", top, data)
			stack = stack[0 : len(stack)-1]
		default:
			panic("unexpected tok")
		}
	}
	log.Printf("done")
}
