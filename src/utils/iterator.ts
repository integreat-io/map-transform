export function runIterator(iterator: Generator<unknown, unknown, unknown>) {
  let result = iterator.next()
  while (!result.done) {
    // The iterator has yielded. We don't need to await anything, so we just
    // pass on the value and continue the iterator.
    result = iterator.next(result.value)
  }

  // Done, return the result
  return result.value
}

export async function runIteratorAsync(
  iterator: Generator<unknown, unknown, unknown>,
) {
  let result = iterator.next()
  while (!result.done) {
    // The iterator has yielded. Await the value and continue the iterator.
    result = iterator.next(await result.value)
  }

  // Done, return the result
  return result.value
}
