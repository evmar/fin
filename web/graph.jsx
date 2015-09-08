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

module.exports = React.createClass({
  componentDidMount() {
    this.create();
    this.update();
  },

  componentDidUpdate() {
    this.update();
  },

  create() {
    var margin = {top:20, right:20, bottom:30, left:70};
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

    this.p = this.g.append('path')
       .attr('class', 'line');
  },

  update() {
    var entries = this.props.entries;
    var format = d3.time.format("%Y/%m/%d");
    entries = entries.map((e) => ({
      mdate: format.parse(e.date.substr(0, 8) + "01"),
      amount: e.amount,
    }))
    var data = d3.nest()
                 .key((e) => +e.mdate)
                 .rollup((es) => ({
                   mdate: es[0].mdate,
                   amount: d3.sum(es, (e) => e.amount)
                 }))
                 .entries(entries)
                 .map((e) => [e.values.mdate, e.values.amount]);
    /* data = smooth(data); */
    data.forEach((e) => {
      console.log(e[0], e[1]);
    });

    var x = d3.time.scale()
              .domain([format.parse("2015/01/01"),
                       format.parse("2015/10/01")])
              .range([0, this.width]);

    var yext = d3.extent(data, (d) => d[1]);
    yext[0] = Math.min(yext[0], 0);
    var y = d3.scale.linear()
              .domain(yext)
              .range([this.height, 0]);

    var xAxis = d3.svg.axis()
                  .scale(x)
                  .ticks(4)
                  .orient('bottom');

    var svg = this.g;
    svg.select('g.x').call(xAxis);

    var yAxis = d3.svg.axis()
                  .scale(y)
                  .orient('left')
                  .ticks(5)
                  .tickFormat((d) => '$' + d3.format(',d')(d/100));
    svg.select('g.y').call(yAxis);
    
    var line = d3.svg.line()
                 .x((d) => x(d[0]))
                 .y((d) => y(d[1]))
                 .interpolate('step');
    this.p.datum(data)
       .attr('d', line);
  },

  render() {
    return <div className="graph" />;
  }
});
