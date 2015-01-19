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

exports.parseQuery = function(query) {
  var tokens = query.split(/\s+/).filter((t) => t != '');
  var terms = tokens.map((tok) => {
    var negate = false;
    var f = null;
    if (/^-/.test(tok)) {
      negate = true
      tok = tok.substr(1)
    }
    if (/^t:/.test(tok)) {
      var tag = tok.substr(2);
      if (tag == '') {
        f = (e) => !!e.tags;
      } else {
        f = (e) => e.tags && tok in e.tags;
      }
    } else {
      var r = new RegExp(tok, 'i');
      f = (e) => r.test(e.payee);
      var y = 4;

    }
    if (negate) {
      f = (e) => !f(e);
    }
    return f;
  });
  if (!terms.length) {
    return null;
  }
  return (e) => terms.every((term) => term(e));
};

exports.SearchInput = React.createClass({
  render() {
    return (
      <input ref="i" type="search" incremental="true" />
    );
  },

  componentDidMount() {
    var i = this.refs.i.getDOMNode();
    i.incremental = true;
    i.addEventListener('search', this.search);
  },

  search() {
    var query = this.refs.i.getDOMNode().value;
    this.props.onSearch(query);
  },
});
