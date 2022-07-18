import { Page } from './page';
import { Entry } from './types';
import { URLParams } from './util';

namespace TagPage {
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
    console.log(stats);
    return stats;
  }

  render() {
    return <Page>{JSON.stringify(this.stats)}</Page>;
  }
}
