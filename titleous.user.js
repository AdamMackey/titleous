// ==UserScript==
// @name         Titleous
// @namespace    https://github.com/AdamMackey/titleous
// @version      1.0.0
// @description  Keeps your claude.ai browser tab named after the chat you're actually in when you switch chats, no refresh needed. Zero network calls.
// @author       Adam Mackey
// @license      MIT
// @homepageURL  https://github.com/AdamMackey/titleous
// @supportURL   https://github.com/AdamMackey/titleous/issues
// @updateURL    https://raw.githubusercontent.com/AdamMackey/titleous/main/titleous.user.js
// @downloadURL  https://raw.githubusercontent.com/AdamMackey/titleous/main/titleous.user.js
// @match        https://claude.ai/*
// @run-at       document-idle
// @grant        none
// @inject-into  content
// @noframes
// ==/UserScript==

// claude.ai swaps chats in place without loading a new page, and the tab title
// can stay on the chat the tab first opened until a refresh. This sets the
// title from the name on the page's own link to the chat you're on, which is
// how the sidebar lists chats. It never guesses from anywhere else. When it
// can't find the name, it clears a title that still names a different chat
// rather than leave the wrong one up.
//
// Three things it has to get right:
//   1. claude.ai's Content Security Policy blocks scripts injected into the
//      page itself, so this runs in the extension's content world
//      (@inject-into content). Reading the sidebar and setting document.title
//      both work from there.
//   2. claude.ai can take a while to change the address after you click, so
//      this watches the address itself and keeps looking for ten seconds
//      after it changes, however the switch happened.
//   3. claude.ai keeps its own idea of the title (the chat the tab first
//      loaded) and puts it back later, so a one-second watchdog puts the right
//      name back, never more than thirty times in five seconds.

(() => {
  'use strict';

  const VERSION = '1.0.0';
  const SUFFIX = ' - Claude';
  const known = new Map(); // chat path -> name, so the title holds while the sidebar re-renders

  // Private-use characters (icon fonts) and invisible fillers draw as a "?" box
  // in a tab bar. Emoji joiners, variation selectors and flag tags are kept.
  const UNDRAWABLE = /[\p{Co}​⁠-⁤﻿]/gu;
  const tidy = (s) => (s || '').replace(UNDRAWABLE, '').replace(/\s+/g, ' ').trim();
  const bare = (p) => p.replace(/\/+$/, '');

  // The chat you're on: the /chat/<id> part of the address, whatever the id
  // looks like and wherever it sits (chats inside projects too).
  const chatPath = () => (location.pathname.match(/\/chat\/[^/]+/) || [])[0];

  const nameOf = (path) => {
    for (const link of document.querySelectorAll('a[href*="/chat/"]')) {
      if (!bare(link.pathname).endsWith(path)) continue;
      const name = tidy(link.getAttribute('title') || link.getAttribute('aria-label') || link.textContent);
      if (name) return name;
    }
    return known.get(path);
  };

  // Corrections keep coming while the page keeps reverting the title, but at
  // most thirty in five seconds: a page fighting back gets one correction per
  // watchdog tick, never a loop. Each new chat starts with a fresh allowance.
  let recent = [];
  let corrections = 0;
  let lastReplaced = '';
  const setTitle = (title) => {
    if (document.title === title) return;
    const now = Date.now();
    recent = recent.filter((at) => now - at < 5000);
    if (recent.length >= 30) return;
    recent.push(now);
    corrections += 1;
    lastReplaced = document.title;
    document.title = title;
  };

  const namesAnotherChat = (path) => {
    for (const [other, otherName] of known) {
      if (other !== path && document.title === otherName + SUFFIX) return true;
    }
    return false;
  };

  // What the last check found, for troubleshooting. Readable from the page's
  // console as document.documentElement.dataset.titleous.
  const note = (what) => {
    document.documentElement.dataset.titleous =
      `${VERSION} ${new Date().toLocaleTimeString()} ${what} | ${corrections} corrections, last replaced "${lastReplaced}"`;
  };

  const sync = () => {
    const path = chatPath();
    if (!path) {
      // Left the chats (home, projects, settings): don't keep a chat's name up.
      if (namesAnotherChat(null)) setTitle('Claude');
      note(`not on a chat (${location.pathname})`);
      return;
    }
    const name = nameOf(path);
    if (name) {
      known.set(path, name);
      setTitle(name + SUFFIX);
      note(`named ${path} "${name}"`);
      return;
    }
    // Not on the page yet. A title still naming another chat seen earlier is
    // stale, and a plain one beats the wrong one.
    if (namesAnotherChat(path)) setTitle('Claude');
    note(`no sidebar link for ${path} (${document.querySelectorAll('a[href*="/chat/"]').length} chat links on the page)`);
  };

  // After a switch, look again and again for up to ten seconds, since the new
  // chat's name can take a while to show up in the sidebar.
  let pending = [];
  const burst = () => {
    pending.forEach(clearTimeout);
    pending = [0, 150, 400, 800, 1500, 3000, 6000, 10000].map((ms) => setTimeout(sync, ms));
  };

  // The switch itself: watch the address four times a second. This catches
  // every way of switching (sidebar, search, keyboard, Back/Forward, a link in
  // a chat) however long claude.ai takes to change the address.
  let lastPath = chatPath() || location.pathname;
  setInterval(() => {
    const path = chatPath() || location.pathname;
    if (path === lastPath) return;
    lastPath = path;
    recent = [];
    burst();
  }, 250);

  addEventListener('popstate', burst);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) burst(); });
  // Put the right name back the moment the page changes the title.
  new MutationObserver(sync).observe(document.head, { childList: true, subtree: true, characterData: true });
  // The watchdog: once a second, put the right name back if the page has
  // changed it, and catch a chat getting its first title or being renamed.
  // A check is one small DOM query, so this costs nothing noticeable.
  setInterval(sync, 1000);
  burst();
})();
