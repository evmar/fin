// Copyright 2022 Evan Martin. All Rights Reserved.
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

import * as preact from 'preact';
import { Page } from './page';
import { Entry } from './types';
import * as util from './util';
import * as d3 from 'd3';

function getOrCreate<K, V>(map: Map<K, V>, key: K, def: () => V): V {
  let val = map.get(key);
  if (!val) {
    val = def();
    map.set(key, val);
  }
  return val;
}

function increment<K>(map: Map<K, number>, key: K) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

/** Infers the hierarchy of tags, returning a map of tag => parent tag. */
function tagHierarchy(entries: Entry[]): Map<string, string> {
  console.time('tagHierarchy');
  const counts = new Map<string, number>();
  const cooccur = new Map<string, Map<string, number>>();
  for (const entry of entries) {
    if (!entry.tags) continue;
    for (let i = 0; i < entry.tags.length; i++) {
      const tagA = entry.tags[i];
      increment(counts, tagA);
      if (entry.tags.length > 1) {
        const coA = getOrCreate(cooccur, tagA, () => new Map<string, number>());
        for (let j = i + 1; j < entry.tags.length; j++) {
          const tagB = entry.tags[j];
          increment(coA, tagB);
          const coB = getOrCreate(
            cooccur,
            tagB,
            () => new Map<string, number>(),
          );
          increment(coB, tagA);
        }
      }
    }
  }

  const parents = new Map<string, string>();
  for (const [tagA, countA] of counts) {
    const co = cooccur.get(tagA);
    let parent = '#';
    if (co) {
      for (const [tagB, countB] of co) {
        if (countA === countB) {
          parent = tagB;
        }
      }
    }
    parents.set(tagA, parent);
  }
  console.timeEnd('tagHierarchy');
  return parents;
}

type Stratify = d3.HierarchyNode<{ tag: string, amount: number }>;
function stratifyEntries(entries: Entry[]): Stratify {
  const counts = util.gatherTags(entries);
  for (const [tag, count] of Array.from(counts.entries())) {
    if (count > 0) counts.delete(tag);
  }
  const parents = tagHierarchy(entries);

  // d3 requires a root node, which we create with the name '#'.
  // Use '#' as the root node's tag, and null as its parent.
  counts.set('#', 0);
  parents.set('#', '');
  const stratify = d3
    .stratify<{ tag: string; amount: number }>()
    .id((d) => d.tag)
    .parentId((d) => parents.get(d.tag) ?? '#')(
      Array.from(counts.entries(), ([tag, amount]) => ({ tag, amount })),
    );

  // stratify needs a .value field filled in, but .sum assumes
  // that the input data isn't already pre-summed over children,
  // which ours is.  So hack it manually.
  stratify.each((d) => {
    (d as any).value = Math.abs(d.data.amount);
  });
  stratify.data.amount = d3.sum(stratify.children!, (d) => d.data.amount);
  (stratify as any).value = d3.sum(stratify.children!, (d) => d.value!);

  stratify.sort((a, b) => b.value! - a.value!);

  return stratify;
}

class Pie extends preact.Component<{ stratify: Stratify }> {
  svg = preact.createRef();

  componentDidMount() {
    const [width, height] = [300, 300];
    const color = d3.scaleOrdinal(d3.schemeBlues[9]);

    // Compute .x0/x1/etc fields from values.
    const partition = d3
      .partition<{ tag: string; amount: number }>()
      .size([2 * Math.PI, width / 2 - 5]);

    const pie = d3
      .select(this.svg.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);
    const arc = d3
      .arc<d3.HierarchyRectangularNode<unknown>>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => d.y0)
      .outerRadius((d) => d.y1);
    pie
      .selectAll('path')
      .data(partition(this.props.stratify).descendants())
      .join('path')
      .attr('d', arc)
      .style('stroke', 'black')
      .style('fill', (d) => color(d.data.tag))
      .append('title')
      .text((d) => d.data.tag || '[untagged]');
  }

  render() {
    return <svg ref={this.svg} />;
  }
}

class Breakdown extends preact.Component<{ stratify: Stratify, toggle: (tag: string) => void }> {
  render() {
    const total = this.props.stratify.data.amount;

    const rows: preact.ComponentChild[] = [];
    const visit = (stratify: Stratify, indent = 1) => {
      const { tag, amount } = stratify.data;
      rows.push(<tr onClick={() => this.props.toggle(tag)}>
        <td style={{ paddingLeft: `${indent * 2}ex` }}>{tag === '#' ? 'total' : !tag ? '[untagged]' : tag}</td>
        <td class='right'>{util.formatAmount(amount, true)}</td>
        <td class='right'>{util.formatAmount(amount / 12, true)}</td>
        <td class='right'>{(amount * 100 / total).toFixed(1)}%</td>
      </tr >);

      if (!stratify.children) return;
      for (const child of stratify.children) {
        visit(child, indent + 1);
      }
    }

    visit(this.props.stratify)

    return <table class='zebra' style={{ width: '50ex' }}>
      <thead><tr><th>tag</th><th class='right'>amount</th><th class='right'>per month</th><th>percent</th></tr></thead>
      {rows}
    </table>;
  }
}

namespace OverviewPage {
  export interface Props {
    entries: Entry[];
  }
  export interface State {
    filtered: Set<string>;
  }
}

export class OverviewPage extends preact.Component<OverviewPage.Props, OverviewPage.State> {
  state = { filtered: new Set<string>() };

  toggle(tag: string) {
    if (this.state.filtered.has(tag)) {
      this.state.filtered.delete(tag);
    } else {
      this.state.filtered.add(tag);
    }
    this.setState({ filtered: this.state.filtered });
  }

  filtered(e: Entry) {
    if (!e.tags) return false;
    for (const tag of e.tags) {
      if (this.state.filtered.has(tag)) return true;
    }
    return false;
  }

  render() {
    const entries = this.props.entries.filter((e) => !this.filtered(e));
    const stratify = stratifyEntries(entries);
    return (
      <Page>
        <Pie stratify={stratify} />
        <Breakdown stratify={stratify} toggle={(tag) => this.toggle(tag)} />
      </Page>
    );
  }
}
