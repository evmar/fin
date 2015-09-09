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

var taglib = require('./tags');
var util = require('./util');

function sortOnBy(f, c) {
  return function(a, b) {
    return c(f(a), f(b));
  };
}

exports.filterStateFromURL = function(params) {
  var hiddenTags = {};
  if ('h' in params) {
    for (var t of params.h) {
      hiddenTags[t] = true;
    }
  }
  var query = null;
  if ('q' in params) {
    query = params.q;
  }
  return {hiddenTags, query};
};

exports.filterStateToURL = function(state) {
  return util.makeURLParams({
    h: Object.keys(state.hiddenTags),
    q: state.query || null,
  });
};

exports.filtersToQuery = function(filters) {
  var query = [];
  for (var t in filters.hiddenTags) {
    query.push('-t:' + t);
  }
  if (filters.query) {
    query.push(filters.query);
  }
  return query.join(' ');
};

exports.FilterPane = React.createClass({
  getInitialState() {
    return {showing: false};
  },

  render() {
    var header = (
      <h2 onClick={()=>this.setState({showing:!this.state.showing})}>
        filter &gt;
      </h2>
    );
    if (!this.state.showing) {
      var hiddenTags = Object.keys(this.props.filters.hiddenTags);
      var hiddenDOM = null;
      if (hiddenTags.length > 0) {
        hiddenTags.sort();
        hiddenDOM = <div>hiding: {hiddenTags.join(', ')}</div>;
      }

      var query = this.props.filters.query;
      var queryDOM = null;
      if (query) {
        queryDOM = <div>filter: {query}</div>;
      }

      return (
        <div>
          {header}
          {hiddenDOM}
          {queryDOM}
        </div>
      );
    }
    return (
      <div>
        {header}
        <TagList entries={this.props.entries}
                 hiddenTags={this.props.filters.hiddenTags}
                 onToggle={this.onToggleTag} />
        <label>filter:&nbsp;
          <exports.SearchInput onSearch={this.onSearch}
                               initialText={this.props.filters.query} />
        </label>
      </div>
    );
  },

  onToggleTag(tag, hide) {
    var hiddenTags = this.props.filters.hiddenTags;
    if (tag in hiddenTags) {
      delete hiddenTags[tag];
    } else {
      hiddenTags[tag] = true;
    }
    this.props.onFilters(this.props.filters);
  },

  onSearch(query) {
    this.props.filters.query = query;
    this.props.onFilters(this.props.filters);
  },
});

var TagList = React.createClass({
  render() {
    var tags = d3.entries(taglib.gatherTags(this.props.entries));
    tags = tags.sort(sortOnBy((t) => Math.abs(t.value), d3.descending));
    var hiddenTags = this.props.hiddenTags;

    var showTags = [];
    for (var tag in this.props.hiddenTags) {
      showTags.push({tag:tag});
    }
    for (var tag of tags) {
      if (tag.key in hiddenTags)
        continue;
      showTags.push({tag:tag.key, amount:tag.value});
    }
    showTags = showTags.slice(0, 12);

    return (
      <div style={{WebkitColumnCount:3}}>
        {showTags.map((t) => (
          <div key={t.tag}>
          <label>
          <input type="checkbox"
          checked={!(t.tag in hiddenTags)}
          onChange={this.onToggle.bind(this, t.tag, !(t.tag in hiddenTags))} />
          {t.tag} {t.amount ? '(' + util.formatAmount(t.amount) + ')' : ""}
          </label></div>
         ))}
      </div>
    );
  },

  onToggle(tag, on) {
    this.props.onToggle(tag, on);
  },
});

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
        f = (e) => e.tags && e.tags.filter((t) => t == tag).length > 0;
      }
    } else if (/^[><]/.test(tok)) {
      var amount = parseFloat(tok.substr(1), 10) * 100;
      if (tok[0] == '<') {
        f = (e) => e.amount < amount;
      } else {
        f = (e) => e.amount > amount;
      }
    } else if (/^y:/.test(tok)) {
      var year = tok.substr(2);
      f = (e) => e.date.substr(0, 4) == year;
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
    return null;
  }
  return (e) => terms.every((term) => term(e));
};

exports.SearchInput = React.createClass({
  render() {
    return (
      <input ref="i" type="search" incremental="true"
             defaultValue={this.props.initialText || ''} />
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
