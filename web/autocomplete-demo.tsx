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

import AutoComplete from './autocomplete';

class Demo extends preact.Component<{}, {}> {
  render() {
    var options = ['foo', 'foox', 'bar', 'baz', 'longlongword'];
    return (
      <main>
        <h1>AutoComplete demo</h1>
        <AutoComplete options={options} />
      </main>
    );
  }
}

preact.render(<Demo />, document.body);
