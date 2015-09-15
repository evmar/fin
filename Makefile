JS := ./node_modules/.bin
COFFEE ?= $(JS)/coffee
WEBPACK ?= $(JS)/webpack

JSFILES = d3 react code
HTMLFILES = autocomplete view

.PHONY: all test clean watch

all: $(JSFILES:%=build/%.js) build/code.css $(HTMLFILES:%=build/%.html) fin

build:
	mkdir -p build
	cp static/* build/

build/d3.js: node_modules/d3/d3.min.js | build
	cp $^ $@

build/react.js: node_modules/react/dist/react.js | build
	cp $^ $@

build/code%js build/code%css: webpack.config.js web/* | build
	$(WEBPACK) --progress

build/%.html: web/%.html
	cp $^ $@

fin: src/* src/*/*
	GOPATH=`pwd` go build fin

test:
	GOPATH=`pwd` go test fin/... bank/...

clean:
	rm -rf build fin

watch:
	$(JS)/webpack --watch
