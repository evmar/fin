.PHONY: all bin web test

all: bin web

web:
	make -C web

bin: bank/* cmd/fin/*
	go build ./cmd/fin

test:
	go test ./...
