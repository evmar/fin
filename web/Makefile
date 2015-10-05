JS := node_modules/.bin
COFFEE ?= $(JS)/coffee
WEBPACK ?= $(JS)/webpack

JSFILES = d3 react code
HTMLFILES = autocomplete view

.PHONY: all bin test clean watch

all: $(JSFILES:%=build/%.js) build/code.css $(HTMLFILES:%=build/%.html)

build:
	mkdir -p build
	cp static/* build

build/d3.js: node_modules/d3/d3.min.js | build
	cp $^ $@

build/react.js: node_modules/react/dist/react.js | build
	cp $^ $@

build/code%js build/code%css: * | build
	$(WEBPACK) --progress

build/%.html: %.html
	cp $^ $@

clean:
	rm -rf build

watch:
	$(JS)/webpack --watch
