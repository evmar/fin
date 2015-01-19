# Copyright 2014 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

require('./style.scss')

formatAmount = require('./util').formatAmount

R = {}
for tag in [
  'a'
  'table'
  'thead'
  'tr'
  'th'
  'td'
  'span'
  'header'
  'input'
  'label'
  'div'
  ]
  do (tag) ->
    R[tag] = (params, args...) ->
      React.createElement(tag, params, args...)


Summary = React.createClass
  displayName: 'Summary'

  compute: ->
    # Sum total amount attributed to each tag.
    tagsums = {}
    for e in @props.entries
      if e.tags
        for t in e.tags
          tagsums[t] = (tagsums[t] or 0) + e.amount
    # Sort tags in order of amount.
    tagsums = d3.entries(tagsums)
    tagsums.sort((a, b) -> d3.descending(a.value, b.value))
    tags = (t.key for t in tagsums)

    chooseBucket = (e) ->
      bucket = 'unknown'
      if e.tags
        for t in tags
          if t in e.tags
            bucket = t
            break
      return bucket

    d3.nest()
      .key(chooseBucket)
      .rollup((d) -> d3.sum(e.amount for e in d))
      .map(@props.entries)

  render: ->
    buckets = @compute()
    buckets = ([buckets[t], t] for t of buckets)
    buckets.sort(d3.descending((b) -> b[0]))
    total = 0

    R.div null,
      R.div null,
        'all tags:'
        for t in @props.tags
          ' ' + t
      for b in buckets
        [amount, tag] = b
        total += amount
        R.div {key:tag}, (formatAmount(amount) + ': ' + tag)
      '=> ' + formatAmount(total)


window.App = React.createClass
  displayName: 'App'

  getInitialState: -> {mode:'ledger', search:null}

  getEntries: ->
    entries = @props.entries
    if @state.search
      entries = entries.filter(@state.search)
    return entries

  render: ->
    entries = @getEntries()

    R.div null,
      R.header null,
        R.div null,
          'mode:'
          for mode in ['browse', 'chart', 'tag']
            do (mode) =>
              R.span null,
                ' '
                R.a {href:'#', onClick:((e) => @viewMode(e, mode))}, mode
        R.div {className:'spacer'}
        React.createElement Filter, {onSearch:@onSearch}
      switch @state.mode
        when 'browse'
          React.createElement Summary, {tags:@props.tags, entries}
        when 'tag'
          R.div null,
            R.div null,
              'tag: '
              AutoC {options:@props.tags, onCommit:@onTag}
            Ledger {entries}
        when 'chart'
          null
        when 'ledger'
          React.createElement Ledger2, {entries}

  viewMode: (e, mode) ->
    e.preventDefault()
    @setState {mode}
    return true

  onSearch: (search) ->
    @setState {search}
    return

  onTag: (text) ->
    entries = @getEntries()

    data =
      tags: text.split(/\s+/)
      ids: (entry.id for entry in entries)

    req = new XMLHttpRequest()
    req.onload = () => @props.reload()
    req.open('post', '/')
    req.send(JSON.stringify(data))

    return true


require('./app')
