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

import {Entry} from './types';

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

export function gatherTags(entries: Entry[]): {[tag:string]:number} {
  var tags: {[tag:string]:number} = {};
  entries.forEach((entry) => {
    if (entry.tags) {
      entry.tags.forEach((tag) => {
        tags[tag] = (tags[tag] || 0) + entry.amount;
      });
    }
  });
  return tags;
}

function epanKernel(scale) {
  return function(u) {
    return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
  };
}

function norm(k) {
  var s = d3.sum(k);
  return k.map((v) => v / s);
}

function conv(k, distf) {
  var w = Math.floor(k.length / 2);
  return function(data) {
    return data.map((x, i) => {
      var s = 0;
      for (var j = -w; j <= w; j++) {
        var x1 = data[i+j];
        if (!x1)
          continue;
        var ki = distf(x1[0] - x[0]) + w;
        if (!k[ki])
          continue;
        s += k[ki] * x1[1];
      }
      return [x[0], s];
    });
  };
}

function smooth(data) {
  var kern = [];
  var window = 1;
  for (var j = -window; j <= window; j++) {
    kern.push(epanKernel(1)(j / window));
  }

  kern = norm(kern);

  var c = conv(kern, (d) => d / 86400000);
  return c(data);
}

export function sortOnBy(f, c) {
  return function(a, b) {
    return c(f(a), f(b));
  };
}

export function setToArray<T>(s: Set<T>): T[] {
  var arr = [];
  s.forEach((e) => arr.push(e));
  return arr;
}
