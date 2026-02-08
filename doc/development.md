# Hacking

## Code overview

`bank` contains Go libraries for loading bank statements.

`cmd/fin` is a Go program that loads the statements and serves the
website. To rebuild it you run `make bin` in the root directory.

`web` is the website. To build you run `npm run serve` in the `web/` subdirectory.

## Setup

```sh
$ cd .git/hooks
$ ln -s ../../pre-commit.sh pre-commit
```

## Hacking the web code

To develop, I bring up the server normally and then run `npm run serve`
in the `web` directory to have esbuild automatically rebuild on
changes, which means I can just reload the browser to see an update.
