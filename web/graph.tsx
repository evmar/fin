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

require('./graph.scss');
import * as util from './util';
import {Entry} from './types';

var margin = {top:5, right:10, bottom:30, left:70};

function dayOfYear(date: Date): number {
  var start = new Date();
  start.setMonth(0, 0);
  return (date.valueOf() - start.valueOf())/8.64e7;
}

function leastSquares(data: {x:Date, y:number}[]) {
  var xMean = d3.mean(data, (d) => +d.x);
  var yMean = d3.mean(data, (d) => d.y);
  var ssXX = d3.sum(data, (d) => Math.pow(+d.x - xMean, 2));
  var ssXY = d3.sum(data, (d) => (+d.x - xMean) * (d.y - yMean));
  var slope = ssXY/ssXX;
  var intercept = yMean - (xMean * slope);
  return {slope, intercept, yMean};
}

function chooseFirstMatch(tags: Set<string>, entryTags: string[]): string {
  for (var t of entryTags) {
    if (tags.has(t)) {
      return t;
    }
  }
  return null;
}

interface GraphOpts {
  stack: Set<string>;
  normalize: boolean;
}

class GraphOptsPane extends React.Component<{
  opts: GraphOpts;
  topTags: {key:string; value:number}[];
  onChange: {(opts: GraphOpts)}
}, {}> {
  render() {
    var opts = this.props.opts;
    var tags = this.props.topTags.slice(0, 6).map((t) => t.key);
    return (
      <div>
        <label><input type="checkbox" checked={opts.normalize}
                      onChange={() => {this.onNorm()}} /> normalize</label>
        <br />
        {tags.map((tag) =>
        <label key={tag}>
          <input type="checkbox" checked={opts.stack.has(tag)}
          onChange={() => {this.onStack(tag)}} /> {tag}
        </label>)}
      </div>
    );
  }

  onStack(tag: string) {
    var opts = this.props.opts;
    if (!opts.stack.delete(tag)) {
      opts.stack.add(tag);
    }
    this.props.onChange(opts);
  }

  onNorm() {
    var opts = this.props.opts;
    opts.normalize = !opts.normalize;
    this.props.onChange(opts);
  }
}

class Graph extends React.Component<{
  entries: Entry[];
  opts: GraphOpts;
  width: number;
  height: number;
  tags: string[];
}, {}> {
  width: number;
  height: number;

  svg: d3.Selection<any>;
  g: d3.Selection<any>;
  regLine: d3.Selection<any>;
  regText: d3.Selection<any>;

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

    var el = React.findDOMNode(this);
    this.svg = d3.select(el).append('svg')
                .attr('width', this.props.width)
                .attr('height', this.props.height);
    this.g = this.svg
                .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    this.g.append('g')
       .attr('class', 'x axis')
       .attr('transform', 'translate(0,' + this.height + ')');

    this.g.append('g')
        .attr('class', 'y axis');

    this.regLine = this.g.append('line')
                       .attr('class', 'regression');
    var g = this.g.append('g')
                .attr('class', 'regression');
    this.regText = g.append('text');
  }

  update() {
    var format = d3.time.format("%Y/%m/%d");
    interface EI {
      mdate: Date;
      amount: number;
      tags: string[];
    }
    var entries: EI[] = this.props.entries.map((e) => ({
      mdate: format.parse(e.date.substr(0, 8) + "01"),
      amount: e.amount,
      tags: e.tags,
    }));

    var x = d3.time.scale()
      .domain(d3.extent(entries, (e) => e.mdate.valueOf()))
      .range([0, this.width]);

    var stackTagSet = this.props.opts.stack;
    var stack = stackTagSet.size > 0;

    interface Nest {
      [date:string]: {[tag:string]: number}
    }
    var nest: Nest = d3.nest<EI>()
      .key((e) => e.mdate.valueOf().toString())
      .key((e) => (
        (stack ? chooseFirstMatch(stackTagSet, e.tags || [])
         : null)
          || 'other'))
      .sortKeys(d3.ascending)
      .rollup((es) => d3.sum(es, (e) => e.amount))
      .map(entries);

    var stackTags = util.setToArray(stackTagSet);
    stackTags.sort();
    stackTags.push('other');

    var data = x.ticks(d3.time.month).map((m) => {
      var key = +m;
      var bars: {tag:string, y0:number, y1:number, y:number}[] = [];
      if (key in nest) {
        var y = 0;
        bars = stackTags.map((tag) => {
          var y0 = y;
          y += nest[key][tag] || 0;
          var ext = d3.extent([y0, y]);
          return {tag, y0:ext[0], y1:ext[1], y};
        });
        if (this.props.opts.normalize) {
          bars.forEach((b) => {
            b.y0 /= y;
            b.y1 /= y;
            b.y /= y;
          });
        }
      }
      return {x:m, bars};
    });

    var xAxis = d3.svg.axis()
                  .scale(x)
                  .ticks(4)
                  .orient('bottom');
    var svg = this.g;
    svg.select('g.x').transition().call(xAxis);

    var yext = [
      d3.min(data, (d) => d3.min(d.bars, (d) => d.y0)),
      d3.max(data, (d) => d3.max(d.bars, (d) => d.y1)),
    ];
    yext[0] = Math.min(yext[0], 0);
    yext[1] = Math.max(yext[1], 0);
    var y = d3.scale.linear()
              .domain(yext)
              .range([this.height, 0]);

    var yAxis = d3.svg.axis()
                  .scale(y)
                  .orient('left')
                  .ticks(5)
      ;
    if (this.props.opts.normalize) {
      yAxis.tickFormat(d3.format('%'));
    } else {
      yAxis.tickFormat((d) => '$' + d3.format(',d')(d/100));
    }
    svg.select('g.y').transition().call(yAxis);

    var tags = this.props.tags.slice(0, 9);
    tags.unshift('other');
    var color = d3.scale.category10();
    color.domain(tags);

    this.g.selectAll('path.stack').remove();
    var g = this.g.selectAll('g.month')
                .data(data, (d) => d.x.valueOf().toString());
    g.enter()
     .append('g')
     .attr('class', 'month')
     .attr('transform', (d) => 'translate(' + x(d.x) + ',0)')
      ;
    g.exit().remove();
    
    var barWidth = data.length > 0
                 ? x(data[1].x) - x(data[0].x) - 2
                 : 0;
    var rect = g.selectAll('rect')
                .data((d) => d.bars, (d) => d.tag)
      ;
    rect.enter()
        .append('rect')
        .attr('height', 0)
        .attr('y', (d) => y(d.y0))
      ;
    rect
         .style('fill', (d) => color(d.tag))
         .attr('width', barWidth)
      ;
    rect.transition()
        .attr('y', (d) => y(d.y1))
        .attr('height', (d) => y(d.y0) - y(d.y1))
      ;
    rect.exit().transition()
        .attr('y', (d) => y(d.y0))
        .attr('height', 0)
        .remove();

    if (!stack && data.length > 0) {
      var regData = data.map((d) => {
        var y = d.bars.length > 0 ? d.bars[d.bars.length-1].y : 0;
        return {x:d.x, y};
      });
      var regression = leastSquares(regData);
      var t1 = regData[regData.length-1].x;
      var t2 = regData[0].x;
      this.regLine.datum(regression)
          .transition()
          .attr('x1', (r) => x(t1))
          .attr('y1', (r) => y(+t1 * regression.slope + regression.intercept))
          .attr('x2', (r) => x(t2))
          .attr('y2', (r) => y(+t2 * regression.slope + regression.intercept));

      // Regression slope is amount per millisecond; adjust to months.
      var perMonthDelta = regression.slope*8.64e7 * 30;
      // Round to nearest dollar amount.
      perMonthDelta = Math.round(perMonthDelta / 100);
      var deltaLabel = '';
      if (perMonthDelta != 0) {
        deltaLabel = d3.format('$,d')(perMonthDelta);
        if (perMonthDelta > 0) {
          deltaLabel = '+' + deltaLabel;
        }
      }
      var text = util.formatAmount(regression.yMean) + deltaLabel + '/mo';
      this.regText
          .attr('x', this.props.width - margin.left - margin.right - 100)
          .attr('y', y(0) - 10)
          .text(text);
    } else {
      // TODO: hide regression info.
    }
  }

  render() {
    return <div className="graph" />;
  }
}

export default class GraphPane extends React.Component<{
  entries: Entry[];
  topTags: {key: string, value: number}[];
}, {opts:GraphOpts}> {
  constructor() {
    super();
    this.state = {
      opts: {
        stack: new Set<string>(),
        normalize: false,
      },
    };
  }

  render() {
    var entries = this.props.entries;
    var tags = this.props.topTags.map((t) => t.key);
    return (
      <div>
        <GraphOptsPane opts={this.state.opts}
                       topTags={this.props.topTags}
                       onChange={(opts) => this.setState({opts})} />
        <Graph entries={entries} opts={this.state.opts}
               tags={tags}
               width={10*64} height={3*64} />
      </div>
    );
  }
}
