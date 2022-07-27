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

import * as util from './util';
import { Entry } from './types';
import { Filters } from './filter';
import SearchInput from './search';

const margin = { top: 5, right: 100, bottom: 30, left: 70 };

export interface GraphOpts {}

namespace GraphOptsPane {
  export interface Props {
    filters: Filters;
    opts: GraphOpts;
    tags: string[];
    tagAmounts: { [tag: string]: number };
    onFilters: (f: Filters) => void;
    onChange: (opts: GraphOpts) => void;
  }
}

export class GraphOptsPane extends React.Component<
  GraphOptsPane.Props,
  { expand: boolean }
> {
  state = { expand: false };

  render() {
    const tags = this.props.tags;

    const tagRow = (tag: string): JSX.Element | null => {
      let className = 'legend';
      if (tag in this.props.filters.hiddenTags) {
        className += ' hidden';
      } else if (!(tag in this.props.tagAmounts)) {
        // Tag with no data and no special status; skip.
        return null;
      }
      return (
        <div
          key={tag}
          className="row"
          onClick={(e) => {
            if (e.button == 0) {
              this.onLegend(tag);
            }
          }}
        >
          <span className={className}>&nbsp;</span>
          {tag == '' ? (
            <span className="tag">
              <em>(untagged)</em>
            </span>
          ) : (
            <span className="tag">{tag}</span>
          )}
          {tag in this.props.tagAmounts
            ? util.formatAmount(this.props.tagAmounts[tag], true)
            : ''}
        </div>
      );
    };

    let rows = tags.map(tagRow).filter((t) => t != null);
    if (!this.state.expand) {
      rows = rows.slice(0, 10);
    }

    return (
      <div className="controls">
        <p>
          <SearchInput
            onSearch={(q) => {
              this.onSearch(q);
            }}
            initialText={this.props.filters.query ?? ''}
          />
        </p>
        {rows}
        <button
          onClick={() => {
            this.setState({ expand: !this.state.expand });
          }}
        >
          {this.state.expand ? 'less' : 'more'}
        </button>
      </div>
    );
  }

  onLegend(tag: string) {
    const filtered = tag in this.props.filters.hiddenTags;
    if (!filtered) {
      this.props.filters.hiddenTags[tag] = true;
      this.props.onFilters(this.props.filters);
    } else {
      delete this.props.filters.hiddenTags[tag];
      this.props.onFilters(this.props.filters);
    }
  }

  onSearch(query: string) {
    this.props.filters.query = query;
    this.props.onFilters(this.props.filters);
  }
}

namespace Graph {
  export interface Props {
    entries: Entry[];
    opts: GraphOpts;
    width: number;
    height: number;
  }
}

export class Graph extends React.Component<Graph.Props> {
  width!: number;
  height!: number;

  g!: d3.Selection<SVGGElement, unknown, null, undefined>;

  componentDidMount() {
    this.create();
    this.update();
  }

  componentDidUpdate() {
    this.update();
  }

  create() {
    this.width = this.props.width - margin.left - margin.right;
    this.height = this.props.height - margin.top - margin.bottom;

    var el = ReactDOM.findDOMNode(this) as Element;
    const svg = d3
      .select(el)
      .append('svg')
      .attr('width', this.props.width)
      .attr('height', this.props.height);
    this.g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    this.g
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${this.height})`);

    this.g.append('g').attr('class', 'y axis');
  }

  update() {
    const parseTime = d3.timeParse('%Y/%m/%d');
    const entries = Array.from(
      d3.rollup(
        this.props.entries,
        (es) => d3.sum(es, (e) => e.amount),
        (e) => parseTime(e.date.substring(0, 8) + '01')!
      ),
      ([month, amount]) => ({ month, amount })
    );

    const x = d3
      .scaleTime()
      .domain(d3.extent(entries, (e) => e.month.valueOf()) as [number, number])
      .range([0, this.width]);

    const xAxis = d3.axisBottom<Date>(x);
    this.g.select<SVGGElement>('g.x').call(xAxis);

    const yext = d3.extent(entries, (d) => d.amount) as [number, number];
    const y = d3.scaleLinear().domain(yext).range([this.height, 0]);

    const yAxis = d3.axisLeft<number>(y).ticks(5);
    yAxis.tickFormat((d) => '$' + d3.format(',d')(d / 100));
    this.g.select<SVGGElement>('g.y').transition().call(yAxis);

    const rect = this.g.selectAll('rect').data(entries);
    rect
      .enter()
      .append('rect')
      .style('fill', (d) => 'slategray')
      .attr('x', (d) => x(d.month)!)
      .attr('y', (d) => Math.min(y(0)!, y(d.amount)!))
      .attr(
        'width',
        (d) => x(d3.timeMonth.offset(d.month, 1))! - x(d.month)! - 2
      )
      .attr('height', (d) => Math.abs(y(d.amount)! - y(0)!));
    rect
      .transition()
      .attr('y', (d) => Math.min(y(0)!, y(d.amount)!))
      .attr('height', (d) => Math.abs(y(d.amount)! - y(0)!));
  }

  render() {
    return <div className="graph" />;
  }
}
