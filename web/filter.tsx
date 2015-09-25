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

require('./filter.scss');
import * as util from './util';
import {Entry} from './types';

export interface Filters {
  hiddenTags: {[tag:string]:boolean};
  query: string;
}

export function filterStateFromURL(params): Filters {
  var hiddenTags: {[tag:string]:boolean} = {};
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
}

export function filterStateToURL(state: Filters) {
  return util.makeURLParams({
    h: Object.keys(state.hiddenTags),
    q: state.query ? [state.query] : null,
  });
}

export function filtersToQuery(filters: Filters) {
  var query = [];
  for (var t in filters.hiddenTags) {
    query.push('-t:' + t);
  }
  if (filters.query) {
    query.push(filters.query);
  }
  return query.join(' ');
}

interface FilterPaneProps extends React.Props<any> {
  filters: Filters;
  topTags: {key: string; value: number}[];
  onFilters: {(filters:Filters)};
}

export class FilterPane extends React.Component<FilterPaneProps, {
  showing: boolean;
}> {
  constructor() {
    super();
    this.state = {showing: false};
  }

  render() {
    var hiddenTags = Object.keys(this.props.filters.hiddenTags);
    hiddenTags.sort();
    var query = this.props.filters.query;

    var popup = null;
    if (this.state.showing) {
      popup = (
        <div>
          <div className='filter-click-catch'
               onClick={()=>this.setState({showing:false})}></div>
          <div className='filter-pane-popup'>
            <label>filter:&nbsp;
              <SearchInput onSearch={(q) => {this.onSearch(q)}}
                           initialText={this.props.filters.query} />
            </label>
            <TagList topTags={this.props.topTags}
                     hiddenTags={this.props.filters.hiddenTags}
                     onToggle={(t, on) => {this.onToggleTag(t, on)}} />
          </div>
        </div>
      );
    }
    
    return (
      <div className='filter-pane'>
        {popup}
        <div className='filter-pane-popdown'
             onClick={()=>this.setState({showing:true})}>
          filter &gt;
          {hiddenTags.length > 0 ? <div>hiding: {hiddenTags.join(', ')}</div> : null}
          {query ? <div>filter: {query}</div> : null}
        </div>
      </div>
    );
  }

  onToggleTag(tag, hide) {
    var hiddenTags = this.props.filters.hiddenTags;
    if (tag in hiddenTags) {
      delete hiddenTags[tag];
    } else {
      hiddenTags[tag] = true;
    }
    this.props.onFilters(this.props.filters);
  }

  onSearch(query) {
    this.props.filters.query = query;
    this.props.onFilters(this.props.filters);
  }
}

interface TagListProps {
  topTags: {key: string; value: number}[];
  hiddenTags: {[tag:string]:boolean};
  onToggle: {(tag: string, on: boolean)};
}

export class TagList extends React.Component<TagListProps, {}> {
  render() {
    var hiddenTags = this.props.hiddenTags;

    var showTags = [];
    for (let tag in this.props.hiddenTags) {
      showTags.push({tag:tag});
    }
    for (let tag of this.props.topTags) {
      if (tag.key in hiddenTags)
        continue;
      showTags.push({tag:tag.key, amount:tag.value});
    }
    showTags = showTags.slice(0, 15);

    return (
      <div style={{WebkitColumnCount:3}}>
        {showTags.map((t) => (
          <div key={t.tag}>
          <label>
          <input type="checkbox"
          checked={!(t.tag in hiddenTags)}
          onChange={() => {this.onToggle(t.tag, !(t.tag in hiddenTags))}} />
          {t.tag} {t.amount ? '(' + util.formatAmount(t.amount) + ')' : ""}
          </label></div>
         ))}
      </div>
    );
  }

  onToggle(tag, on) {
    this.props.onToggle(tag, on);
  }
}

export function parseQuery(query) {
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
      var amount = parseFloat(tok.substr(1)) * 100;
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
}

interface SearchInputProps extends React.Props<any> {
  initialText: string;
  onSearch: {(query: string)};
}

// TypeScript/React don't know about <input type=search> so we have to
// hook it up more manually than usual.
export class SearchInput extends React.Component<SearchInputProps, {}> {
  render() {
    return (
      <input ref="i" type="search" autoFocus
             defaultValue={this.props.initialText || ''} />
    );
  }

  getInput(): HTMLInputElement {
    return React.findDOMNode<HTMLInputElement>(this.refs['i']);
  }

  componentDidMount() {
    var i = this.getInput();
    (i as any).incremental = true;
    i.addEventListener('search', () => this.onSearch());
  }

  onSearch() {
    var query = this.getInput().value;
    this.props.onSearch(query);
  }
}
