.PHONY: all bin web test

all: bin web

web:
	make -C web

bin: bank/* cmd/fin/*
	go install ./...

test:
	go test ./...
