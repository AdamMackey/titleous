# Titleous

Keeps your claude.ai tab named after the chat you're actually in.

claude.ai switches chats without reloading the page, so a tab often keeps the
name of the chat it first opened, and only a refresh puts it right. Titleous is
a small userscript that makes the tab follow you within a second, however you
switch: the sidebar, search, the keyboard, or Back and Forward.

- **Zero network calls.** It reads the chat's name from claude.ai's own sidebar
  and never sends anything anywhere.
- **Never guesses.** If the chat's name isn't on the page, a title that still
  names a different chat goes back to plain "Claude" instead of staying wrong.
- **claude.ai only**, top frame only.

## Install

**Safari (Mac, iPhone, iPad):** install [Userscripts](https://github.com/quoid/userscripts)
from the App Store and turn it on in Safari's Extensions settings. If you use
Safari profiles, turn it on in each profile you use claude.ai in. Allow it on
claude.ai, then open
[`titleous.user.js`](https://raw.githubusercontent.com/AdamMackey/titleous/main/titleous.user.js)
and install it from the Userscripts toolbar button. Reload any claude.ai tabs
that were already open.

**Chrome, Firefox or Edge:** install [Violentmonkey](https://violentmonkey.github.io/)
or [Tampermonkey](https://www.tampermonkey.net/), then open the same
[raw file](https://raw.githubusercontent.com/AdamMackey/titleous/main/titleous.user.js)
and confirm the install.

Tested in Safari with Userscripts on macOS. It's plain DOM code, so other
managers should work too. Updates come through your script manager from this
repo.

## How it works

It has to get three things right, and each one broke an earlier version:

1. **claude.ai blocks scripts injected into its page.** Its Content Security
   Policy silently stops them, so Titleous runs in the extension's own content
   world (`@inject-into content`) instead. Reading the sidebar and setting the
   tab title both work from there.
2. **claude.ai can be slow to change the address** after you click a chat, so
   Titleous watches the address itself, four times a second, and keeps looking
   for ten seconds after it changes.
3. **claude.ai remembers the chat the tab first opened** and puts that title
   back later. A one-second watchdog puts the right name back, capped at thirty
   corrections in five seconds so it can never fight the page in a loop.

## If a tab keeps the wrong name

Open the browser's JavaScript console on a claude.ai tab (in Safari,
**Develop → Show JavaScript Console**) and run:

```js
document.documentElement.dataset.titleous
```

- A reply like `1.0.0 1:16:29 AM named /chat/… "My chat" | 2 corrections, …`
  means Titleous is running, and shows what it last did.
- `undefined` means it isn't running on that tab. Check that your script
  manager is allowed on claude.ai (and switched on for that Safari profile),
  then reload the tab.

claude.ai changes often. If something breaks, please open an
[issue](https://github.com/AdamMackey/titleous/issues) with that line.

## Support

Titleous is free. If it saves you a few refreshes, you can
[buy me a coffee](https://buymeacoffee.com/adammackey).

## More from MackEye Apps

Titleous is one of the small apps from [MackEye Apps](https://mackeye.app):
Mac utilities like Desktop Please and Hold Please, and tools for Claude like
Meterous and Pulseous. See them all at [mackeye.app](https://mackeye.app).

## License

MIT. See [LICENSE](LICENSE).

Titleous is an independent project, not affiliated with or endorsed by
Anthropic. Claude is a trademark of Anthropic, PBC, and "claude.ai" appears
here only to say which site Titleous works on.
