
exports.parseQuery = function(query) {
  var tokens = query.split(/\s+/).filter((t) => t != '');
  var terms = tokens.map((tok) => {
    var negate = false;
    var f = null;
    if (/^-/.test(tok)) {
      negate = true
      tok = tok.substr(1)
    }
    if (/^t:/.test(tok)) {
      var tag = tok.substr(2);
      if (tag == '') {
        f = (e) => !!e.tags;
      } else {
        f = (e) => e.tags && tok in e.tags;
      }
    } else {
      var r = new RegExp(tok, 'i');
      f = (e) => r.test(e.payee);
      var y = 4;

    }
    if (negate) {
      f = (e) => !f(e);
    }
    return f;
  });
  if (!terms.length) {
    return null;
  }
  return (e) => terms.every((term) => term(e));
};

exports.SearchInput = React.createClass({
  render() {
    return (
      <input ref="i" type="search" incremental="true" />
    );
  },

  componentDidMount() {
    var i = this.refs.i.getDOMNode();
    i.incremental = true;
    i.addEventListener('search', this.search);
  },

  search() {
    var query = this.refs.i.getDOMNode().value;
    this.props.onSearch(query);
  },
});
