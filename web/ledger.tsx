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

import { Page } from './page';
import * as util from './util';
import * as filter from './filter';
import * as graph from './graph';
import { Entry } from './types';
import { go } from './app';

namespace LedgerRow {
  export interface Props {
    date: string;
    entry: Entry;
    onClick: () => void;
  }
}

class LedgerRow extends React.Component<LedgerRow.Props> {
  render() {
    const entry = this.props.entry;
    let tags: JSX.Element | undefined;
    if (entry.tags) {
      tags = <span>{entry.tags.map((t) => ' #' + t)}</span>;
    }
    return (
      <div
        className="ledger-entry"
        onClick={() => {
          this.props.onClick();
        }}
      >
        <div className="ledger-date">{this.props.date}</div>
        <div className="ledger-body" title={entry.date}>
          <div className="ledger-payee">{entry.payee}</div>
          <div className="ledger-tags">{tags}</div>
        </div>
        <div className="ledger-money">{util.formatAmount(entry.amount)}</div>
      </div>
    );
  }
}

namespace Ledger {
  export interface Props {
    total?: boolean;
    entries: Entry[];
    onClick?: (e: Entry) => void;
  }
}

export class Ledger extends React.Component<Ledger.Props> {
  render() {
    let entries = this.props.entries.slice(0, 200);

    if (this.props.total) {
      const total = {
        id: 'total',
        date: '',
        payee: 'Total of ' + entries.length + ' entries',
        amount: 0,
      };
      this.props.entries.forEach((e) => (total.amount += e.amount));
      entries.unshift(total);
    }

    let last: string | null = null;
    const rEntries = entries.map((e, i) => {
      var date = e.date.slice(0, 7);
      var next = date;
      if (last != null) {
        if (last == date) {
          date = '';
        }
      }
      last = next;

      return (
        <LedgerRow
          key={e.id.substring(0, 7) + i}
          date={date}
          entry={e}
          onClick={() => {
            if (this.props.onClick) {
              this.props.onClick(e);
            } else {
              go('tag', { id: e.id });
            }
          }}
        />
      );
    });
    return <div className="ledger">{rEntries}</div>;
  }
}

namespace LedgerPage {
  export interface Props {
    params: URLSearchParams;
    entries: Entry[];
    onReload: () => void;
  }
  export interface State {
    filters: filter.Filters;
    graphOpts: graph.GraphOpts;
  }
}

export class LedgerPage extends React.Component<
  LedgerPage.Props,
  LedgerPage.State
> {
  constructor(props: LedgerPage.Props) {
    super(props);
    const filters = filter.filterStateFromURL(this.props.params);
    const graphOpts = {
      normalize: false,
    };
    this.state = { filters, graphOpts };
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
    // Use this.props.entries (not filtered entries) here so that we
    // always sort tags by total volume and so we see all of them in
    // the autocomplete.
    let tagAmounts = util.gatherTags(this.props.entries);
    const tags = Array.from(tagAmounts.keys());
    tags.sort(
      util.sortOnBy((t) => Math.abs(tagAmounts.get(t)!), d3.descending)
    );

    // Regather entries and tag amounts after filtering.
    var entries = this.getEntries();
    tagAmounts = util.gatherTags(entries);

    const opts = (
      <graph.GraphOptsPane
        opts={this.state.graphOpts}
        onChange={(opts) => this.setState({ graphOpts: opts })}
        filters={this.state.filters}
        onFilters={(filters) => this.onFilters(filters)}
        tags={tags}
        tagAmounts={tagAmounts}
      />
    );

    return (
      <Page extraHead={opts}>
        <graph.Graph
          entries={entries}
          opts={this.state.graphOpts}
          width={10 * 64}
          height={3 * 64}
        />
        <Ledger total={true} entries={entries} />
      </Page>
    );
  }

  onTag(entries: Entry[], text: string) {
    var json = {
      tags: text.split(/\s+/).filter((t) => /\w/.test(t)),
      ids: entries.map((e) => e.id),
    };

    var req = new XMLHttpRequest();
    req.onload = () => {
      this.props.onReload();
    };
    req.open('post', '/');
    req.send(JSON.stringify(json));

    return false;
  }

  onFilters(filters: filter.Filters) {
    var search = filter.filterStateToURL(filters);
    this.setState({ filters: filters });
    history.replaceState(
      {},
      '',
      util.urlWithQuery(location.href, filter.filterStateToURL(filters))
    );
  }
}
