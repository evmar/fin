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

import * as ledger from './ledger';
import { OverviewPage } from './overview';
import { TaggerPage, UntaggedPage } from './tagger';
import { Entry } from './types';
import * as util from './util';

let appShell!: AppShell;

interface URLs {
  ledger: unknown;
  untagged: unknown;
  tag: { id: string };
}

export function link<V extends keyof URLs>(
  text: string,
  view: V,
  viewData: URLs[V],
) {
  const params = new URLSearchParams({ view, ...((viewData ?? {}) as {}) });
  const url = util.urlWithQuery(location.href, params);
  return (
    <a
      href={url}
      onClick={(e) => {
        go(view, viewData);
        e.preventDefault();
      }}
    >
      {text}
    </a>
  );
}

export function go<V extends keyof URLs>(view: V, viewData: URLs[V]) {
  const params = new URLSearchParams({ view, ...((viewData ?? {}) as {}) });
  const url = util.urlWithQuery(location.href, params);

  history.pushState(undefined, '', url);
  appShell.setState({ params });
}

export function reload() {
  appShell.load();
}

/** As returned from `/data` endpoint. */
interface DataJSON {
  entries: Entry[];
}

namespace App {
  export interface Props {
    params: URLSearchParams;
    entries: Entry[];
  }
}

class App extends preact.Component<App.Props> {
  render() {
    const { params } = this.props;
    const view = params.get('view') ?? 'overview';
    switch (view) {
      case 'overview':
        return <OverviewPage entries={this.props.entries} />;
      case 'untagged':
        return <UntaggedPage params={params} entries={this.props.entries} />;
      case 'tag': {
        const param = params.get('id')!;
        const ids = param.split(',');
        return <TaggerPage key={param} entries={this.props.entries} ids={ids} />;
      }
      case 'ledger':
        return (
          <ledger.LedgerPage
            params={params}
            entries={this.props.entries}
            onReload={() => {
              throw new Error('todo');
            }}
          />
        );
    }
    throw new Error('unhandled view');
  }
}

namespace AppShell {
  export interface State {
    params: URLSearchParams;
    entries?: Entry[];
  }
}

/** Manages initial load and URL popstate. */
class AppShell extends preact.Component<{}> {
  state: AppShell.State = {
    params: new URLSearchParams(),
  };

  componentDidMount() {
    appShell = this;
    this.stateFromURL();
    window.onpopstate = () => {
      this.stateFromURL();
    };
    this.load();
  }

  stateFromURL() {
    const params = new URLSearchParams(document.location.search);
    this.setState({ params });
  }

  async load() {
    const data: DataJSON = await (await fetch('/data')).json();

    let entries = data.entries;
    entries = entries.filter((e) => e.amount != 0);
    entries = entries.sort((a, b) => d3.descending(a.date, b.date));

    (window as any).data = data;
    this.setState({ entries });
  }

  render() {
    if (!this.state.entries) {
      return <div>loading</div>;
    }

    return <App params={this.state.params} entries={this.state.entries} />;
  }
}

preact.render(<AppShell />, document.body);
