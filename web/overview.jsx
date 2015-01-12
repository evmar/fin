
var Histo = React.createClass({
  componentDidMount() {
    var margin = {top:20, right:20, bottom:30, left:70};
    var width = this.props.width - margin.left - margin.right;
    var height = this.props.height - margin.top - margin.bottom;

    var el = this.getDOMNode();
    var svg = d3.select(el).append('svg')
                .attr('width', this.props.width)
                .attr('height', this.props.height)
                .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var entries = this.props.entries;
    entries.sort((a, b) => cmp(a.date, b.date));
    var format = d3.time.format("%Y/%m/%d");
    var cum = 0;
    entries.forEach((e) => {
      e.dateJS = format.parse(e.date);
      cum -= e.amount;
      e.cum = cum;
    });
    var x = d3.time.scale()
              .domain([entries[0].dateJS, entries[entries.length-1].dateJS])
              .range([0, width]);
    var y = d3.scale.linear()
              .domain(d3.extent(entries, (d) => d.cum))
              .range([height, 0]);

    var xAxis = d3.svg.axis()
                  .scale(x)
                  .orient('bottom');
    svg.append('g')
       .attr('class', 'x axis')
       .attr('transform', 'translate(0,' + height + ')')
       .call(xAxis);

    var yAxis = d3.svg.axis()
                  .scale(y)
                  .orient('left')
                  .ticks(5)
                  .tickFormat((d) => '$' + d3.format(',d')(d/100));
    svg.append('g')
       .attr('class', 'y axis')
       .call(yAxis);
    
    var line = d3.svg.line()
                 .x((e) => x(e.dateJS))
                 .y((e) => y(e.cum))
                 .interpolate('step');
    svg.append('path')
       .datum(entries)
       .attr('class', 'line')
       .attr('d', line);
  },

  render() {
    return <div className="graph" />;
  }
});

module.exports.Overview = React.createClass({
  render() {
    return <Histo entries={this.props.entries} width={8*64} height={8*32} />;
  }
});
