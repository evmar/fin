require('./autocomplete.scss');

exports.AutoComplete = React.createClass({
  getInitialState() {
    return {sel:null, text:'', focus:false};
  },

  getOptions() {
    var words = this.state.text.split(/\s+/);
    var word = words[words.length - 1];
    return this.props.options.filter((opt) =>
      word.length > 0 && opt.indexOf(word) == 0);
  },

  render() {
    var options = this.getOptions();
    var dropdown = null;
    if (options.length > 0 && this.state.focus) {
      dropdown = (<div className='dropdown'>
        {options.map((o, i) => {
          var className = 'item';
          if (i == this.state.sel)
            className += ' sel';
          return <div key={i} className={className}
                      onMouseDown={() => this.complete(o)}>{o}</div>;
          })
         }
      </div>);
    }

    return (
      <div className='autoc'>
        <input ref='input' autoComplete='false' value={this.state.text}
               onChange={this.onChange} onKeyDown={this.onKeyDown}
               onFocus={this.onFocus} onBlur={this.onBlur} />
        {dropdown}
      </div>
    );
  },

  onChange() {
    var text = this.refs.input.getDOMNode().value
    this.setState({text});
  },

  onKeyDown(e) {
    if (e.shiftKey || e.altKey || e.metaKey)
      return;

    var options = this.getOptions();
    var sel = this.state.sel;
    switch (e.key) {
    case 'ArrowDown':
    case 'Tab':
      if (sel == null)
        sel = 0;
      sel++;
      break;
    case 'ArrowUp':
      if (sel)
        sel--;
      break;
    case 'Enter':
      if (sel != null) {
        this.complete(options[sel]);
        sel = null;
      } else if (this.props.onCommit) {
        if (this.props.onCommit(this.state.text)) {
          this.setState({text:''});
        }
      }
      break;
    default:
      return;
    }

    e.preventDefault();

    if (!options.length) {
      sel = null;
    }
    if (sel != null) {
      if (sel < 0) {
        sel = 0;
      }
      if (sel > options.length) {
        sel = options.length - 1;
      }
    }
    this.setState({sel:sel});
  },

  onFocus() {
    this.setState({focus:true});
  },

  onBlur() {
    this.setState({sel:null, focus:false});
  },

  complete(text) {
    var words = this.state.text.split(/\s+/);
    words[words.length - 1] = text;
    text = words.join(' ') + ' ';
    this.setState({text});
  }
});
