var util = require('./util');

var Ledger2 = React.createClass({
  render: function() {
    var entries = this.props.entries.slice(0, 100);
    //entries = nest.entries(entries);
    var last = null;
    var rEntries = entries.map((e) => {
      var date = e.date.slice(0, 7);
      var next = date;
      if (last != null) {
        if (last == date) {
          date = '';
        }
      }
      last = next;

      var tags = 'no tags';
      if (e.tags) {
        tags = e.tags.map((t) => ' #' + t);
      }
      return (
        <div className="ledger-entry">
          <div className="ledger-date">{date}</div>
          <div className="ledger-body">
            <div className="ledger-text" title={e.date}>{e.payee}</div>
            <div className="ledger-subtext">
              {tags}
            </div>
          </div>
          <div className="ledger-money">{util.formatAmount(e.amount)}</div>
        </div>);
    });
    return (
      <div className="ledger">{rEntries}</div>
    );
  }
});

module.exports = Ledger2;
