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

import * as util from './util';
import { Entry } from './types';

export interface Filters {
  hiddenTags: { [tag: string]: boolean };
  query: string;
}

export function filterStateFromURL(params: util.URLParams): Filters {
  var hiddenTags: { [tag: string]: boolean } = {};
  if ('h' in params) {
    for (var t of params['h']) {
      hiddenTags[t] = true;
    }
  }
  var query: string = null;
  if ('q' in params) {
    query = params['q'][0];
  }
  return { hiddenTags, query };
}

export function filterStateToURL(state: Filters) {
  return util.makeURLParams({
    h: Object.keys(state.hiddenTags),
    q: state.query ? [state.query] : null,
  });
}

export function filtersToQuery(filters: Filters): string {
  var query: string[] = [];
  for (var t in filters.hiddenTags) {
    query.push('-t:' + t);
  }
  if (filters.query) {
    query.push(filters.query);
  }
  return query.join(' ');
}

interface TagListProps {
  topTags: { key: string; value: number }[];
  hiddenTags: { [tag: string]: boolean };
  onToggle: (tag: string, on: boolean) => void;
}

export class TagList extends React.Component<TagListProps, {}> {
  render() {
    var hiddenTags = this.props.hiddenTags;

    var showTags: { tag: string; amount?: number }[] = [];
    for (let tag in this.props.hiddenTags) {
      showTags.push({ tag: tag });
    }
    for (let tag of this.props.topTags) {
      if (tag.key in hiddenTags) continue;
      showTags.push({ tag: tag.key, amount: tag.value });
    }
    showTags = showTags.slice(0, 15);

    return (
      <div style={{ WebkitColumnCount: 3 }}>
        {showTags.map((t) => (
          <div key={t.tag}>
            <label>
              <input
                type="checkbox"
                checked={!(t.tag in hiddenTags)}
                onChange={() => {
                  this.onToggle(t.tag, !(t.tag in hiddenTags));
                }}
              />
              {t.tag} {t.amount ? '(' + util.formatAmount(t.amount) + ')' : ''}
            </label>
          </div>
        ))}
      </div>
    );
  }

  onToggle(tag: string, on: boolean) {
    this.props.onToggle(tag, on);
  }
}

export function parseQuery(query: string) {
  var tokens = query.split(/\s+/).filter((t) => t != '');
  var terms = tokens.map((tok) => {
    var negate = false;
    var f: (e: Entry) => boolean = null;
    if (/^-/.test(tok)) {
      negate = true;
      tok = tok.substr(1);
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
  return (e: Entry) => terms.every((term) => term(e));
}
