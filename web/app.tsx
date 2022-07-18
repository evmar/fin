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

/** As returned from `/data` endpoint. */
interface DataJSON {
  entries: Entry[];
}

namespace App {
  export interface Props {}
  export interface State {
    entries: Entry[];
  }
}

class App extends React.Component<App.Props, App.State> {
  state = {
    entries: [],
  };

  componentDidMount() {
    this.reload();
  }

  render() {
    if (!this.state.entries) {
      return <div>loading</div>;
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

  async reload() {
    const entries: DataJSON = await (await fetch('/data')).json();
    this.load(entries);
  }

  load(data: DataJSON) {
    let entries = data.entries;
    entries = entries.filter((e) => e.amount != 0);
    entries = entries.sort((a, b) => d3.descending(a.date, b.date));

    (window as any).data = data;
    this.setState({ entries });
  }
}

ReactDOM.render(React.createElement(App), document.body);
