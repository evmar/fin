var filter = require('./filter');

exports.Page = React.createClass({
  render() {
    return (
      <div>
        <header>
          <div className="title">{this.props.title}</div>
          <div className="spacer"></div>
      {this.props.onSearch ?
       <label>filter: <filter.SearchInput onSearch={this.props.onSearch} /></label>
       : null}
        </header>
        <div className="body">
          <nav>
            <div>...</div>
          </nav>
          <main>
            {this.props.children}
          </main>
        </div>
      </div>
    );
  },
});
