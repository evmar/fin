package main

import "github.com/martine/fin/bank/qif"

type EntryHeap struct {
	entries []*qif.Entry
	scores  []int
	count   int
}

func NewEntryHeap(size int) *EntryHeap {
	return &EntryHeap{
		entries: make([]*qif.Entry, size),
		scores:  make([]int, size),
		count:   0,
	}
}

func (eh *EntryHeap) Min() int {
	if eh.count == 0 {
		return 0
	}
	return eh.scores[0]
}

func (eh *EntryHeap) Pop() *qif.Entry {
	if eh.count == 0 {
		return nil
	}

	top := eh.entries[0]
	eh.count--

	eh.entries[0] = eh.entries[eh.count]
	eh.scores[0] = eh.scores[eh.count]

	i := 0
	for {
		j := i*2 + 1
		if j >= eh.count {
			break
		}
		if k := j + 1; k < eh.count && eh.scores[k] < eh.scores[j] {
			j = k
		}
		if eh.scores[j] >= eh.scores[i] {
			break
		}
		eh.entries[i] = eh.entries[j]
		eh.scores[i] = eh.scores[j]
		i = j
	}
	return top
}

func (eh *EntryHeap) Insert(e *qif.Entry, score int) {
	full := eh.count == len(eh.entries)
	if full {
		if score <= eh.scores[0] {
			return
		}
		eh.Pop()
	}

	i := eh.count
	eh.entries[i] = e
	eh.scores[i] = score
	eh.count++

	for i > 0 {
		j := (i - 1) / 2
		if eh.scores[j] <= eh.scores[i] {
			break
		}
		eh.entries[i], eh.entries[j] = eh.entries[j], eh.entries[i]
		eh.scores[i], eh.scores[j] = eh.scores[j], eh.scores[i]
		i = j
	}
}
