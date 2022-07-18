import { Ledger } from './ledger';
import { Page } from './page';
import { Entry } from './types';
import { URLParams } from './util';

namespace TagPage {
  export interface Props {
    params: URLParams;
    entries: Entry[];
    onReload: () => void;
  }
}

interface Stats {
  totalCount: number;
  totalAmount: number;
  untaggedCount: number;
  untaggedAmount: number;
}

export class TagPage extends React.Component<TagPage.Props> {
  stats: Stats;

  constructor(props: TagPage.Props) {
    super(props);

    this.stats = this.computeStats();
  }

  computeStats(): Stats {
    const stats = {
      totalCount: 0,
      totalAmount: 0,
      untaggedCount: 0,
      untaggedAmount: 0,
    };
    for (const entry of this.props.entries) {
      stats.totalCount++;
      stats.totalAmount += Math.abs(entry.amount);
      if (!entry.tags) {
        stats.untaggedCount++;
        stats.untaggedAmount += Math.abs(entry.amount);
      }
    }
    return stats;
  }

  topUntagged(): Entry[] {
    let top = [...this.props.entries];
    top.sort((a, b) => d3.descending(Math.abs(a.amount), Math.abs(b.amount)));
    return top.slice(0, 50);
  }

  render() {
    return (
      <Page>
        <div>
          {this.stats.untaggedCount} of {this.stats.totalCount} (
          {((this.stats.untaggedCount * 100) / this.stats.totalCount).toFixed(
            0
          )}
          %) of entries missing tags.
        </div>
        <div>
          ${this.stats.untaggedAmount / 100} of ${this.stats.totalAmount / 100}{' '}
          (
          {((this.stats.untaggedAmount * 100) / this.stats.totalAmount).toFixed(
            0
          )}
          %) missing tags.
        </div>
        {/*<Ledger></Ledger>*/}
      </Page>
    );
  }
}
