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

exports.formatAmount = function formatAmount(a) {
  return d3.format('$,.2f')(a/100);
};

exports.parseURLParams = function parseURLParams(search) {
  var params = {};
  search.substr(1).split('&').forEach((p) => {
    var [key, val] = p.split('=');
    if (!(key in params)) {
      params[key] = [];
    }
    params[key].push(val);
  });
  return params;
};

exports.makeURLParams = function makeURLParams(params) {
  var query = [];
  for (var key in params) {
    var val = params[key];
    if (val == null)
      continue;
    if (typeof val === 'string') {
      val = [val];
    }
    for (var v of val) {
      query.push(key + '=' + v);
    }
  }
  return query.join('&');
};

exports.urlWithQuery = function(url, query) {
  var ofs = url.indexOf('?');
  if (ofs > 0) {
    url = url.substr(0, ofs);
  }
  if (query) {
    url += '?' + query;
  }
  return url;
};
