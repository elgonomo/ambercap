/* Blog engine: no build step. To add a post: 1) create posts/<slug>.md  2) add one entry to posts.json */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var page = document.body.getAttribute("data-page");           // "list" or "post"
  var ROOT = document.body.getAttribute("data-root") || "";      // path from this page to /blog/ (normally empty)
  var SITE = "../index.html";

  var NAV = [["ABOUT", SITE + "#about"], ["GAME AUDIO", SITE + "#game-audio"], ["MUSIC", SITE + "#music"],
             ["DIY", SITE + "#diy"], ["PROJECTS", SITE + "#projects"], ["BLOG", ROOT + "index.html"], ["CONTACT / RATES", SITE + "#contact"]];

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (txt != null) { e.textContent = txt; } return e; }
  function a(href, cls, txt) { var e = el("a", cls, txt); e.href = href; return e; }
  function postUrl(p) { return ROOT + "post.html?p=" + encodeURIComponent(p.slug); }
  function fmtDate(d) { return d; }

  function chrome() {
    var nav = $("#nav"); nav.className = "nav"; nav.setAttribute("aria-label", "Main");
    NAV.forEach(function (n) { var l = a(n[1], n[0] === "BLOG" ? "on" : "", n[0]); nav.appendChild(l); });
    var f = $("#foot");
    f.appendChild(el("span", "", "AMBERCAP AUDIO // BY CHRIS LUCAS // (C) 2026"));
    f.appendChild(a(SITE, "", "[BACK TO MAIN SITE]"));
  }

  function sidebar(posts, active, tags) {
    var s = $("#side"); s.innerHTML = "";
    var b1 = el("div", "box"); b1.appendChild(el("h2", "", "LATEST"));
    var ul = el("ul");
    posts.slice(0, 5).forEach(function (p) {
      var li = el("li"); var l = a(postUrl(p), "", p.title); li.appendChild(l);
      li.appendChild(el("span", "d", fmtDate(p.date))); ul.appendChild(li);
    });
    b1.appendChild(ul); s.appendChild(b1);
    var b2 = el("div", "box tagsbox"); b2.appendChild(el("h2", "", "TAGS"));
    var c = el("div", "chips");
    tags.forEach(function (t) { c.appendChild(a(ROOT + "index.html#" + encodeURIComponent(t[0]), "chip", t[0] + " " + t[1])); });
    b2.appendChild(c); s.appendChild(b2);
  }

  function tagCounts(posts) {
    var m = {}; posts.forEach(function (p) { (p.tags || []).forEach(function (t) { m[t] = (m[t] || 0) + 1; }); });
    return Object.keys(m).sort().map(function (k) { return [k, m[k]]; });
  }

  function renderList(posts, tags) {
    var tag = decodeURIComponent(location.hash.replace(/^#/, ""));
    var chips = $("#chips"); chips.innerHTML = "";
    var all = a(ROOT + "index.html#", "chip" + (tag ? "" : " on"), "all " + posts.length); chips.appendChild(all);
    tags.forEach(function (t) { chips.appendChild(a(ROOT + "index.html#" + encodeURIComponent(t[0]), "chip" + (t[0] === tag ? " on" : ""), t[0] + " " + t[1])); });
    var box = $("#list"); box.innerHTML = "";
    var shown = posts.filter(function (p) { return !tag || (p.tags || []).indexOf(tag) >= 0; });
    if (!shown.length) { box.appendChild(el("p", "empty", "> no posts here yet")); }
    shown.forEach(function (p) {
      var r = a(postUrl(p), "row"); 
      r.appendChild(el("span", "m", fmtDate(p.date) + (p.tags && p.tags.length ? "  //  " + p.tags.join(", ") : "")));
      r.appendChild(el("span", "t", p.title));
      if (p.summary) { r.appendChild(el("p", "s", p.summary)); }
      box.appendChild(r);
    });
  }

  function loadScript(src) {
    return new Promise(function (ok, no) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  }

  function renderPost(posts) {
    var slug = new URLSearchParams(location.search).get("p");
    var i = posts.findIndex(function (p) { return p.slug === slug; });
    var box = $("#post");
    if (i < 0) { box.appendChild(el("p", "empty", "> post not found")); return; }
    var p = posts[i];
    document.title = p.title + " | Ambercap Audio";
    $("#title").textContent = p.title;
    $("#meta").textContent = fmtDate(p.date) + (p.tags && p.tags.length ? "  //  " + p.tags.join(", ") : "");
    Promise.all([
      loadScript(ROOT + "marked.min.js"),
      fetch(ROOT + "posts/" + p.slug + ".md").then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.text(); })
    ]).then(function (res) {
      box.innerHTML = window.marked.parse(res[1]);
      var pn = $("#pn"); pn.innerHTML = "";
      var newer = posts[i - 1], older = posts[i + 1];
      pn.appendChild(older ? a(postUrl(older), "", "<< " + older.title) : el("span"));
      pn.appendChild(newer ? a(postUrl(newer), "", newer.title + " >>") : el("span"));
    }).catch(function () { box.appendChild(el("p", "empty", "> could not load this post")); });
  }

  chrome();
  fetch(ROOT + "posts.json").then(function (r) { return r.json(); }).then(function (posts) {
    posts.sort(function (x, y) { return x.date < y.date ? 1 : -1; });
    var tags = tagCounts(posts);
    sidebar(posts, null, tags);
    if (page === "list") { renderList(posts, tags); window.addEventListener("hashchange", function () { renderList(posts, tags); }); }
    else { renderPost(posts); }
  }).catch(function () {
    var t = $("#list") || $("#post"); if (t) { t.appendChild(el("p", "empty", "> could not load posts.json (open through the published site or a local server)")); }
  });
})();
