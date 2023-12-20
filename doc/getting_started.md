# Getting started

## Build instructions

1. Download JS dependencies by running `cd web && npm install`.
2. Build web bundles and server binary by running `make`.

## Input data

Start by downloading a bunch of bank statements from your financial
institutions. Unfortunately there are many different formats with
different tradeoffs, so it's probably best to download a few different
formats and compare the files in a text editor.

The best format I've seen is called "Quicken" by my bank and the files
have `.qif` extensions. They look nearly like plain text with one
data item per line.

There is also another Quicken format with the extension `.qfx`.
For my bank, these exports contain the same data as the `.qif` except
that all the fields are truncated to ~30 letters. This project
includes a parser for `.qfx` files but it may not be complete, so
treat it with caution.

There's also an importer that works with the CSV exports from
Citibank, but it is likely specific to their export format.
Unfortunately their CSV exports contain more data than the other
formats.

## Running

When you tag entries via the UI, the entry tags are saved to a plain
text file. You must specify the path to this file via a command-line
flag; the remainder of the command line is the paths to the input bank
records.

```sh
$ ./fin -tags path/to/tags/file data/*.qif
```
