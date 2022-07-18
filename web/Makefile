BIN := node_modules/.bin

JSFILES = d3 react react-dom code
HTMLFILES = autocomplete view

.PHONY: all bin test clean watch

all: $(JSFILES:%=build/%.js) build/code.css $(HTMLFILES:%=build/%.html)

build:
	mkdir -p build
	cp static/* build

build/d3.js: node_modules/d3/d3.min.js | build
	cp $^ $@

build/react-dom.js: node_modules/react-dom/umd/react-dom.production.min.js | build
	cp $^ $@

build/react.js: node_modules/react/umd/react.production.min.js | build
	cp $^ $@

build/code%js build/code%css: * | build
	$(BIN)/esbuild --bundle app.tsx --outfile=build/code.js
	$(BIN)/esbuild --bundle style.css --outfile=build/code.css

build/%.html: %.html
	cp $^ $@

clean:
	rm -rf build

fmt:
	$(BIN)/prettier --write *.tsx *.css
check-fmt:
	$(BIN)/prettier --check *.tsx *.css
