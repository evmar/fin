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

export type Entry = any;

export function formatAmount(a: number): string {
  return d3.format('$,.2f')(a/100);
}

interface URLParams {
  [key: string]: string[];
}

export function parseURLParams(search: string): URLParams {
  var params: URLParams = {};
  search.substr(1).split('&').forEach((p) => {
    var [key, val] = p.split('=');
    if (!(key in params)) {
      params[key] = [];
    }
    params[key].push(decodeURIComponent(val));
  });
  return params;
}

export function makeURLParams(params: URLParams): string {
  var query = [];
  for (var key in params) {
    var vals = params[key];
    if (vals == null)
      continue;
    for (var val of vals) {
      query.push(key + '=' + encodeURIComponent(val));
    }
  }
  return query.join('&');
}

export function urlWithQuery(url: string, query: string): string {
  var ofs = url.indexOf('?');
  if (ofs > 0) {
    url = url.substr(0, ofs);
  }
  if (query) {
    url += '?' + query;
  }
  return url;
}

export function gatherTags(entries) {
  var tags = {};
  entries.forEach((entry) => {
    if (entry.tags) {
      entry.tags.forEach((tag) => {
        tags[tag] = (tags[tag] || 0) + entry.amount;
      });
    }
  });
  return tags;
}
