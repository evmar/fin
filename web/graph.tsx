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
import {Filters} from './filter';
import SearchInput from './search';

var margin = {top:5, right:100, bottom:30, left:70};

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

export interface GraphOpts {
  stack: Set<string>;
  normalize: boolean;
}

export class GraphOptsPane extends React.Component<{
  filters: Filters,
  opts: GraphOpts;
  tags: string[];
  tagAmounts: {[tag:string]: number};
  onFilters: {(Filters)}
  onChange: {(opts: GraphOpts)}
}, {expand: boolean}> {
  constructor() {
    super();
    this.state = {expand:false};
  }

  render() {
    var opts = this.props.opts;
    var tags = this.props.tags;
    var that = this;

    function tagRow(tag: string): JSX.Element {
      var className = "legend";
      if (tag in that.props.filters.hiddenTags) {
        className += " hidden";
      } else if (opts.stack.has(tag)) {
        className += " stack";
      } else if (!(tag in that.props.tagAmounts)) {
        // Tag with no data and no special status; skip.
        return null;
      }
      return (
        <div key={tag} className="row"
             onClick={(e) => {
                      if (e.button == 0) {
                        that.onLegend(tag);
                      }}}>
          <span className={className}>&nbsp;</span>
          <span className="tag">{tag}</span>
          {tag in that.props.tagAmounts
           ? util.formatAmount(that.props.tagAmounts[tag], true)
             : ""}
        </div>
      );
    }

    var rows = tags.map(tagRow).filter((t) => t != null);
    if (!this.state.expand) {
      rows = rows.slice(0, 10);
    }
    
    return (
      <div className="controls">
        <SearchInput onSearch={(q) => {this.onSearch(q)}}
                     initialText={this.props.filters.query} />
        <label><input type="checkbox" checked={opts.normalize}
                      onChange={() => {this.onNorm()}} /> normalize</label>
        <br />
        {rows}
        <button onClick={() => {
                        this.setState({expand:!this.state.expand});
                         }}>
          {this.state.expand ? "less" : "more"}
        </button>
      </div>
    );
  }

  onLegend(tag: string) {
    var filtered = tag in this.props.filters.hiddenTags;
    var stacked = this.props.opts.stack.has(tag);
    
    if (!filtered && !stacked) {
      this.props.filters.hiddenTags[tag] = true;
      this.props.onFilters(this.props.filters);
    } else if (filtered) {
      delete this.props.filters.hiddenTags[tag];
      this.props.onFilters(this.props.filters);
      this.props.opts.stack.add(tag);
      this.props.onChange(this.props.opts);
    } else {
      this.props.opts.stack.delete(tag);
      this.props.onChange(this.props.opts);
    }
  }

  onNorm() {
    var opts = this.props.opts;
    opts.normalize = !opts.normalize;
    this.props.onChange(opts);
  }

  onSearch(query) {
    this.props.filters.query = query;
    this.props.onFilters(this.props.filters);
  }
}

export class Graph extends React.Component<{
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
      var bars: {tag:string, x:number, y0:number, y1:number, y:number}[] = [];
      if (key in nest) {
        var y = 0;
        bars = stackTags.map((tag) => {
          var y0 = y;
          y += nest[key][tag] || 0;
          var ext = d3.extent([y0, y]);
          return {tag, x:m, y0:ext[0], y1:ext[1], y};
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
    var color = d3.scale.category20();
    color.domain(tags);

    var g = this.g.selectAll('g.month')
                .data(data, (d) => d.x.valueOf().toString());
    g.enter()
     .append('g')
     .attr('class', 'month')
      ;
    g.exit().remove();
    
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
         .attr('width', (d) => (
           x(d3.time.month.offset(d.x, 1)) - x(d.x) - 2))
      ;
    rect.transition()
        .attr('x', (d) => x(d.x))
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
      var t1 = regData[0].x;
      var t2 = regData[regData.length-1].x;
      var x2 = x(t2);
      var y2 = y(+t2 * regression.slope + regression.intercept);
      this.regLine.datum(regression)
          .transition()
          .attr('x1', x(t1))
          .attr('y1', y(+t1 * regression.slope + regression.intercept))
          .attr('x2', x2)
          .attr('y2', y2);

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
          .attr('x', x2 + 5)
          .attr('y', y2)
          .attr('dy', '0.3em')  // vertical center
          .text(text);
    } else {
      // TODO: hide regression info.
    }
  }

  render() {
    return <div className="graph" />;
  }
}
