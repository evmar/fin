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
        {<Ledger entries={this.topUntagged()} />}
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
    similar: Entry[];
  }
}

function terms(entry: Entry): string[] {
  return entry.payee.split(/[\s-]+/);
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
    const index = this.index(this.props.entries);
    const similar = this.findSimilar(index, entry);
    this.state = { entry, similar };
  }

  index(entries: Entry[]) {
    console.time('index');
    const revIndex = new Map<string, Set<Entry>>();
    for (const entry of entries) {
      for (const term of terms(entry)) {
        let list = revIndex.get(term);
        if (!list) {
          list = new Set<Entry>();
          revIndex.set(term, list);
        }
        list.add(entry);
      }
    }

    for (const [term, list] of revIndex) {
      if (list.size < 2) revIndex.delete(term);
    }
    console.timeEnd('index');

    return revIndex;
  }

  findSimilar(index: Map<string, Set<Entry>>, entry: Entry): Entry[] {
    const matches = new Map<Entry, number>();

    // For each overlapping term, score it by the IDF of the term.
    // General goal is to find entries that share rare terms.
    for (const term of terms(entry)) {
      const list = index.get(term);
      if (!list) continue;
      const idf = Math.log(this.props.entries.length / list.size);

      for (const match of list) {
        if (entry === match) continue;

        const score = matches.get(match) ?? 0;
        matches.set(match, score + idf);
      }
    }

    const scored = Array.from(matches.entries());
    scored.sort((a, b) => d3.descending(a[1], b[1]));
    console.log(scored.slice(0, 50));
    return scored.map(([e, _]) => e);
  }

  render() {
    const { entry, similar } = this.state;
    return (
      <Page>
        <Ledger entries={[entry]} />
        <p>Similar entries:</p>
        <Ledger entries={similar} />
      </Page>
    );
  }
}
