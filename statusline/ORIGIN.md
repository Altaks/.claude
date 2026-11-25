# Origin

`statusline.sh` started from https://github.com/daniel3303/ClaudeCodeStatusLine (v1.4.5, MIT, see
`LICENSE`) and has since been reworked: the line is grouped by meaning (model and effort, code, session,
quotas, version) with `│` between groups and `·` inside them, the context share is coloured by how full
it is, the dollar cost and the upstream update notice are gone, extra credit shows only once capped and
in use, reset times are short and French (`00h40`, `lun 01h53`), and the version check follows the
release channel in settings (`autoUpdatesChannel`) and shows `⇡<version>` in red only when behind.
