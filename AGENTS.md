# The repo

MapTransform is a data transformer that may be given a mutation definition and
data, and it will transform the data to a desired state.

## Structure

- `src/legacy/` is the current official API, exported from `src/index.ts`. It is
  still supported and maintained.
- `src/prep/` and `src/run/` make up the v2 API, exported as
  `map-transform/next`. The two APIs should be kept functionally in sync, but
  `next` is allowed breaking changes where legacy is not.
- The v2 engine compiles a definition once (`prep/`) into a `PreppedPipeline`,
  which is then executed (`run/`, in a sync and an async variant). An operation
  is usually a file of the same name in both folders.
- Transformations run in both directions, so every operation has to handle `rev`
  as well as forward.
- `README.md` is the API reference, `WRITING_PIPELINES.md` the conceptual guide.

## Commands

- `npm run verify` runs lint, `tsc --noEmit --strict`, and the tests.
- `npm run dev` runs the tests in watch mode.
- `npm run test:perf` runs the performance suite.

# Preferred agent behavior

- IMPORTANT: Read what kind of conversation we're in before acting. Two modes:
  - **Directive** — I've handed you a task ("please fix this", "add X", "rename
    Y"). Here, go ahead and do it; a hunch I include ("...my hunch is it's the
    cache") is help, not a gate.
  - **Discussion** — we're figuring something out together ("what do you think
    about this?", "should we...?", "I'm wondering if..."). Here your job is to
    investigate, explain, and propose so we can reach a conclusion together. Do
    NOT start implementing mid-discussion — that breaks the back-and-forth
    before we've actually decided.
- In a discussion, my replies (including hunches and opinions) are turns in the
  conversation, not approval. Implement only once we've landed on a conclusion
  together, or once the discussion clearly turns into a directive ("ok, do it").
- When you can't tell which mode we're in, assume discussion: answer, propose,
  and wait.
- Be brief and to the point. Don't answer simple questions with long answers
  unless asked to elaborate.
- Don't do more than I ask you to do. If I ask you a question, answer it and
  then STOP.
- Don't implement fixes, make changes, or address other issues you notice unless
  explicitly asked. Even if you find problems while investigating, only mention
  them if directly relevant to the question.
- If you run into unexpected issues while implementing what we planned, so that
  you have, to reconsider parts of the plan – stop and ask for input. Don't make
  any big decitions to change the plan without consulting the user.
- After writing or editing any file, run `npx prettier --write` on it.
- Update `README.md`, when you implement something that directly affect
  functionality at the user-facing level.
- Prefer removing code to adding more. Instead of adding special rules, consider
  if the more generalized rules are wrong.
- A comment covers only what the code can't say itself. Apply this test before
  writing one: would a reader who never saw our conversation ask this question?
  If the comment explains a decision we made, a road not taken, or something to
  do later, delete it — that belongs in a plan or an issue, not above the code.
  Default to one line; if you write a second, check it isn't restating what's
  already visible.

# TypeScript rules

- Check for TypeScript and lint errors
- Important: You should NEVER use `any` to fix type issues!
- Whenever you use inline typing with `as` you should reconsider if there are
  better ways of doing this.
- You should avoid doing local type overrides as far as possible.
- Avoid inline types like `{ foo: string }` - instead reuse existing types from
  the codebase or import from generated types.
- Prefer using generic type parameters over type assertions - for example,
  `createMockGraphQLRequestClient<MutationArgs>(...)` instead of
  `(variables as MutationArgs)`.
- When importing types, use `import type` and place directive below other import
  directives.
- When a file has a main function, use default export. When a file have several
  functions, without any of them being the main one, use named exports. Also use
  named exports for "support function" when there's a main function.
- Don't use `await import` (dyanamic imports) unless there's a real need for it.
- Pass function arguments positionally when practical. Order them so the most
  commonly passed comes first. An object is still right when: there are more
  than five parameters; there are three or more where several are optional and
  callers routinely skip the middle ones (`f(a, undefined, d)` is the smell);
  the set is passed around as a unit and already has a name in the domain, so
  the type is genuinely shared rather than existing for one signature; or it's
  React component props.

# Node.js rules

- Prefer built-in Node.js functionality over installing packages.
- When using an external package, try first to use the features of that package,
  before implementing custom workarounds.
- Prefer packages from @sindresorhus over equal alternatives from others.
- Prefer the latest version of packages, and check that packages are not
  deprecated.

# Testing rules

Tests are written to be read by a human. A test is the documentation of a
behaviour, and its reader doesn't necessarily know the code — so what it does,
what it sends, and what it expects all have to be visible in the test itself.
Readability wins over brevity, cleverness, and every instinct to factor out
repetition.

- Don't factor tests to remove duplication. Ten near-identical tests that each
  read top to bottom are better than one parameterized loop or a set of shared
  helpers. What a test needs to _exist_ — database fixtures, a server, a client
  — may be shared; what it _does and expects_ may not.
- Use literal, concrete values rather than computed or derived ones, so the
  reader sees the actual data instead of the recipe for it.
- Write tests in the built in node test runner.
- Import assertions from `node:assert/strict` so you don't have to specify
  "strict" on every assertion.
- Write test names starting with "should", e.g. "should return the first item"
- Each test should consist of three steps in this exact order:
  1. **Setup** - Set up any necessary preconditions and define expected values
  2. **Execution** - Call the function or code being tested
  3. **Assertions** - Verify the results match expectations
- Separate these three groups with blank lines. Don't use blank lines within a
  group.
- In the setup section, define an `expected` variable when the test involves
  comparing a result to an expected value. If there are more expected values,
  name them with the `expected` prefix. Keep the expected variables below the
  other setup code. This makes the test's purpose clearer.
- When the expected result is fully deterministic, use `assert.deepEqual` to
  compare the entire response — this catches unexpected changes in any field.
  When the result contains dynamic values (`id`, `createdAt`, timestamps), use
  field-level assertions (`assert.equal`, `assert.ok`) on the known fields.
- Use `sinon` for mocking.
- Chaining methods in test setup, like
  `sinon.stub().returns(...).onFirstCall().returns(...)`, as oposed to starting
  each line with the mock variable.
- Keep unit tests with the file that's being tested.
- Integration tests live in `src/tests/` for the v2 API and `src/legacy/tests/`
  for the legacy API.
- When I ask you to update tests, do it without updating the implementation. I
  want to see the tests failing before I ask you to update the implementation.

## Example test structure

```typescript
test('should return the sum of two numbers', () => {
  const a = 2
  const b = 3
  const expected = 5

  const result = add(a, b)

  assert.equal(result, expected)
})
```
