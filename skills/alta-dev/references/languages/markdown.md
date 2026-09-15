# Markdown et prose technique

Read with `roles/documentation.md`, which covers what to write. This file covers how to write it.

## Structure

- One `#` per document, then a strict hierarchy. Never skip a level to get a font size.
- A heading names the content, not the ceremony: "Migrations", not "Some notes about migrations".
- Short paragraphs, one idea each. If a paragraph has three ideas, it is three paragraphs or a list.
- Tables for anything with parallel items and more than two of them. A bulleted list of "X: Y" pairs is
  a table in disguise.
- Fenced code blocks with the language tag, always, so highlighting and copy-paste work.
- Relative links between documents in the repository, so they survive a rename of the host.
- Front matter exactly as the site or tool expects it: tags, title, order. It is part of the contract,
  not decoration.

## Style

- Say the thing, then stop. No padding, no "in this section we will", no filler transition.
- Concrete over abstract: the command, the path, the real example rather than a description of one.
- Imperative for instructions ("Run the gate before claiming done"), present tense for behaviour.
- Define an acronym once, at first use.
- Content language matches the audience; identifiers, commands and file names stay as they are in the
  code.
- Correct grammar and accents in the content language. A documentation site with agreement errors reads
  as unmaintained.

## Hard rules

- **No em dash (U+2014), anywhere.** Use a colon, a comma, a semicolon, a period, parentheses, or an
  ASCII hyphen with spaces. If the sentence reads naturally without the long dash, that is the rewrite.
- **No AI attribution**, in a document, a commit message or a PR body.
- No decorative badge. A badge that carries live status (quality gate, build) earns its place; the rest
  is noise.
- No template boilerplate left behind. A README still containing the forge's generated instructions is
  an unfinished README.

## Gate

- Markdown lint and the formatter run in CI, with the configuration committed.
- A grammar pass over content pages in the audience's language, keeping only the real mistakes
  (agreement, elision, hyphenation), not pure typographic preferences.
- Link checking, so a rename does not silently break navigation.
- Smoke tests over the rendered pages for a documentation site, because a broken build should not be
  found by a reader.
