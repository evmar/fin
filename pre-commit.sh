#!/bin/sh

set -e

make test
make -C web check-fmt
