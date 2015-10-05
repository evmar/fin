JS := ./node_modules/.bin
COFFEE ?= $(JS)/coffee
WEBPACK ?= $(JS)/webpack

JSFILES = d3 react code
HTMLFILES = autocomplete view

.PHONY: all bin test clean watch

all: $(JSFILES:%=build/%.js) build/code.css $(HTMLFILES:%=build/%.html) bin

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

bin: bank/* cmd/fin/*
	go install ./cmd/fin

test:
	go test ./...

clean:
	rm -rf build

watch:
	$(JS)/webpack --watch
