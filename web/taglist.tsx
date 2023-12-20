// Copyright 2022 Evan Martin. All Rights Reserved.
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

namespace TagList {
  export interface Props {
    tags: string[];
    tagAmounts: Map<string, number>;
    hidden: Set<string>;
    onToggle: (tag: string, hide: boolean) => void;
  }
  export interface State {
    expand: boolean;
  }
}

export class TagList extends preact.Component<TagList.Props, TagList.State> {
  state = { expand: false };

  render() {
    const tags = this.props.tags;

    const tagRow = (tag: string): preact.JSX.Element | null => {
      let className = 'legend';
      if (this.props.hidden.has(tag)) {
        className += ' hidden';
      } else if (!this.props.tagAmounts.has(tag)) {
        // Tag with no data and no special status; skip.
        return null;
      }
      return (
        <div
          key={tag}
          className="row"
          onClick={(e) => {
            if (e.button == 0) {
              this.onTagClick(tag);
            }
          }}
        >
          <span className={className}>&nbsp;</span>
          {tag == '' ? (
            <span className="tag">
              <em>(untagged)</em>
            </span>
          ) : (
            <span className="tag">{tag}</span>
          )}
          {this.props.tagAmounts.has(tag)
            ? util.formatAmount(this.props.tagAmounts.get(tag)!, true)
            : ''}
        </div>
      );
    };

    let rows = tags.map(tagRow).filter((t) => t != null);
    if (!this.state.expand) {
      rows = rows.slice(0, 10);
    }

    return (
      <div>
        {rows}
        <button
          onClick={() => {
            this.setState({ expand: !this.state.expand });
          }}
        >
          {this.state.expand ? 'less' : 'more'}
        </button>
      </div>
    );
  }

  onTagClick(tag: string) {
    const filtered = this.props.hidden.has(tag);
    this.props.onToggle(tag, !filtered);
  }
}
