export function caretFromPoint(
  x: number,
  y: number,
): null | {
  offset: number
  node: Node
} {
  if (typeof document.caretRangeFromPoint !== 'undefined') {
    const range = document.caretRangeFromPoint(x, y)
    if (range === null) {
      return null
    }
    return {
      node: range.startContainer,
      offset: range.startOffset,
    }
  } else if (
    typeof (
      document as unknown as {
        caretPositionFromPoint?: (
          x: number,
          y: number,
        ) => { offsetNode: Node; offset: number } | null
      }
    ).caretPositionFromPoint !== 'undefined'
  ) {
    const doc = document as unknown as {
      caretPositionFromPoint: (x: number, y: number) => { offsetNode: Node; offset: number } | null
    }
    const range = doc.caretPositionFromPoint(x, y)
    if (range === null) {
      return null
    }
    return {
      node: range.offsetNode,
      offset: range.offset,
    }
  } else {
    // Gracefully handle IE
    return null
  }
}
