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

// TypeScript/React don't know about <input type=search> so we have to
// hook it up more manually than usual.

interface SearchInputProps extends React.Props<any> {
  initialText: string;
  onSearch: {(query: string)};
}

export default class SearchInput extends React.Component<SearchInputProps, {}> {
  render() {
    return (
      <input ref="i" type="search" autoFocus
             placeholder="search"
             defaultValue={this.props.initialText} />
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
