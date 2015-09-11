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
var util = require('./util');

var margin = {top:5, right:10, bottom:30, left:70};

function epanKernel(scale) {
  return function(u) {
    return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
  };
}

function norm(k) {
  var s = d3.sum(k);
  return k.map((v) => v / s);
}

function conv(k, distf) {
  var w = Math.floor(k.length / 2);
  return function(data) {
    return data.map((x, i) => {
      var s = 0;
      for (var j = -w; j <= w; j++) {
        var x1 = data[i+j];
        if (!x1)
          continue;
        var ki = distf(x1[0] - x[0]) + w;
        if (!k[ki])
          continue;
        s += k[ki] * x1[1];
      }
      return [x[0], s];
    });
  };
}

function smooth(data) {
  var kern = [];
  var window = 1;
  for (var j = -window; j <= window; j++) {
    kern.push(epanKernel(1)(j / window));
  }

  kern = norm(kern);

  var c = conv(kern, (d) => d / 86400000);
  return c(data);
}

function dayOfYear(date) {
  var start = new Date();
  start.setMonth(0, 0);
  return (date - start)/8.64e7;
}

function leastSquares(data) {
  var xMean = d3.mean(data, (d) => d.x);
  var yMean = d3.mean(data, (d) => d.y);
  var ssXX = d3.sum(data, (d) => Math.pow(d.x - xMean, 2));
  var ssXY = d3.sum(data, (d) => (d.x - xMean) * (d.y - yMean));
  var slope = ssXY/ssXX;
  var intercept = yMean - (xMean * slope);
  return {slope, intercept, yMean};
}

function chooseFirstMatch(tags, entryTags) {
  for (var t of tags) {
    for (var t2 of entryTags) {
      if (t == t2) {
        return t;
      }
    }
  }
  return null;
}

module.exports = React.createClass({
  componentDidMount() {
    this.create();
    this.update();
  },

  componentDidUpdate() {
    this.update();
  },

  create() {
    this.width = this.props.width - margin.left - margin.right;
    this.height = this.props.height - margin.top - margin.bottom;

    var el = this.getDOMNode();
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
  },

  update() {
    var entries = this.props.entries;
    var format = d3.time.format("%Y/%m/%d");
    entries = entries.map((e) => ({
      mdate: format.parse(e.date.substr(0, 8) + "01"),
      amount: e.amount,
      tags: e.tags,
    }));

    var x = d3.time.scale()
              .domain(d3.extent(entries, (e) => e.mdate))
              .range([0, this.width]);

    var stack = false;
    
    var stackTags = ['travel', 'restaurant', 'grocery'];
    if (!stack) {
      stackTags = [];
    }
    
    data = d3.nest()
             .key((e) => (
               (stack ? chooseFirstMatch(stackTags, e.tags || [])
                   : null)
                 || 'other'))
             .key((e) => +e.mdate)
             .sortKeys(d3.ascending)
             .rollup((es) => ({
               x: es[0].mdate,
               y: d3.sum(es, (e) => e.amount)
             }))
             .map(entries);

    stackTags.push('other');
      
    data = stackTags.map((tag) => ({
      tag: tag,
      values: x.ticks(d3.time.month).map((m) => {
        var amount = 0;
        var key = +m;
        if (tag in data && key in data[tag]) {
          amount = data[tag][key].y;
        }
        return {x:m, y:amount};
      })
    }));

    d3.layout.stack()
      .values((d) => d.values)
      (data);

    var xAxis = d3.svg.axis()
                  .scale(x)
                  .ticks(4)
                  .orient('bottom');
    var svg = this.g;
    svg.select('g.x').call(xAxis);

    var yext;
    yext = d3.extent(data[data.length - 1].values, (d) => (d.y0||0)+d.y);
    yext[0] = Math.min(yext[0], 0);
    var y = d3.scale.linear()
              .domain(yext)
              .range([this.height, 0]);

    var yAxis = d3.svg.axis()
                  .scale(y)
                  .orient('left')
                  .ticks(5)
                  .tickFormat((d) => '$' + d3.format(',d')(d/100));
    svg.select('g.y').transition().call(yAxis);

    if (stack) {
      var area = d3.svg.area()
                   .x((d) => x(d.x))
                   .y0((d) => y(d.y0))
                   .y1((d) => y(d.y0 + d.y))
                   .interpolate('step');
      var color = d3.scale.category10();
      var lineSel = this.g.selectAll('path.line').data(data);
      lineSel.enter()
             .append('path')
             .attr('class', 'line');
      lineSel
        .transition()
        .attr('d', (d) => area(d.values))
        .style('fill', (d) => color(d.tag));
      lineSel.exit()
             .remove();
    } else {
      data = data[0].values;
      var line = d3.svg.line()
                   .x((d) => x(d.x))
                   .y((d) => y(d.y))
                   .interpolate('step');
      
      var lineSel = this.g.selectAll('path.line').data([data]);
      lineSel.enter()
             .append('path')
             .attr('class', 'line');
      lineSel
         .transition()
         .attr('d', line);
      lineSel.exit()
             .remove();

      if (data.length > 0) {
        var regression = leastSquares(data);
        var t1 = data[data.length-1].x;
        var t2 = data[0].x;
        this.regLine.datum(regression)
          .transition()
          .attr('x1', (r) => x(t1))
          .attr('y1', (r) => y(t1 * regression.slope + regression.intercept))
          .attr('x2', (r) => x(t2))
          .attr('y2', (r) => y(t2 * regression.slope + regression.intercept));

        // Regression slope is amount per millisecond; adjust to months.
        var perMonthDelta = regression.slope*8.64e7 * 30;
        // Round to nearest dollar amount.
        perMonthDelta = Math.round(perMonthDelta / 100);
        if (perMonthDelta != 0) {
          perMonthDelta = d3.format('$,d')(perMonthDelta);
          if (perMonthDelta[0] != '-') {
            perMonthDelta = '+' + perMonthDelta;
          }
        } else {
          perMonthDelta = '';
        }
        var text = util.formatAmount(regression.yMean) + perMonthDelta + '/mo';
        this.regText
            .attr('x', this.props.width - margin.left - margin.right - 100)
            .attr('y', y(0) - 10)
            .text(text);
      }
    }
  },

  render() {
    return <div className="graph" />;
  }
});
