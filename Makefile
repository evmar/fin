JS := ./node_modules/.bin
COFFEE ?= $(JS)/coffee
WEBPACK ?= $(JS)/webpack

JSFILES = d3 react code

.PHONY: all test clean serve

all: $(JSFILES:%=build/%.js) build/code.css build/view.html build/autocomplete.html fin

build:
	mkdir -p build
	cp static/* build

build/d3.js: node_modules/d3/d3.min.js | build
	cp $^ $@

build/react.js: node_modules/react/dist/react.js | build
	cp $^ $@

build/code.js: webpack.config.js web/* | build
	$(WEBPACK) --progress

build/code.css: webpack.config.js web/* | build
	$(WEBPACK) --progress

build/view.html: web/view.html
	cp $^ $@

build/autocomplete.html: web/autocomplete.html
	cp $^ $@


fin: src/* src/*/*
	GOPATH=`pwd` go build fin

test:
	GOPATH=`pwd` go test fin/... bank/...

clean:
	rm -rf build fin

serve:
	$(JS)/webpack-dev-server --devtool eval --progress --colors --hot --content-base build
