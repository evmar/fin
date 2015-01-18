var Ledger2 = require('./ledger');
var overview = require('./overview');

exports.AppShell = React.createClass({
  getInitialState() {
    return {};
  },

  componentDidMount() {
    this.reload();
  },

  render() {
    if (!this.state.entries || this.state.loading) {
      return <div></div>;
    }
    return <overview.Page entries={this.state.entries} tags={this.state.tags} />;
  },

  reload() {
    var req = new XMLHttpRequest();
    req.onload = (e) => {
      this.load(JSON.parse(req.responseText));
    };
    req.open('get', '/data');
    req.send();
  },

  load(data) {
    var entries = data.entries.sort(d3.ascending((e) => e.date));
    entries = entries.filter((e) => e.amount != 0);

    var tags = {};
    entries.forEach((entry) => {
      entry.amount = -entry.amount;
      if (entry.tags) {
        entry.tags.forEach((tag) => {
          tags[tag] = true;
        });
      }
    });
    tags = Object.keys(tags);

    window.data = {entries:entries, tags:tags};
    this.setState({entries, tags});
  }
});

React.render(
  React.createElement(exports.AppShell),
  document.body)
