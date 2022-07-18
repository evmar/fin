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

More docs:
- [Getting started](doc/getting_started.md): how to run;
- [Development tips](doc/development.md): how to hack on the code.
