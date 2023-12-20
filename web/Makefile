BIN := node_modules/.bin

JSFILES = d3 preact code
HTMLFILES = autocomplete view

.PHONY: all bin test clean watch

all: $(JSFILES:%=build/%.js) build/code.css $(HTMLFILES:%=build/%.html)

build:
	mkdir -p build
	cp static/* build

build/d3.js: node_modules/d3/dist/d3.min.js | build
	cp $^ $@

build/preact.js: node_modules/preact/dist/preact.min.js | build
	cp $^ $@

build/code%css: *.css | build
	$(BIN)/esbuild --bundle style.css --outfile=build/code.css

build/code%js: *.ts* | build
	$(BIN)/esbuild --bundle app.tsx --outfile=build/code.js

build/%.html: %.html
	cp $^ $@

clean:
	rm -rf build

watch: | build
	fswatch . --exclude=build | xargs -n1 -I{} make all

fmt:
	$(BIN)/prettier --write *.tsx *.css
check-fmt:
	$(BIN)/prettier --check *.tsx *.css
