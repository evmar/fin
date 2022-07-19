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
import AutoComplete from './autocomplete';
import * as graph from './graph';
import { Entry } from './types';
import { go } from './app';

interface LedgerRowProps {
  key: any;
  date: string;
  entry: Entry;
  selected: boolean;
  allTags: string[];
  onTag: (tags: string) => void;
  onClick: () => void;
}

class LedgerRow extends React.Component<
  LedgerRowProps,
  {
    tagSuggestions?: string[];
  }
> {
  constructor(props: LedgerRowProps) {
    super(props);
    this.state = { tagSuggestions: [] };
  }
  render() {
    var e = this.props.entry;
    var tags: JSX.Element | undefined;
    if (e.tags) {
      tags = <span>{e.tags.map((t) => ' #' + t)}</span>;
    }
    var className = 'ledger-entry';
    var editControls: JSX.Element | undefined;
    if (this.props.selected) {
      className += ' sel';
      editControls = (
        <div>
          tag:&nbsp;
          <AutoComplete
            options={this.props.allTags}
            onCommit={(t) => {
              this.props.onTag(t);
            }}
            initialText={(e.tags || []).join(' ')}
            placeholder={
              this.state.tagSuggestions
                ? this.state.tagSuggestions.join(' ')
                : ''
            }
          />
        </div>
      );
    }
    return (
      <div
        className={className}
        onClick={() => {
          this.props.onClick();
        }}
      >
        <div className="ledger-date">{this.props.date}</div>
        <div className="ledger-body" title={e.date}>
          <div className="ledger-payee">{e.payee}</div>
          {this.props.selected ? (
            editControls
          ) : (
            <div className="ledger-tags">{tags}</div>
          )}
        </div>
        <div className="ledger-money">{util.formatAmount(e.amount)}</div>
      </div>
    );
  }
}

namespace Ledger {
  export interface Props {
    total?: boolean;
    entries: Entry[];

    /** Used in inline tagging, getting removed soon */
    tags?: string[];
    onTag?: (entries: Entry[], tag: string) => void;
  }
}

export class Ledger extends React.Component<
  Ledger.Props,
  {
    sel: string | null;
  }
> {
  constructor(props: Ledger.Props) {
    super(props);
    this.state = { sel: null };
  }

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
          selected={this.state.sel != null && e.id == this.state.sel}
          allTags={this.props.tags ?? []}
          onTag={(t) => {
            this.props.onTag?.(i == 0 ? entries : [e], t);
          }}
          onClick={() => {
            if (this.props.tags) {
              this.setState({ sel: e.id });
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
    params: util.URLParams;
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
      stack: new Set<string>(),
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
    var tagAmounts = util.gatherTags(this.props.entries);
    var tags = Object.keys(tagAmounts);
    tags.sort(util.sortOnBy((t) => Math.abs(tagAmounts[t]), d3.descending));

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
          tags={tags}
          opts={this.state.graphOpts}
          width={10 * 64}
          height={3 * 64}
        />
        <Ledger total={true} entries={entries} tags={tags} />
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
