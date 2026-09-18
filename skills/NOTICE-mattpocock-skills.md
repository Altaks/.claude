# Third-party skills: mattpocock/skills

The following skills in this directory are vendored, unmodified, from
[mattpocock/skills](https://github.com/mattpocock/skills) (the 15 skills listed in
that repo's `.claude-plugin/plugin.json`):

`caveman`, `diagnose`, `grill-me`, `grill-with-docs`, `handoff`,
`improve-codebase-architecture`, `prototype`, `setup-matt-pocock-skills`, `tdd`,
`teach`, `to-issues`, `to-prd`, `triage`, `write-a-skill`, `zoom-out`.

The category nesting from upstream (`skills/engineering/*`, `skills/productivity/*`)
was flattened into this folder; the skill contents are unchanged.

Note: several of these (`to-issues`, `to-prd`, `triage`, `diagnose`, `tdd`,
`improve-codebase-architecture`, `zoom-out`) expect an `## Agent skills` block in
CLAUDE.md plus `docs/agents/` describing this repo's issue tracker and domain docs.
Run `setup-matt-pocock-skills` before relying on them here, or they will be missing
project context. `tdd` is generic test-driven development and is independent of the
repo's Kotlin tooling; this repo's own implementation workflow lives in
`alta-dev`.

## License

These skills are distributed under the MIT License. Per its terms, the copyright
and permission notice is reproduced here for the vendored copies:

```
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
