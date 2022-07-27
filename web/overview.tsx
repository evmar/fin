// Copyright 2022 Evan Martin. All Rights Reserved.
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

import { Page } from './page';
import { Entry } from './types';
import * as util from './util';

function getOrCreate<K, V>(map: Map<K, V>, key: K, def: () => V): V {
  let val = map.get(key);
  if (!val) {
    val = def();
    map.set(key, val);
  }
  return val;
}

function increment<K>(map: Map<K, number>, key: K) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function tagHierarchy(entries: Entry[]): Map<string, string> {
  console.time('tagHierarchy');
  const counts = new Map<string, number>();
  const cooccur = new Map<string, Map<string, number>>();
  for (const entry of entries) {
    if (!entry.tags) continue;
    for (let i = 0; i < entry.tags.length; i++) {
      const tagA = entry.tags[i];
      increment(counts, tagA);
      if (entry.tags.length > 1) {
        const coA = getOrCreate(cooccur, tagA, () => new Map<string, number>());
        for (let j = i + 1; j < entry.tags.length; j++) {
          const tagB = entry.tags[j];
          increment(coA, tagB);
          const coB = getOrCreate(
            cooccur,
            tagB,
            () => new Map<string, number>()
          );
          increment(coB, tagA);
        }
      }
    }
  }

  const parents = new Map<string, string>();
  for (const [tagA, countA] of counts) {
    const co = cooccur.get(tagA);
    let parent = '#';
    if (co) {
      for (const [tagB, countB] of co) {
        if (countA === countB) {
          parent = tagB;
        }
      }
    }
    parents.set(tagA, parent);
  }
  console.log(parents);
  return parents;
}

namespace OverviewPage {
  export interface Props {
    entries: Entry[];
  }
}

export class OverviewPage extends React.Component<OverviewPage.Props> {
  render() {
    const parents = tagHierarchy(this.props.entries);
    const counts = util.gatherTags(this.props.entries);

    return <Page>wip</Page>;
  }
}
