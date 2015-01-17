JS := ./node_modules/.bin
COFFEE ?= $(JS)/coffee
WEBPACK ?= $(JS)/webpack

JSFILES = d3 react code

.PHONY: all test clean

all: $(JSFILES:%=build/%.js) build/style.css build/view.html fin

build:
	mkdir -p build
	cp static/* build

build/d3.js: third_party/d3/d3.v3.min.js | build
	cp $^ $@

build/react.js: third_party/react/react-0.12.2.js | build
	cp $^ $@

build/code.js: webpack.config.js web/* | build
	$(WEBPACK)

build/style.css: webpack.config.js web/* | build
	$(WEBPACK)

build/view.html: web/view.html
	cp $^ $@

fin: src/* src/*/*
	GOPATH=`pwd` go build fin

test:
	GOPATH=`pwd` go test fin/... bank/...

clean:
	rm -rf build fin
