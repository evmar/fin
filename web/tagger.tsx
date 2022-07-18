import { Ledger } from './ledger';
import { Page } from './page';
import { Entry } from './types';
import { memo, URLParams } from './util';
import * as app from './app';

namespace UntaggedPage {
  export interface Props {
    params: URLParams;
    entries: Entry[];
  }
}

interface Stats {
  totalCount: number;
  totalAmount: number;
  untaggedCount: number;
  untaggedAmount: number;
}

export class UntaggedPage extends React.Component<UntaggedPage.Props> {
  computeStats(entries: Entry[]): Stats {
    const stats = {
      totalCount: 0,
      totalAmount: 0,
      untaggedCount: 0,
      untaggedAmount: 0,
    };
    for (const entry of entries) {
      if (entry.tags?.includes('transfer')) {
        continue;
      }

      stats.totalCount++;
      stats.totalAmount += Math.abs(entry.amount);
      if (!entry.tags) {
        stats.untaggedCount++;
        stats.untaggedAmount += Math.abs(entry.amount);
      }
    }
    return stats;
  }
  stats = memo(this.computeStats);

  topUntagged(): Entry[] {
    let top = this.props.entries.filter((e) => !e.tags);
    top.sort((a, b) => d3.descending(Math.abs(a.amount), Math.abs(b.amount)));
    return top.slice(0, 50);
  }

  render() {
    const stats = this.stats(this.props.entries);
    return (
      <Page>
        <p>
          {stats.untaggedCount} of {stats.totalCount} (
          {((stats.untaggedCount * 100) / stats.totalCount).toFixed(0)}
          %) of entries missing tags.
        </p>
        <p>
          ${(stats.untaggedAmount / 100).toFixed(0)} of $
          {(stats.totalAmount / 100).toFixed(0)} (
          {((stats.untaggedAmount * 100) / stats.totalAmount).toFixed(0)}
          %) missing tags.
        </p>
        {
          <Ledger
            entries={this.topUntagged()}
            onClick={(e) => app.go('tag', { id: e.id })}
          />
        }
      </Page>
    );
  }
}

namespace TaggerPage {
  export interface Props {
    entries: Entry[];
    id: string;
  }
  export interface State {
    entry: Entry;
  }
}

export class TaggerPage extends React.Component<
  TaggerPage.Props,
  TaggerPage.State
> {
  constructor(props: TaggerPage.Props) {
    super(props);
    const entry = this.props.entries.find((e) => e.id === this.props.id);
    if (!entry) {
      throw new Error('no entry');
    }
    this.state = { entry };
  }

  render() {
    const { entry } = this.state;
    return (
      <Page>
        <Ledger entries={[entry]} />
      </Page>
    );
  }
}
