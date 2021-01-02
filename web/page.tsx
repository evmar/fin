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
  title: string;
  children: React.ReactNode;
}

export default class Page extends React.Component<Props, {}> {
  render() {
    return (
      <div>
        <header>
          <h1 className="title">{this.props.title}</h1>
          <div className="spacer"></div>
          <div>filter: [TODO here]</div>
        </header>
        <div className="body">
          <main>{this.props.children}</main>
        </div>
      </div>
    );
  }
}
