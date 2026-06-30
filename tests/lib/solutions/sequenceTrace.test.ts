import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runSequenceTrace,
  computeSequenceAnswer,
  buildSteppedSequenceDiagram,
  buildSteppedSequenceFromMetadata,
} from '../../../src/lib/solutions/trace/sequenceTrace'
import { SolutionDiagramSchema } from '../../../src/lib/solutions/schema'

test('reverse linked list [1,2,3,4] traces head-to-tail and emits [4,3,2,1]', () => {
  const trace = runSequenceTrace('reverse_linked_list', [1, 2, 3, 4])
  assert.ok(trace)
  // Answer is the reversed value list.
  assert.deepEqual(trace!.answer, [4, 3, 2, 1])
  // Display row keeps the ORIGINAL order, so labels read forward.
  assert.deepEqual(trace!.labels, ['1', '2', '3', '4'])
  // One frame per node (4) plus the settled "new head" frame = 5 frames.
  assert.equal(trace!.frames.length, 5)

  // Frame 0: cursor on the head (index 0), no prev, next points to index 1.
  const f0 = trace!.frames[0]
  assert.equal(f0.activeIndex, 0)
  assert.deepEqual(f0.visited, [])
  assert.equal(f0.pointers?.curr, 0)
  assert.equal(f0.pointers?.prev, undefined)
  assert.equal(f0.pointers?.next, 1)

  // Frame 2: cursor on index 2, prev trails at index 1, next at index 3, the prefix
  // [0,1] already re-pointed.
  const f2 = trace!.frames[2]
  assert.equal(f2.activeIndex, 2)
  assert.equal(f2.pointers?.prev, 1)
  assert.equal(f2.pointers?.curr, 2)
  assert.equal(f2.pointers?.next, 3)
  assert.deepEqual(f2.visited, [0, 1])

  // Final frame: every node visited, the last node (index 3) is the new head.
  const last = trace!.frames.at(-1)!
  assert.deepEqual(last.visited, [0, 1, 2, 3])
  assert.equal(last.pointers?.head, 3)
})

test('inorder of a known BST matches the expected visit order', () => {
  // Level-order [4,2,6,1,3,5,7] is a balanced BST:
  //          4
  //        /   \
  //       2     6
  //      / \   / \
  //     1   3 5   7
  // Inorder (left,root,right) is sorted: 1,2,3,4,5,6,7.
  const trace = runSequenceTrace('inorder_traversal', [4, 2, 6, 1, 3, 5, 7])
  assert.ok(trace)
  assert.deepEqual(trace!.answer, [1, 2, 3, 4, 5, 6, 7])
  // The displayed row IS the visit order, so labels read sorted.
  assert.deepEqual(trace!.labels, ['1', '2', '3', '4', '5', '6', '7'])
  // One frame per visited node, capped at the frame limit (7 here, under the cap).
  assert.equal(trace!.frames.length, 7)
  // Cursor steps strictly forward 0..n-1 and visited grows by one each step.
  trace!.frames.forEach((f, i) => {
    assert.equal(f.activeIndex, i)
    assert.deepEqual(f.visited, Array.from({ length: i + 1 }, (_, k) => k))
  })

  // The classic LeetCode shape [1,null,2,3] -> inorder [1,3,2].
  const trace2 = runSequenceTrace('inorder_traversal', [1, null, 2, 3])
  assert.ok(trace2)
  assert.deepEqual(trace2!.answer, [1, 3, 2])
})

test('the oracle answer is uncapped and independent of the display path', () => {
  assert.deepEqual(computeSequenceAnswer('reverse_linked_list', [1, 2, 3, 4, 5]), [5, 4, 3, 2, 1])
  assert.deepEqual(computeSequenceAnswer('inorder_traversal', [4, 2, 6, 1, 3, 5, 7]), [1, 2, 3, 4, 5, 6, 7])
  // A null root has no tree to traverse.
  assert.equal(computeSequenceAnswer('inorder_traversal', [null]), null)
  // A non-integer linked-list entry is not a value list we can reverse.
  assert.equal(computeSequenceAnswer('reverse_linked_list', [1, 'x', 3]), null)
})

test('the built diagram from a verified trace passes the schema and carries the verified marker', () => {
  const trace = runSequenceTrace('reverse_linked_list', [1, 2, 3, 4, 5])
  const diagram = buildSteppedSequenceDiagram(trace!, { title: 'Reverse a linked list' })
  const result = SolutionDiagramSchema.safeParse(diagram)
  assert.equal(result.success, true, JSON.stringify(result.success ? {} : result.error.issues))
  assert.equal(diagram.trace_verified, true)
  assert.equal(diagram.base.kind, 'sequence')
  assert.ok(diagram.steps.length >= 3 && diagram.steps.length <= 8)
})

test('the inorder diagram also passes the schema', () => {
  const trace = runSequenceTrace('inorder_traversal', [1, null, 2, 3])
  const diagram = buildSteppedSequenceDiagram(trace!)
  const result = SolutionDiagramSchema.safeParse(diagram)
  assert.equal(result.success, true, JSON.stringify(result.success ? {} : result.error.issues))
  assert.equal(diagram.base.kind, 'sequence')
})

test('metadata cross-check builds a sequence diagram when the canonical answer matches every visible case', () => {
  // Real Reverse Linked List shape from the live bank.
  const metadata = {
    test_cases: [
      { id: 'tc1', args: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1], input_types: ['linked_list'] },
      { id: 'tc2', args: [[1, 2]], expected: [2, 1], input_types: ['linked_list'] },
      { id: 'tc3', args: [[9, 8, 7]], expected: [1, 1, 1], hidden: true }, // hidden, ignored
    ],
  }
  const candidate = buildSteppedSequenceFromMetadata(metadata, ['linked-list'])
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'reverse_linked_list')
  const result = SolutionDiagramSchema.safeParse(candidate!.diagram)
  assert.equal(result.success, true)
})

test('metadata cross-check builds an inorder diagram from a tree level-order case', () => {
  // Real Inorder Traversal shape: level-order array with nulls -> inorder list.
  const metadata = {
    test_cases: [
      { id: 'tc1', args: [[1, null, 2, 3]], expected: [1, 3, 2], input_types: ['tree'] },
      { id: 'tc2', args: [[4, 2, 6, 1, 3, 5, 7]], expected: [1, 2, 3, 4, 5, 6, 7], input_types: ['tree'] },
    ],
  }
  const candidate = buildSteppedSequenceFromMetadata(metadata, ['inorder-traversal'])
  assert.ok(candidate)
  assert.equal(candidate!.pattern, 'inorder_traversal')
})

test('a cross-check mismatch returns null (the shape does not solve this challenge)', () => {
  // Tagged for reversal but the expected output is NOT the reverse: disqualify.
  const metadata = {
    test_cases: [
      { args: [[1, 2, 3, 4]], expected: [4, 3, 2, 1] },
      { args: [[1, 2, 3]], expected: [9, 9, 9] }, // wrong oracle -> reject
    ],
  }
  assert.equal(buildSteppedSequenceFromMetadata(metadata, ['reverse-linked-list']), null)
})

test('a wrong-variant tree traversal is rejected, not animated wrongly', () => {
  // "Construct Binary Tree from Preorder and Inorder" is tagged 'inorder' but its
  // expected is a TREE array, not the inorder of its first arg. The cross-check
  // computes inorder([3,9,20,15,7]) and compares to [3,9,20,null,null,15,7];
  // lengths differ, so the shape is rejected rather than given a misleading trace.
  const metadata = {
    test_cases: [
      { args: [[3, 9, 20, 15, 7], [9, 3, 15, 20, 7]], expected: [3, 9, 20, null, null, 15, 7] },
    ],
  }
  assert.equal(buildSteppedSequenceFromMetadata(metadata, ['inorder']), null)
})

test('an unknown shape tag yields no candidate', () => {
  const metadata = { test_cases: [{ args: [[1, 2, 3]], expected: [3, 2, 1] }] }
  assert.equal(buildSteppedSequenceFromMetadata(metadata, ['heap', 'graph']), null)
})

test('a missing expected oracle on an extractable case disqualifies the trace', () => {
  const metadata = { test_cases: [{ args: [[1, 2, 3, 4]] }] } // no expected
  assert.equal(buildSteppedSequenceFromMetadata(metadata, ['reverse-linked-list']), null)
})

test('an oversized list is rejected (row would exceed the displayable extent)', () => {
  // 13 nodes -> over the 12-node cap.
  const big = Array.from({ length: 13 }, (_, i) => i)
  assert.equal(runSequenceTrace('reverse_linked_list', big), null)
  // The oracle still computes the true answer without the display-extent guard.
  assert.deepEqual(computeSequenceAnswer('reverse_linked_list', [1, 2, 3]), [3, 2, 1])
})
