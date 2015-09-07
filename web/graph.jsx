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
    var svg = d3.select(el).append('svg')
                .attr('width', this.props.width)
                .attr('height', this.props.height)
                .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  },

  update() {
    var entries = this.props.entries;
    entries.sort(d3.ascending((e) => e.date));

    var months = d3.nest()
                   .key((e) => e.date.substr(0, 7))
                   .sortKeys(d3.ascending)
                   .rollup((es) => d3.sum(es, (e) => e.amount))
                   .entries(entries);

    var format = d3.time.format("%Y/%m");
    months.forEach((m) => {
      m.month = format.parse(m.key);
    });

    var x = d3.time.scale()
              .domain([d3.time.month.offset(months[0].month, -1),
                       d3.time.month.offset(months[months.length-1].month, 1)])
              .range([0, this.width]);
    var y = d3.scale.linear()
              .domain(d3.extent(months, (d) => d.values))
              .range([this.height, 0]);

    var xAxis = d3.svg.axis()
                  .scale(x)
                  .ticks(4)
                  .orient('bottom');

    var svg = d3.select(this.getDOMNode()).select('svg').select('g');
    svg.append('g')
       .attr('class', 'x axis')
       .attr('transform', 'translate(0,' + this.height + ')')
       .call(xAxis);

    var yAxis = d3.svg.axis()
                  .scale(y)
                  .orient('left')
                  .ticks(5)
                  .tickFormat((d) => '$' + d3.format(',d')(d/100));
    svg.append('g')
       .attr('class', 'y axis')
       .call(yAxis);
    
    months.forEach((m) => {
      var y1 = y(0);
      var y2 = y(m.values);
      m.y = d3.min([y1, y2]);
      m.height = Math.abs(y1 - y2);
    });
    var m = months[0].month;
    var barwidth = x(d3.time.month.offset(m, 1)) - x(m) - 4;
    svg.selectAll('rect')
       .data(months)
       .enter().append('rect')
       .attr('x', (m) => x(m.month) - barwidth/2)
       .attr('y', (m) => m.y)
       .attr('width', barwidth)
       .attr('height', (m) => m.height)
  },

  render() {
    return <div className="graph" />;
  }
});
