var util = require('./util');

var Ledger2 = React.createClass({
  render: function() {
    var entries = this.props.entries.slice(0, 100);
    var rEntries = entries.map((e) => {
      var tags = (e.tags || []).map((t) => ' #' + t);
      return (
        <div className="ledger-entry">
          <div className="ledger-body">
            <div className="ledger-text">{e.payee}</div>
            <div className="ledger-subtext">
              {e.addr}
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
