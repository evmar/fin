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

var Ledger = React.createClass({
  render: function() {
    var entries = this.props.entries.slice(0, 100);
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

exports.LedgerPage = React.createClass({
  getInitialState() {
    return {filter: null};
  },

  render() {
    var entries = this.props.entries;
    if (this.state.filter) {
      entries = this.props.entries.filter(this.state.filter);
    }
    console.log(entries.length);
    return (
      <div>
        <header>
          <div className="title">Ledger</div>
          <div className="spacer"></div>
          <label>
            filter: <filter.SearchInput onSearch={this.onSearch} />
          </label>
        </header>
        <div className="body">
          <main>
            <Ledger entries={entries} tags={this.props.tags} />
          </main>
        </div>
      </div>
    );
  },

  onSearch(query) {
    this.setState({filter: filter.parseQuery(query)});
  },
});
