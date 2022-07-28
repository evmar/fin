// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Entry } from './types';

export interface Filters {
  hiddenTags: Set<string>;
  query?: string;
}

export function filterStateFromURL(params: URLSearchParams): Filters {
  const hiddenTags = new Set<string>();
  const hidden = params.get('h');
  if (hidden) {
    for (const t of hidden.split(',')) {
      hiddenTags.add(t);
    }
  }
  var query: string | null = params.get('q');
  return { hiddenTags, ...(query && { query }) };
}

export function filterStateToURL(state: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (state.hiddenTags) {
    const h = Object.keys(state.hiddenTags).join(',');
    if (h) params.set('h', h);
  }
  if (state.query) {
    params.set('q', state.query);
  }
  return params;
}

export function filtersToQuery(filters: Filters): string {
  var query: string[] = [];
  for (const t of filters.hiddenTags) {
    query.push('-t:' + t);
  }
  if (filters.query) {
    query.push(filters.query);
  }
  return query.join(' ');
}

type QueryFunc = (e: Entry) => boolean;
export function parseQuery(query: string): QueryFunc | undefined {
  var tokens = query.split(/\s+/).filter((t) => t != '');
  var terms = tokens.map((tok) => {
    var negate = false;
    var f: QueryFunc | undefined;
    if (/^-/.test(tok)) {
      negate = true;
      tok = tok.substring(1);
    }
    if (/^t:/.test(tok)) {
      var tag = tok.substring(2);
      if (tag == '') {
        f = (e) => !!e.tags;
      } else {
        f = (e) => {
          return e.tags?.includes(tag) ?? false;
        };
      }
    } else if (/^[><]/.test(tok)) {
      var amount = parseFloat(tok.substring(1)) * 100;
      if (tok[0] == '<') {
        f = (e) => e.amount < amount;
      } else {
        f = (e) => e.amount > amount;
      }
    } else if (/^y:/.test(tok)) {
      var year = tok.substring(2);
      f = (e) => e.date.substring(0, 4) == year;
    } else {
      var r = new RegExp(tok, 'i');
      f = (e) => r.test(e.payee);
    }
    if (negate) {
      var inner = f;
      f = (e) => !inner(e);
    }
    return f;
  });
  if (!terms.length) {
    return undefined;
  }
  return (e: Entry) => terms.every((term) => term(e));
}
