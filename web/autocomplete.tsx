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

interface Props {
  options: string[];
  initialText?: string;
  placeholder?: string;
  onCommit?: (text:string)=>void;
}

export default class AutoComplete extends React.Component<Props, {
  sel?: number;
  focus?: boolean;
  text?: string;
}> {
  constructor(props: Props) {
    super();
    this.state = {sel:null, text:props.initialText || '', focus:false};
  }

  getOptions() {
    var words = this.state.text.split(/\s+/);
    var word = words[words.length - 1];
    return this.props.options.filter((opt) =>
      word.length > 0 && opt.indexOf(word) == 0);
  }

  render() {
    var options = this.getOptions();
    var dropdown: JSX.Element = null;
    if (options.length > 0 && this.state.focus) {
      dropdown = (<div className='dropdown'>
        {options.map((o, i) => {
          var className = 'item';
          if (i == this.state.sel)
            className += ' sel';
          return <div key={i} className={className}
          onMouseDown={(e) => {
            if (e.button == 0) {
              this.complete(o);
            }
          }}>{o}</div>;
         })
        }
      </div>);
    }

    return (
      <span className='autoc'>
        <input ref='input' autoComplete={false} value={this.state.text}
               placeholder={this.props.placeholder}
               onChange={() => {this.onChange()}}
               onKeyDown={(e) => {this.onKeyDown(e)}}
               onFocus={() => {this.onFocus()}}
               onBlur={() => {this.onBlur()}} />
        {dropdown}
      </span>
    );
  }

  onChange() {
    var text = React.findDOMNode<HTMLInputElement>(this.refs['input']).value;
    this.setState({text});
  }

  onKeyDown(e: __React.KeyboardEvent) {
    if (e.shiftKey || e.altKey || e.metaKey)
      return;

    var options = this.getOptions();
    var sel = this.state.sel;
    switch (e.key) {
    case 'ArrowDown':
    case 'Tab':
      if (sel == null || sel == options.length - 1) {
        sel = 0;
      } else {
        sel++;
      }
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
  }

  onFocus() {
    this.setState({focus:true});
  }

  onBlur() {
    this.setState({sel:null, focus:false});
  }

  complete(text: string) {
    var words = this.state.text.split(/\s+/);
    words[words.length - 1] = text;
    text = words.join(' ') + ' ';
    this.setState({text});
  }
}
