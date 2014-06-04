JS := ../mutext/node_modules/.bin
COFFEE ?= $(JS)/coffee

JSFILES = d3 react code

.PHONY: all test

all: $(foreach js,$(JSFILES),build/$(js).js) build/style.css fin

build:
	mkdir -p build
	cp static/* build

build/%.js: %.coffee | build
	$(COFFEE) -o build -b -c $<

build/d3.js: third_party/d3/d3.v3.min.js | build
	cp $^ $@

build/react.js: third_party/react/react-0.10.0.js | build
	cp $^ $@

build/style.css: style.css
	cp $^ $@

fin: src/* src/*/*
	GOPATH=`pwd` go build fin

test:
	GOPATH=`pwd` go test fin/... bank/...
