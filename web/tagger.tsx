import * as d3 from 'd3';
import * as preact from 'preact';
import * as app from './app';
import AutoComplete from './autocomplete';
import { Ledger } from './ledger';
import { Page } from './page';
import { Entry } from './types';
import { memo } from './util';

namespace UntaggedPage {
  export interface Props {
    params: URLSearchParams;
    entries: Entry[];
  }
}

interface Stats {
  totalCount: number;
  totalAmount: number;
  untaggedCount: number;
  untaggedAmount: number;
}

export class UntaggedPage extends preact.Component<UntaggedPage.Props> {
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
    return top.slice(0, 200);
  }

  render() {
    const stats = this.stats(this.props.entries);
    const extraHead = (
      <div>
        <div>{app.link('overview', 'overview', undefined)}</div>
        <div>{app.link('ledger', 'ledger', undefined)}</div>
      </div>
    );
    return (
      <Page extraHead={extraHead}>
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

namespace TagChip {
  export interface Props {
    tag: string;
    onClick?: () => void;
  }
}
class TagChip extends preact.Component<TagChip.Props> {
  render() {
    return (
      <div className='tag-chip' onClick={this.props.onClick}>
        {this.props.tag}
      </div>
    );
  }
}

async function setTags(ids: number[], tags: string[]): Promise<void> {
  const json = {
    tags,
    ids,
  };

  const resp = await fetch('/', { method: 'POST', body: JSON.stringify(json) });
  if (!resp.ok) {
    throw new Error(`${resp.status} ${resp.statusText}`);
  }
  await resp.text(); // Silence Chrome warning that occurs when you don't read body.
  return;
}

namespace TaggerPage {
  export interface Props {
    entries: Entry[];
    ids: number[];
  }
  export interface State {
    includeTagged: boolean;
  }
}

function terms(entry: Entry): string[] {
  return entry.payee.split(/[\s\*#-]+/).filter((s) => {
    return s !== '' && !Number.isFinite(+s);
  });
}

export class TaggerPage extends preact.Component<
  TaggerPage.Props,
  TaggerPage.State
> {
  constructor(props: TaggerPage.Props) {
    super(props);
    this.state = { includeTagged: false };
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

  findSimilar(index: Map<string, Set<Entry>>, entries: Entry[]): Entry[] {
    console.time('findSimilar');
    const matches = new Map<Entry, number>();

    // For each overlapping term, score it by the IDF of the term.
    // General goal is to find entries that share rare terms.
    for (const entry of entries) {
      for (const term of terms(entry)) {
        const list = index.get(term);
        if (!list) continue;
        const idf = Math.log(this.props.entries.length / list.size);

        for (const match of list) {
          const score = matches.get(match) ?? 0;
          matches.set(match, score + idf);
        }
      }
    }
    for (const entry of entries) {
      matches.delete(entry);
    }

    const scored = Array.from(matches.entries());
    scored.sort(
      (a, b) => d3.descending(a[1], b[1]) || d3.descending(a[0].date, b[0].date),
    );
    // console.log(scored.slice(0, 50));
    const similar = scored.map(([e, _]) => e);
    console.timeEnd('findSimilar');
    return similar;
  }

  render() {
    const entries = this.props.entries.filter((e) => this.props.ids.includes(e.id));
    if (!entries) {
      throw new Error('no entry');
    }

    let allTags = new Set<string>();
    for (const entry of this.props.entries) {
      if (entry.tags) {
        for (const tag of entry.tags) {
          allTags.add(tag);
        }
      }
    }

    const index = this.index(this.props.entries);
    let similar = this.findSimilar(index, entries);

    function countTags(entries: Entry[]): Array<[string, number]> {
      const tagCounts = new Map<string, number>();
      for (const entry of entries) {
        if (entry.tags) {
          for (const tag of entry.tags) {
            tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
          }
        }
      }
      const arr = Array.from(tagCounts);
      arr.sort((a, b) => d3.descending(a[1], b[1]) || d3.ascending(a[0], b[0]));
      return arr;
    }
    const ids = entries.map((e) => e.id);
    async function doTag(tag: string) {
      await setTags(ids, [tag]);
      app.reload();
    }

    const tagCounts = countTags(entries);
    let onRows = [];
    let offRows = [];
    let offTags = new Set<string>();
    for (const [tag, count] of tagCounts) {
      let label = tag;
      if (count !== entries.length) {
        label += ` (${count})`;
      }
      onRows.push(<TagChip tag={label} onClick={() => doTag(`-${tag}`)} />);
      if (count !== entries.length) {
        offRows.push(<TagChip tag={label} onClick={() => doTag(tag)} />);
      }
      offTags.add(tag);
    }

    const similarCounts = countTags(similar);
    for (const [tag] of similarCounts) {
      if (offTags.has(tag)) continue;
      offRows.push(<TagChip tag={tag} onClick={() => doTag(tag)} />);
    }

    if (!this.state.includeTagged) {
      similar = similar.filter((e) => !e.tags);
    }

    const extraHead = app.link('untagged', 'untagged', undefined);

    return (
      <Page extraHead={extraHead}>
        <Ledger
          entries={entries}
          onClick={(e) => {
            app.go('tag', { id: ids.filter((id) => id !== e.id).join(',') });
          }}
        />
        <table>
          <tr>
            <th>on</th>
            <th>off</th>
          </tr>
          <tr>
            <td width='50%'>{onRows}</td>
            <td width='50%'>
              {offRows}
              <p>
                <AutoComplete
                  options={Array.from(allTags)}
                  onCommit={(text) => {
                    const tags = text.split(/\s+/).filter((t) => !!t);
                    doTag(tags[0]);
                  }}
                />
              </p>
            </td>
          </tr>
        </table>
        <p>
          Similar entries:
          <label>
            <input
              type='checkbox'
              checked={this.state.includeTagged}
              onChange={() => this.setState({ includeTagged: !this.state.includeTagged })}
            />{' '}
            Include tagged
          </label>
        </p>
        <Ledger
          entries={similar}
          onMultiClick={(newEntries) => {
            app.go('tag', {
              id: [...ids, ...newEntries.map((e) => e.id)].join(','),
            });
          }}
          onClick={(e) => {
            app.go('tag', { id: [...ids, e.id].join(',') });
          }}
        />
      </Page>
    );
  }
}
