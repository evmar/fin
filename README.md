fin: some tools for playing around with bank statements.  
Copyright 2014 Google Inc. All Rights Reserved.

*(Not an official Google project.)*

fin loads up bank (savings account / credit card / etc.) statements
and lets you tag entries, then graph and analyze the data.  It can
easily answer questions like "what is my average monthly spending on
restaurants, and is it growing or shrinking?"

More concretely, fin is a server app (that loads up bank statements
and saves tags) and a website (that dynamically summarizes and graphs
the data).  I guess it's sorta like mint.com, though I've never used
that.

It's intended to only be run locally, so there is no notion of
accounts or security.

# Install / setup

## Build instructions

1. Download JS dependencies by running `cd web && npm install`.
2. Build web bundles and server binary by running `make`.

## Input data

First, you'll download a bunch of bank statements from your financial
institutions.  Unfortunately there are many different formats with
different tradeoffs, so it's probably best to download a few different
formats and compare the files in a text editor.

The best format I've seen is called "Quicken" by my bank and the files
have `.qif` extensions.  They look nearly like plain text with one
data item per line.

There is also another Quicken format with the extension `.qfx` that is
some horrible fake XML (not actually parseable with an XML parser).
For my bank, these exports contain the same data as the `.qif` except
that all the fields are truncated to ~30 letters.  This project
includes a parser for `.qfx` files but it may not be complete, so
treat it with caution.

There's also an importer that works with the CSV exports from
Citibank, but it is likely specific to their export format.
Unfortunately their CSV exports contain more data than the other
formats.

## Running

When you tag entries via the UI, the entry tags are saved to a plain
text file.  You must specify the path to this file via a command-line
flag; the remainder of the command line is the paths to the input bank
records.

    ./fin -tags path/to/tags/file data/*.qif

# Hacking

## Code overview

`bank` contains Go libraries for loading bank statements.

`cmd/fin` is a Go program that loads the statements and serves the
website.  To rebuild it you can run `make bin` in the root directory.

`web` is the website.  All the npm/webpack/typescript/etc. craziness
and build metadata are contained within this directory.  To build you
can run `make` in the `web/` subdirectory.

## Hacking the web code

To develop, I bring up the server normally and then run `make watch`
in the `web` directory to have webpack automatically rebuild on
changes, which means I can just reload the browser to see an update.
