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

import * as preact from "preact";

interface Props {
  options: string[];
  initialText?: string;
  placeholder?: string;
  onCommit?: (text: string) => void;
}

interface State {
  sel?: number;
  focus: boolean;
  text: string;
}

export default class AutoComplete extends preact.Component<Props, State> {
  input = preact.createRef<HTMLInputElement>();

  constructor(props: Props) {
    super(props);
    this.state = {
      sel: undefined,
      text: props.initialText || '',
      focus: false,
    };
  }

  getOptions(): string[] {
    const words = this.state.text.split(/\s+/);
    const word = words[words.length - 1];
    return this.props.options.filter(
      (opt) => word.length > 0 && opt.indexOf(word) == 0,
    );
  }

  render() {
    const options = this.getOptions();
    let dropdown: preact.JSX.Element | null = null;
    if (options.length > 0 && this.state.focus) {
      dropdown = (
        <div className='dropdown'>
          {options.map((o, i) => {
            let className = 'item';
            if (i == this.state.sel) className += ' sel';
            return (
              <div
                key={i}
                className={className}
                onMouseDown={(e) => {
                  if (e.button == 0) {
                    this.complete(o);
                  }
                }}
              >
                {o}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <span className='autoc'>
        <input
          ref={this.input}
          autoComplete='off'
          value={this.state.text}
          placeholder={this.props.placeholder}
          onInput={(e) => {
            this.onInput(e);
          }}
          onKeyDown={(e) => {
            this.onKeyDown(e);
          }}
          onFocus={() => {
            this.onFocus();
          }}
          onBlur={() => {
            this.onBlur();
          }}
        />
        {dropdown}
      </span>
    );
  }

  onInput(e: InputEvent) {
    const text = (e.target as HTMLInputElement).value;
    this.setState({ text });
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.shiftKey || e.altKey || e.metaKey) return;

    const options = this.getOptions();
    let sel = this.state.sel;
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
        if (sel) sel--;
        break;
      case 'Enter':
        if (sel != null) {
          this.complete(options[sel]);
          sel = undefined;
        } else if (this.props.onCommit) {
          this.props.onCommit(this.state.text);
        }
        break;
      default:
        return;
    }

    e.preventDefault();

    if (!options.length) {
      sel = undefined;
    }
    if (sel != null) {
      if (sel < 0) {
        sel = 0;
      }
      if (sel > options.length) {
        sel = options.length - 1;
      }
    }
    this.setState({ sel: sel });
  }

  onFocus() {
    this.setState({ focus: true });
  }

  onBlur() {
    this.setState({ sel: undefined, focus: false });
  }

  complete(text: string) {
    const words = this.state.text.split(/\s+/);
    words[words.length - 1] = text;
    text = words.join(' ') + ' ';
    this.setState({ text });
  }
}
