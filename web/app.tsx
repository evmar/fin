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

import { Entry } from './types';
import * as ledger from './ledger';

class AppShell extends React.Component<
  {},
  {
    entries: Entry[];
  }
> {
  constructor(props: {}) {
    super(props);
    this.state = { entries: [] };
  }

  componentDidMount() {
    this.reload();
  }

  render() {
    if (!this.state.entries) {
      return <div></div>;
    }
    return (
      <ledger.LedgerPage
        entries={this.state.entries}
        onReload={() => {
          this.reload();
        }}
      />
    );
  }

  reload() {
    var req = new XMLHttpRequest();
    req.onload = (e) => {
      this.load(JSON.parse(req.responseText));
    };
    req.open('get', '/data');
    req.send();
  }

  load(data: { entries: Entry[] }) {
    var entries = data.entries;
    entries = entries.filter((e) => e.amount != 0);
    entries = entries.sort((a, b) => d3.descending(a.date, b.date));

    (window as any).data = { entries: entries };
    this.setState({ entries });
  }
}

ReactDOM.render(React.createElement(AppShell), document.body);
