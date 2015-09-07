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

require('./style.scss');
var ledger = require('./ledger');
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
    /* <ledger.LedgerPage entries={this.state.entries} tags={this.state.tags} /> */
    return (
      <overview.Page entries={this.state.entries} tags={this.state.tags} />
    );
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
    var entries = data.entries;
    entries = entries.filter((e) => e.amount != 0);
    entries = entries.sort((a, b) => d3.descending(a.date, b.date));

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
