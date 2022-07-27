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

export function formatAmount(a: number, dollars?: boolean): string {
  a /= 100;
  if (dollars) {
    return d3.format('$,.0f')(a);
  } else {
    return d3.format('$,.2f')(a);
  }
}

export function urlWithQuery(url: string, query: URLSearchParams): string {
  var ofs = url.indexOf('?');
  if (ofs > 0) {
    url = url.substring(0, ofs);
  }
  if (query) {
    const queryString = query.toString();
    if (queryString) url += '?' + queryString;
  }
  return url;
}

export function gatherTags(entries: Entry[]): {[tag:string]:number} {
  var tagCounts: {[tag:string]:number} = {};
  entries.forEach((entry) => {
    var tags: string[] = entry.tags || [''];
    tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + entry.amount;
    });
  });
  return tagCounts;
}

export function sortOnBy(f:(t:string)=>number, c:(a:number,b:number)=>number) {
  return function(a:string, b:string) {
    return c(f(a), f(b));
  };
}

function arrayEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function memo<P extends unknown[], R>(f: (...p: P) => R): (...p: P) => R {
  let lastArgs: P|undefined;
  let lastRet: R|undefined;
  return function(...p: P): R {
    if (lastArgs === undefined || !arrayEqual(lastArgs, p)) {
      lastArgs = p;
      lastRet = f(...p);
    }
    return lastRet!;
  };
}
