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

require('./ledger.scss');
var util = require('./util');

module.exports = React.createClass({
  render: function() {
    var entries = this.props.entries.slice(0, 100);
    //entries = nest.entries(entries);
    var last = null;
    var rEntries = entries.map((e, i) => {
      var date = e.date.slice(0, 7);
      var next = date;
      if (last != null) {
        if (last == date) {
          date = '';
        }
      }
      last = next;

      var tags = '';
      if (e.tags) {
        tags = e.tags.map((t) => ' #' + t);
      }
      return (
        <div className="ledger-entry" key={i}>
          <div className="ledger-date">{date}</div>
          <div className="ledger-body">
            <div className="ledger-text" title={e.date}>{e.payee}</div>
            <div className="ledger-subtext">{tags}</div>
          </div>
          <div className="ledger-money">{util.formatAmount(e.amount)}</div>
        </div>);
    });
    return (
      <div className="ledger">{rEntries}</div>
    );
  }
});
