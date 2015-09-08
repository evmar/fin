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

require('./ledger.scss');
var Page = require('./page');
var util = require('./util');
var filter = require('./filter');
var taglib = require('./tags');
var AutoComplete = require('./autocomplete');

var Ledger = React.createClass({
  render: function() {
    var entries = this.props.entries.slice(0, 200);
    //entries = nest.entries(entries);
    var last = null;
    var rEntries = entries.map((e, i) => {
      var date = e.date.slice(0, 7);
      var next = date;
      if (last != null) {
        if (last == date) {
          date = '';
        }
      }
      last = next;

      var tags = null;
      if (e.tags) {
        tags = e.tags.map((t) => ' #' + t);
        tags = <span>{tags}</span>;
      }
      return (
        <div className="ledger-entry" key={i}>
          <div className="ledger-date">{date}</div>
          <div className="ledger-body" title={e.date}>
            <div className="ledger-payee">{e.payee}</div>
            <div className="ledger-tags">{tags}</div>
          </div>
          <div className="ledger-money">{util.formatAmount(e.amount)}</div>
        </div>);
    });
    return (
      <div className="ledger">{rEntries}</div>
    );
  }
});
exports.Ledger = Ledger;

exports.LedgerPage = React.createClass({
  getInitialState() {
    return {filter: null};
  },

  analyzeTags(entries) {
    var tags = {};
    for (var e of entries) {
      if (e.tags) {
        for (var tag of e.tags) {
          tags[tag] = (tags[tag] || 0) + 1;
        }
      }
    }

    var dom = [];
    for (var tag in tags) {
      var frac = tags[tag] / entries.length;
      if (frac > 0.2) {
        dom.push(<span key={tag}>{(frac * 100).toFixed(0)}% {tag};</span>);
      }
    }
    return dom;
  },
  
  getEntries() {
    var entries = this.props.entries;
    var query = [this.state.filter, this.state.query].join(' ');
    var f = filter.parseQuery(query);
    if (f) {
      entries = this.props.entries.filter(f);
    }
    return entries;
  },
  
  render() {
    var entries = this.getEntries();

    var total = 0;
    entries.forEach((e) => total += e.amount);

    var applyTag = null;
    if (this.state.filter || this.state.query) {
      var tags = Object.keys(taglib.gatherTags(entries));
      applyTag = (
        <span>
          Tag: <AutoComplete options={tags}
                             onCommit={this.onTag} />
        </span>
      );
    }

    return (
      <Page title="Ledger" onSearch={this.onSearch}>
        <filter.FilterPane entries={entries} onFilter={this.onFilter} />
        <p>{this.analyzeTags(entries)} {entries.length} entries totalling {util.formatAmount(total)}. {applyTag}
        </p>
        <Ledger entries={entries} tags={this.props.tags} />
      </Page>
    );
  },

  onTag(text) {
    var entries = this.getEntries();
    var json = {
      tags: text.split(/\s+/).filter((t) => /\w/.test(t)),
      ids: entries.map((e) => e.id),
    };

    req = new XMLHttpRequest();
    req.onload = () => window.location.reload();
    req.open('post', '/');
    req.send(JSON.stringify(json))

    return false;
  },

  onSearch(query) {
    this.setState({query: query});
  },
  onFilter(filter) {
    this.setState({filter: filter});
  },
});
