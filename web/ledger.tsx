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
import Page = require('./page');
import util = require('./util');
import filter = require('./filter');
import AutoComplete = require('./autocomplete');
import Graph = require('./graph');
import types = require('./types');
type Entry = types.Entry;

class LedgerRow extends React.Component<{
  key: any;
  date: string;
  entry: Entry;
  selected: boolean;
  allTags: string[];
  onTag: {(tags: string)};
  onSel: {()};
}, {}> {
  render() {
    var e = this.props.entry;
    var tags = null;
    if (e.tags) {
      tags = e.tags.map((t) => ' #' + t);
      tags = <span>{tags}</span>;
    }
    var className = 'ledger-entry';
    var editControls = null;
    if (this.props.selected) {
      className += ' sel';
      editControls = <div>
        tag: <AutoComplete options={this.props.allTags}
                           onCommit={(t) => {this.props.onTag(t)}}
                           initialText={(e.tags || []).join(' ')} />
      </div>;
    }
    return (
      <div className={className}
           onClick={() => {this.props.onSel()}}>
        <div className="ledger-date">{this.props.date}</div>
        <div className="ledger-body" title={e.date}>
          <div className="ledger-payee">{e.payee}</div>
          {this.props.selected ? editControls
           : <div className="ledger-tags">{tags}</div>}
        </div>
        <div className="ledger-money">{util.formatAmount(e.amount)}</div>
      </div>
    );
  }
}

interface LedgerProps {
  entries: Entry[];
  tags: string[];
  onTag: {(entries: Entry[], tag: string)};
}

export class Ledger extends React.Component<LedgerProps, {
  sel: number;
}> {
  constructor() {
    super();
    this.state = {sel:null};
  }

  render() {
    var entries = this.props.entries;

    // Make a row for total.
    var total = {
      date:'',
      payee:'Total of ' + entries.length + ' entries',
      amount:0
    };
    entries.forEach((e) => total.amount += e.amount);

    entries = entries.slice(0, 200);
    entries.unshift(total);

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

      return <LedgerRow key={i}
                        date={date} entry={e}
                        selected={this.state.sel != null &&
                                  i == this.state.sel}
                        allTags={this.props.tags}
                        onTag={(t) => {
                               this.props.onTag(i == 0 ? entries : [e],
                                                t);
                               }}
                        onSel={() => {this.setState({sel:i})}}
             />;
    });
    return (
      <div className="ledger">{rEntries}</div>
    );
  }
}

interface LedgerPageProps {
  entries: Entry[];
}

export class LedgerPage extends React.Component<LedgerPageProps, {
  filters: filter.Filters;
}> {
  constructor() {
    super();
    var params = util.parseURLParams(document.location.search);
    var filters = filter.filterStateFromURL(params);
    this.state = {filters};
  }

  getEntries() {
    var entries = this.props.entries;
    var query = filter.filtersToQuery(this.state.filters);
    var f = filter.parseQuery(query);
    if (f) {
      entries = entries.filter(f);
    }
    return entries;
  }
  
  render() {
    var entries = this.getEntries();

    var total = 0;
    entries.forEach((e) => total += e.amount);

    // Use this.props.entries (not entries) here so that we see all
    // tags in the autocomplete.
    var allTags = Object.keys(util.gatherTags(this.props.entries));

    var applyTag = null;
    if (this.state.filters.query) {
      applyTag = (
        <span>
          Tag: <AutoComplete options={allTags}
                             onCommit={(t) => {this.onTag(entries, t)}} />
        </span>
      );
    }

    var topTags = d3.entries(util.gatherTags(entries));
    topTags.sort(util.sortOnBy(
      (t) => Math.abs(t.value), d3.descending));

    return (
      <div>
        <header>
          <h1 className="title">fin</h1>
          <div className="spacer"></div>
          <div>
            <filter.FilterPane filters={this.state.filters} topTags={topTags}
                               onFilters={(filters) => {this.onFilters(filters)}} />
          </div>
        </header>
        <div className="body">
          <main>
            <Graph entries={entries} topTags={topTags} />
            <Ledger entries={entries} tags={allTags}
                    onTag={(e, t) => {this.onTag(e, t)}} />
          </main>
        </div>
      </div>
    );
  }

  onTag(entries, text) {
    var json = {
      tags: text.split(/\s+/).filter((t) => /\w/.test(t)),
      ids: entries.map((e) => e.id),
    };

    var req = new XMLHttpRequest();
    req.onload = () => window.location.reload();
    req.open('post', '/');
    req.send(JSON.stringify(json))

    return false;
  }

  onFilters(filters) {
    var search = filter.filterStateToURL(filters);
    this.setState({filters: filters});
    history.replaceState({}, null,
                         util.urlWithQuery(location.href,
                                           filter.filterStateToURL(filters)));
  }
}
