# -*- coding: utf-8 -*-
"""Static site generator for the portfolio. Run: python3 _build/build.py"""
import html, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from content import (CDN, IMG, CONTACT, HOME, CASES, SHOW, HERO, EXPERIENCE, EXPERIENCE_INTRO,
                     TOOLKIT, STATS, ABOUT_STATEMENT, SERVICES, PRINCIPLES, PROCESS2, DECISIONS)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SITE = "https://vkadzhik.ru"
NAME = ("Каджик Варданян", "Kadzhik Vardanyan")
e = html.escape
BY = {c["slug"]: c for c in CASES}
LISTED = [BY[s] for s in SHOW]


def T(pair, tag="span", cls="", attrs=""):
    """Bilingual element pair. Text may contain trusted inline HTML."""
    ru, en = pair
    c = (" " + cls) if cls else ""
    a = (" " + attrs) if attrs else ""
    return (f'<{tag} class="l-ru{c}" lang="ru"{a}>{ru}</{tag}>'
            f'<{tag} class="l-en{c}" lang="en"{a}>{en}</{tag}>')


def src(name):
    return CDN + IMG[name][0] + ".png"


def img(name, alt, cls="", eager=False, sizes="100vw", zoom=True, vt=None):
    _, w, h = IMG[name]
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    z = ' data-zoom' if zoom else ''
    if vt: z += f' style="view-transition-name:{vt}"'
    return (f'<img class="{cls}" src="{src(name)}" width="{w}" height="{h}" {load} decoding="async" '
            f'alt="{e(alt[0])}" data-alt-ru="{e(alt[0])}" data-alt-en="{e(alt[1])}" sizes="{sizes}"{z}>')


ARROW_OUT = '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ARROW_R = '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
CURSOR = '<svg class="cursor__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill="currentColor"/></svg>'
I_TG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 4.2 2.9 11.4c-1 .4-1 1.6 0 1.9l4.6 1.5 1.8 5.6c.2.7 1.1.9 1.6.3l2.6-2.7 4.8 3.5c.6.4 1.4.1 1.6-.6l3-15c.2-1-.7-1.9-1.4-1.7Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m7.6 14.8 9.6-6.9" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
I_MAIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
I_GH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'


def head(title, desc, path, image=None, depth=0):
    pre = "../" * depth
    og = image or (CDN + "debfb55d-a26d-4d68-a0da-c565573b01d1.png")
    return f"""<!doctype html>
<html lang="en" data-lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>(function(){{var l='en';try{{var q=new URLSearchParams(location.search).get('lang');if(q==='ru'||q==='en'){{l=q;localStorage.setItem('lang',q)}}else{{l=localStorage.getItem('lang')||'en'}}}}catch(x){{}}document.documentElement.setAttribute('data-lang',l);document.documentElement.lang=l;}})();</script>
<title>{e(title[1])}</title>
<meta name="description" content="{e(desc[1])}">
<meta name="author" content="Kadzhik Vardanyan">
<meta name="theme-color" content="#F6F7F4">
<meta property="og:type" content="website">
<meta property="og:title" content="{e(title[1])}">
<meta property="og:description" content="{e(desc[1])}">
<meta property="og:url" content="{SITE}{path}">
<meta property="og:image" content="{og}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{SITE}{path}">
<link rel="icon" href="{pre}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{pre}assets/site.css?v=3">
<meta name="x-title-ru" content="{e(title[0])}"><meta name="x-title-en" content="{e(title[1])}">
</head>
<body>
<script>document.documentElement.classList.add("js")</script>
<a class="skip" href="#main">{T(("Перейти к содержанию", "Skip to content"))}</a>
"""


def header(depth=0, current=""):
    pre = "../" * depth
    home = "" if depth == 0 else pre + "index.html"
    def nav(href, pair, key):
        cur = ' aria-current="page"' if key == current else ""
        return f'<a href="{href}"{cur}>{T(pair)}</a>'
    links = (nav(home + '#work', ('Проекты', 'Projects'), 'work') + nav(home + '#experience', ('Опыт', 'Experience'), 'exp')
             + nav(home + '#about', ('Обо мне', 'About'), 'about') + nav(home + '#contact', ('Контакты', 'Contact'), 'contact'))
    return f"""<header class="top">
  <div class="wrap top__in">
    <a class="brand" href="{pre}index.html"><span class="brand__mark" aria-hidden="true">KV</span><span class="brand__name">{T(NAME)}</span></a>
    <nav class="top__nav" aria-label="Main">{links}</nav>
    <div class="lang" role="group" aria-label="Language">
      <button type="button" data-set-lang="en">EN</button><button type="button" data-set-lang="ru">RU</button>
    </div>
    <button type="button" class="burger" aria-expanded="false" aria-controls="mnav"><span></span><span></span><span class="sr">Menu</span></button>
  </div>
  <nav class="mnav" id="mnav" aria-label="Mobile" hidden><div class="wrap mnav__in">{links}</div></nav>
</header>
"""


def footer(depth=0):
    pre = "../" * depth
    return f"""<footer class="foot">
  <div class="wrap">
    <div class="foot__top">
      <p class="foot__links"><a href="{CONTACT['telegram']}">Telegram</a><a href="mailto:{CONTACT['email']}">{CONTACT['email']}</a><a href="{CONTACT['github']}">GitHub</a></p>
      <a class="totop" href="#main">{T(("Наверх", "Back to top"))} ↑</a>
    </div>
    <p class="foot__word" aria-hidden="true">Kadzhik Vardanyan</p>
    <p class="foot__copy">© 2026 {T(NAME)} · {T(("UX/UI и продуктовый дизайн", "UX/UI & product design"))}</p>
  </div>
</footer>
<div class="pill" aria-hidden="true">{T(("Открыть кейс", "View case"))}</div>
<div class="peek" aria-hidden="true"><img alt=""></div>
<dialog class="zoom" aria-label="Image">
  <button type="button" class="zoom__close" data-close>{T(("Закрыть", "Close"))}</button>
  <img alt="">
</dialog>
<script src="{pre}assets/site.js?v=3" defer></script>
</body>
</html>
"""


def contact_block():
    return f"""<section class="contact" id="contact" aria-labelledby="contact-h">
  <div class="wrap contact__in">
    <p class="eyebrow"><span class="mono">(04)</span> {T(("Контакты", "Contact"))}</p>
    <h2 id="contact-h" class="contact__h">{T(("Давайте сделаем ваш продукт понятным.", "Let's make your product easy to use."))}</h2>
    <p class="contact__lead">{T(("Быстрее всего отвечаю в Telegram. Открыт к новым проектам и готов выполнить тестовое задание.", "Telegram is the fastest way to reach me. Open to new projects and happy to do a test task."))}</p>
    <div class="contact__ways">
      <a class="btn btn--solid" href="{CONTACT['telegram']}">{T(("Написать в Telegram", "Message on Telegram"))}{ARROW_R}</a>
      <a class="btn" href="mailto:{CONTACT['email']}">{CONTACT['email']}</a>
    </div>
  </div>
</section>
"""


# ---------------------------------------------------------------- home
def build_home():
    out = [head(HOME["title"], HOME["description"], "/"), header(0)]
    out.append('<main id="main">')
    stats = "".join(f'<li><b>{n}</b><span>{T(l)}</span></li>' for n, l in STATS)
    out.append(f"""
<section class="hero">
  <div class="wrap hero__in">
    <div class="hero__photo reveal">
      <span class="hero__disc" aria-hidden="true"></span>
      <img src="assets/me.jpg" width="600" height="750" alt="Kadzhik Vardanyan" fetchpriority="high">
    </div>
    <div class="hero__txt">
      <p class="hero__hello">{T(HERO['hello'])}</p>
      <h1 class="hero__name"><span class="hero__first">{T(("Каджик", "Kadzhik"))}</span> <span class="hero__last">{T(("Варданян", "Vardanyan"))}<span class="sel" aria-hidden="true"><i></i><i></i><i></i><i></i><b>{T(HERO['city'])}</b></span></span></h1>
      <p class="hero__role">{T(HERO['role'])}</p>
      <p class="hero__about">{T(HERO['about'])}</p>
      <p class="hero__exp">{T(HERO['expertise'])}</p>
      <div class="cursor" aria-hidden="true">{CURSOR}<span class="cursor__tag"><span class="dot"></span>{T(HERO['cursor'])}</span></div>
    </div>
  </div>
  <div class="wrap">
    <ul class="stats reveal">{stats}</ul>
    <ul class="hero__contacts">
      <li><a href="{CONTACT['telegram']}">{I_TG}<span>{CONTACT['telegram_label']}</span></a></li>
      <li><a href="mailto:{CONTACT['email']}">{I_MAIL}<span>{CONTACT['email']}</span></a></li>
      <li><a href="{CONTACT['github']}">{I_GH}<span>github.com/vkadzhik</span></a></li>
    </ul>
  </div>
</section>
""")
    cards = []
    for i, c in enumerate(LISTED):
        href = f"cases/{c['slug']}.html"
        tags = "".join(f"<span>{t}</span>" for t in c.get("tags", []))
        cards.append(f"""
      <li class="card reveal" style="--c:{c['color']}">
        <a class="card__a" href="{href}">
          <span class="card__img">{img(c['cover'], c['name'], sizes='(min-width: 900px) 46vw, 100vw', zoom=False, vt='cover-'+c['slug'])}</span>
          <span class="card__meta"><span class="card__n">{i+1:02d}</span><span class="card__name">{T(c['name'])}</span><span class="card__kind">{T(c['kind'])}</span><span class="card__go" aria-hidden="true">{ARROW_R}</span></span>
        </a>
      </li>""")
    out.append(f"""
<section class="work" id="work" aria-labelledby="work-h">
  <div class="wrap">
    <div class="sec-head reveal">
      <div><p class="eyebrow"><span class="mono">(01)</span> {T(("Проекты", "Projects"))}</p><h2 id="work-h" class="sec-h">{T(("Мои кейсы", "My case studies"))}</h2></div>
      <p class="sec-sub">{T(("Казино, криптодашборд, мобильный банк и B2B-кабинет с виджетом на живых данных. В каждом кейсе — задача, решения, экраны и цифры.", "A casino, a crypto dashboard, a mobile bank and a B2B web app with a widget on live data. Each case covers the problem, the decisions, the screens and the numbers."))}</p>
    </div>
    <ol class="cards">{''.join(cards)}
    </ol>
  </div>
</section>
""")
    rows = []
    for i, x in enumerate(EXPERIENCE):
        c = BY[x["slug"]]
        rows.append(f"""
      <li class="xp reveal" style="--c:{c['color']}" data-peek="{src(c['cover'])}">
        <details{' open' if i == 0 else ''}>
          <summary class="xp__row">
            <span class="xp__year mono">{x['year']}</span>
            <span class="xp__name">{x['name']}</span>
            <span class="xp__what">{T(x['what'])}</span>
            <span class="xp__role">{T(x['role'])}</span>
            <span class="xp__plus" aria-hidden="true"></span>
          </summary>
          <div class="xp__body">
            <div><p class="xp__k">{T(("Задача", "Task"))}</p><p>{T(x['task'])}</p></div>
            <div><p class="xp__k">{T(("Что я сделал", "What I did"))}</p><p>{T(x['did'])}</p></div>
            <div><p class="xp__k">{T(("Результат", "Outcome"))}</p><p>{T(x['result'])}</p></div>
            <div class="xp__dec"><p class="xp__k">{T(("Ключевые решения", "Key decisions"))}</p><ol>{''.join(f"<li>{T(d)}</li>" for d in DECISIONS[x['slug']])}</ol></div>
            <a class="xp__link" href="cases/{c['slug']}.html">{T(("Открыть кейс", "View case"))}{ARROW_R}</a>
          </div>
        </details>
      </li>""")
    out.append(f"""
<section class="exp" id="experience" aria-labelledby="exp-h">
  <div class="wrap">
    <div class="sec-head reveal">
      <div><p class="eyebrow"><span class="mono">(02)</span> {T(("Опыт", "Experience"))}</p><h2 id="exp-h" class="sec-h">{T(("Опыт", "Experience"))}</h2></div>
    </div>
    <div class="xp__cap mono" aria-hidden="true"><span>{T(("Год", "Year"))}</span><span>{T(("Проект", "Project"))}</span><span>{T(("Продукт", "Product"))}</span><span>{T(("Роль", "Role"))}</span><span></span></div>
    <ol class="xps">{''.join(rows)}
    </ol>
  </div>
</section>
""")
    services = "".join(f'<li class="svc reveal"><span class="mono svc__n">{i+1:02d}</span><h3 class="svc__h">{T(h)}</h3><p>{T(d)}</p></li>' for i, (h, d) in enumerate(SERVICES))
    principles = "".join(f'<li><h3>{T(h)}</h3><p>{T(d)}</p></li>' for h, d in PRINCIPLES)
    steps = "".join(f'<li class="step reveal"><span class="mono step__n">{i+1:02d}</span><h3 class="step__h">{T(h)}</h3><p class="step__d">{T(d)}</p><p class="step__out"><span class="mono">{T(("Результат", "Output"))}</span>{T(o)}</p></li>' for i, (h, d, o) in enumerate(PROCESS2))
    tools = "".join(f"<li>{t}</li>" for t in TOOLKIT)
    out.append(f"""
<section class="about" id="about" aria-labelledby="about-h">
  <div class="wrap">
    <div class="sec-head reveal">
      <div><p class="eyebrow"><span class="mono">(03)</span> {T(("Обо мне", "About"))}</p><h2 id="about-h" class="sec-h">{T(("Обо мне", "About me"))}</h2></div>
    </div>
    <p class="statement reveal">{T(ABOUT_STATEMENT)}</p>
    <h3 class="sub-h reveal">{T(("Чем я занимаюсь", "What I do"))}</h3>
    <ul class="svcs">{services}</ul>
    <div class="split">
      <div class="reveal">
        <h3 class="sub-h">{T(("Как я работаю", "How I work"))}</h3>
        <ul class="principles">{principles}</ul>
      </div>
      <div class="reveal">
        <h3 class="sub-h">{T(("Инструменты", "Toolkit"))}</h3>
        <ul class="chips">{tools}</ul>
      </div>
    </div>
    <h3 class="sub-h reveal">{T(("Процесс", "Process"))}</h3>
    <ol class="steps">{steps}</ol>
  </div>
</section>
""")
    out.append(contact_block())
    out.append("</main>")
    out.append(footer(0))
    write("index.html", "".join(out))


# ---------------------------------------------------------------- case pages
def block(b):
    k = b[0]
    if k == "p":
        return T(b[1], "p")
    if k == "quote":
        return f'<blockquote class="quote">{T(b[1], "p")}</blockquote>'
    if k in ("ul", "ol"):
        return f'<{k} class="list">' + "".join(f"<li>{T(x)}</li>" for x in b[1]) + f"</{k}>"
    if k == "defs":
        return '<dl class="defs">' + "".join(f'<div><dt>{T(t)}</dt><dd>{T(d)}</dd></div>' for t, d in b[1]) + "</dl>"
    if k == "img":
        _, name, cap, size = b
        return f'<figure class="fig fig--{size} reveal">{img(name, cap)}<figcaption>{T(cap)}</figcaption></figure>'
    if k == "grid":
        _, items, cols = b
        figs = "".join(f'<figure class="fig reveal">{img(n, cap, sizes="50vw")}<figcaption>{T(cap)}</figcaption></figure>' for n, cap in items)
        return f'<div class="figs figs--{cols}">{figs}</div>'
    if k == "grid3":
        figs = "".join(f'<figure class="fig reveal">{img(n, cap, sizes="33vw")}<figcaption>{T(cap)}</figcaption></figure>' for n, cap in b[1])
        return f'<div class="figs figs--3">{figs}</div>'
    if k == "video":
        _, vsrc, poster, cap = b
        return (f'<figure class="fig fig--video"><video controls playsinline preload="none" poster="{src(poster)}" width="1080" height="1920">'
                f'<source src="{vsrc}" type="video/mp4"></video><figcaption>{T(cap)}</figcaption></figure>')
    if k == "videos":
        figs = "".join(f'<figure class="fig fig--video"><video controls playsinline preload="none" poster="{src(p)}" width="1080" height="1920">'
                       f'<source src="{v}" type="video/mp4"></video><figcaption>{T(cap)}</figcaption></figure>' for v, p, cap in b[1])
        return f'<div class="vids">{figs}</div>'
    raise ValueError(k)


def build_case(c):
    if c["slug"] in SHOW:
        k = SHOW.index(c["slug"])
        nxt = BY[SHOW[(k + 1) % len(SHOW)]]
        num = f"{k+1:02d}"
    else:
        nxt = BY[SHOW[0]]
        num = ""
    title = (f"{c['name'][0]} — кейс, Каджик Варданян", f"{c['name'][1]} — case study, Kadzhik Vardanyan")
    out = [head(title, c["summary"], f"/cases/{c['slug']}.html", image=src(c["cover"]), depth=1), header(1, "work")]
    facts = list(c["facts"]) + [(("Срок", "Timeline"), ("2026", "2026"))]
    facts_html = "".join(f'<div class="fact"><dt>{T(t)}</dt><dd>{T(d)}</dd></div>' for t, d in facts)
    links = "".join(f'<a class="btn" href="{u}">{T(l)}{ARROW_OUT}</a>' for l, u in c["links"])
    secs = []
    for j, (h, blocks) in enumerate(c["sections"]):
        sid = f"s{j+1}"
        secs.append(f'<section class="cs reveal" aria-labelledby="{sid}"><h2 class="cs__h" id="{sid}"><span class="mono cs__n">{j+1:02d}</span>{T(h)}</h2><div class="cs__body">'
                    + "".join(block(b) for b in blocks) + "</div></section>")
    out.append(f"""<main id="main" class="case-page" style="--c:{c['color']}">
<article>
  <div class="wrap">
    <a class="back" href="../index.html#work">{T(("Все работы", "All work"))}</a>
    <header class="ch">
      <p class="eyebrow">{('<span class="mono">' + num + '</span> · ') if num else ''}{T(c['kind'])}</p>
      <h1 class="ch__h">{T(c['name'])}</h1>
      <p class="ch__lead">{T(c['summary'])}</p>
      <p class="ov__label">{T(("О проекте", "Project overview"))}</p>
      <dl class="facts">{facts_html}</dl>
      {f'<div class="ch__links">{links}</div>' if links else ''}
    </header>
  </div>
  <div class="wrap wrap--wide"><figure class="cover">{img(c['cover'], c['name'], eager=True, vt='cover-'+c['slug'])}</figure></div>
  <div class="wrap">{''.join(secs)}</div>
</article>
<nav class="next wrap" aria-label="Next case" style="--c:{nxt['color']}">
  <a href="{nxt['slug']}.html" class="next__a">
    <span class="next__label">{T(("Следующий кейс", "Next case"))}</span>
    <span class="next__name">{T(nxt['name'])}</span>
    <span class="next__kind">{T(nxt['kind'])}</span>
  </a>
</nav>
</main>""")
    out.append(contact_block())
    out.append(footer(1))
    write(f"cases/{c['slug']}.html", "".join(out))


def localize(s):
    # serve media from /media on our own domain instead of the CDN
    s = s.replace(CDN, "/media/")
    s = re.sub(r'/media/([0-9a-f-]{36})\.png', r'/media/\1.webp', s)
    s = re.sub(r'(<meta property="og:image" content=")/media/', r'\1' + SITE + '/media/', s)
    s = re.sub(r'(<meta name="twitter:image" content=")/media/', r'\1' + SITE + '/media/', s)
    return s


def write(rel, s):
    s = localize(s)
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)
    print("wrote", rel, len(s))


def build_404():
    out = [head(("Страница не найдена", "Page not found"), HOME["description"], "/404.html"), header(0)]
    out.append(f"""<main id="main" class="nf"><div class="wrap">
<h1 class="ch__h">404</h1>
<p class="ch__lead">{T(("Такой страницы нет. Возможно, ссылка устарела.", "This page doesn't exist. The link may be out of date."))}</p>
<a class="btn btn--solid" href="/">{T(("На главную", "Go to the homepage"))}</a>
</div></main>""")
    out.append(footer(0))
    write("404.html", "".join(out).replace('href="index.html', 'href="/index.html').replace('src="assets', 'src="/assets').replace('href="assets', 'href="/assets').replace('href="favicon', 'href="/favicon'))


if __name__ == "__main__":
    build_home()
    for c in CASES:
        build_case(c)
    build_404()
    urls = [SITE + "/"] + [f"{SITE}/cases/{s}.html" for s in SHOW]
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n")
    write("robots.txt", f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
