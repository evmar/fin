# Copyright 2014 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Split up |data| into separate arrays by factor, suitable
# for d3.layout.stack(); each input datum goes into all
# output factor arrays, but with a 0 value in all except the
# one where the factor matches.
# mk :: (d, match) -> object where
#   d is an element of data, match is true if the data
#   should be nonzero, and the resulting object
#   goes into the ouput
# factors: a list of factors
# factor: (d) -> factor that d should belong to
# returns: a map keyed by factor; each value is
#   an array the same length as data, where each element is
#   an object returned by mk
interp = ({mk, factors, factor, data}) ->
  factored = {}
  for f in factors
    factored[f] = []

  for d in data
    thisfactor = factor(d)
    for f in factors
      factored[f].push(mk(d, f == thisfactor))
  factored

accum = (data) ->
  total = 0
  for d in data
    total += d.y
    d.y = total
  return data

class Graph
  constructor: (entries) ->
    dims = {}
    dims.svg = {width: 500, height: 250}
    dims.margin = {top: 5, right: 0, bottom: 25, left: 60}
    dims.graph =
      width: dims.svg.width - dims.margin.left - dims.margin.right
      height: dims.svg.height - dims.margin.top - dims.margin.bottom

    @dom = d3.select('#graph').append('svg')
      .attr('width', dims.svg.width)
      .attr('height', dims.svg.height)
    @svg = @dom
      .append('g')
      .attr('transform',
        fmt('translate($,$)', dims.margin.left, dims.margin.top))

    @x = d3.time.scale()
      .range([0, dims.graph.width])
    @x.domain(d3.extent(entries, (d) -> parseDate(d.date)))
    @y = d3.scale.linear()
      .range([dims.graph.height, 0])

    @xAxis = d3.svg.axis()
      .ticks(5)
      .orient('bottom')
    @xAxis.scale(@x)
    @svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', fmt('translate(0,$)', dims.graph.height))
      .call(@xAxis)
    @yAxis = d3.svg.axis()
      .ticks(5)
      .tickFormat((d) -> d3.format('$,')(d/100))
      .orient('left')
    @svg.append('g')
      .attr('class', 'y axis')
      .call(@yAxis)

    return

  load: (entries) ->
    tags = [
      'restaurant', 'travel', 'grocery', 'fun', 'car', 'subscription',
      'gift', 'clothes', 'house', 'body', 'cash', 'other', 'untagged'
      ]

    sums = interp {
      mk: (d, match) ->
        {date: parseDate(d.date), y: if match then d.amount else 0}
      factors: tags
      factor: (d) ->
        if d.tags
          for tag in tags
            return tag if tag in d.tags
          return 'other'
        return 'untagged'
      data: entries
    }

    total = 0
    for entry in entries
      total += entry.amount

    @y.domain([0, total])
    @yAxis.scale(@y)
    @svg.select('g.y.axis').call(@yAxis)

    area = d3.svg.area()
      .x((d)  => @x(d.date))
      .y0((d) => @y(d.y0))
      .y1((d) => @y(d.y0 + d.y))
    stack = d3.layout.stack()
      .values((d) -> d.data)
      .x((d) -> d.date)
      .y((d) -> d.y)
    color = d3.scale.category10()

    layers = for tag in tags
      {tag, data:accum(sums[tag])}
    if layers[0].data.length
      layers.sort (a, b) ->
        cmp(b.data[b.data.length-1].y, a.data[a.data.length-1].y)
    s = stack(layers)

    @svg.selectAll('g.tag').remove()
    gs = @svg.selectAll('g.tag').data(s)
      .enter().append('g')
      .attr('class', 'tag')
      .append('path')
        .attr('class', 'area')
        .style('fill', (d, i) -> color(i))
        .attr('d', (d) -> area(d.data))
      .append('title')
        .text((d) -> d.tag)

    return

clip = (x, min, max) ->
  return min if x < min
  return max if x > max
  return x

