#!/bin/sh

exec fswatch . --exclude=build | xargs -n1 -I{} ninja
