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

import * as preact from "preact";

interface Props {
  initialText: string;
  onSearch: (query: string) => void;
}

export default class SearchInput extends preact.Component<Props> {
  render() {
    return (
      <input
        type='search'
        autoFocus
        placeholder='search'
        defaultValue={this.props.initialText}
        incremental='1'
        onSearch={(e) => this.onSearch(e)}
      />
    );
  }

  onSearch(e: Event) {
    const input = e.target as HTMLInputElement;
    this.props.onSearch(input.value);
  }
}
