# -*- coding: utf-8 -*-
"""Static site generator for the portfolio. Run: python3 _build/build.py"""
import html, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from content import CDN, IMG, CONTACT, HOME, CAPABILITIES, HOW, CASES

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SITE = "https://vkadzhik.ru"
NAME = ("Каджик Варданян", "Kadzhik Vardanyan")
e = html.escape


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


def head(title, desc, path, image=None, depth=0):
    pre = "../" * depth
    og = image or (CDN + "debfb55d-a26d-4d68-a0da-c565573b01d1.png")
    return f"""<!doctype html>
<html lang="ru" data-lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>(function(){{var l;try{{var q=new URLSearchParams(location.search).get('lang');if(q==='ru'||q==='en'){{l=q;localStorage.setItem('lang',q)}}else{{l=localStorage.getItem('lang')}}}}catch(x){{}}if(!l){{l=((navigator.language||'ru').toLowerCase().indexOf('ru')===0)?'ru':'en'}}document.documentElement.setAttribute('data-lang',l);document.documentElement.lang=l;}})();</script>
<title>{e(title[0])}</title>
<meta name="description" content="{e(desc[0])}">
<meta name="author" content="Kadzhik Vardanyan">
<meta name="theme-color" content="#0E1117">
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
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{pre}assets/site.css">
<meta name="x-title-ru" content="{e(title[0])}"><meta name="x-title-en" content="{e(title[1])}">
</head>
<body>
<script>document.documentElement.classList.add("js")</script>
<a class="skip" href="#main">{T(("Перейти к содержанию", "Skip to content"))}</a>
"""


def header(depth=0, current=""):
    pre = "../" * depth
    home = pre + "index.html"
    def nav(href, pair, key):
        cur = ' aria-current="page"' if key == current else ""
        return f'<a href="{href}"{cur}>{T(pair)}</a>'
    return f"""<header class="top">
  <div class="wrap top__in">
    <a class="brand" href="{home}">{T(NAME)}</a>
    <nav class="top__nav" aria-label="Main">
      {nav(home + '#work', ('Работы', 'Work'), 'work')}
      {nav(home + '#about', ('Подход', 'Approach'), 'about')}
      {nav(home + '#contact', ('Контакты', 'Contact'), 'contact')}
    </nav>
    <div class="lang" role="group" aria-label="Language">
      <button type="button" data-set-lang="ru">RU</button><button type="button" data-set-lang="en">EN</button>
    </div>
  </div>
</header>
"""


def footer(depth=0):
    pre = "../" * depth
    return f"""<footer class="foot">
  <div class="wrap foot__in">
    <p>{T(("Каджик Варданян, 2026. В файлах Figma открыты отдельные фрагменты, полные версии покажу по запросу.", "Kadzhik Vardanyan, 2026. The Figma files show selected parts; full versions are available on request."))}</p>
    <p class="foot__links"><a href="{CONTACT['telegram']}">Telegram</a><a href="mailto:{CONTACT['email']}">{CONTACT['email']}</a><a href="{CONTACT['github']}">GitHub</a></p>
  </div>
</footer>
<div class="pill" aria-hidden="true">{T(("Открыть кейс", "Open the case"))}</div>
<dialog class="zoom" aria-label="Image">
  <button type="button" class="zoom__close" data-close>{T(("Закрыть", "Close"))}</button>
  <img alt="">
</dialog>
<script src="{pre}assets/site.js" defer></script>
</body>
</html>
"""


def contact_block():
    return f"""<section class="contact" id="contact" aria-labelledby="contact-h">
  <div class="wrap">
    <h2 id="contact-h" class="contact__h">{T(("Давайте поговорим о вашем продукте", "Let's talk about your product"))}</h2>
    <p class="contact__lead">{T(("Быстрее всего ответ приходит в Telegram. Готов сделать тестовое задание.", "Telegram is the fastest way to reach me. Happy to do a test task."))}</p>
    <div class="contact__ways">
      <a class="btn btn--solid" href="{CONTACT['telegram']}">{T(("Написать в Telegram", "Message on Telegram"))}</a>
      <a class="btn" href="mailto:{CONTACT['email']}">{CONTACT['email']}</a>
    </div>
  </div>
</section>
"""


# ---------------------------------------------------------------- home
def build_home():
    out = [head(HOME["title"], HOME["description"], "/"), header(0)]
    out.append('<main id="main">')
    strip = ["orbit-lobby", "arena-dashboard", "nyxa-overview", "vesta-flow", "promo-story-welcome"]
    strip_alt = {
        "orbit-lobby": ("Лобби казино ORBIT", "ORBIT casino lobby"),
        "arena-dashboard": ("Дашборд Арены", "Arena dashboard"),
        "nyxa-overview": ("Обзор в Nyxa", "Nyxa overview"),
        "vesta-flow": ("Перевод в Vesta", "Vesta send money"),
        "promo-story-welcome": ("Сторис ORBIT Promo", "ORBIT Promo story"),
    }
    tiles = "".join(f'<div class="wall__tile wall__tile--{n}">{img(n, strip_alt[n], eager=(i < 2), sizes="40vw", zoom=False)}</div>'
                    for i, n in enumerate(strip))
    out.append(f"""
<section class="hero">
  <div class="wrap">
    <h1 class="hero__h">{T(HOME['hero'])}</h1>
    <p class="hero__lead">{T(HOME['lead'])}</p>
    <div class="hero__cta">
      <a class="btn btn--solid" href="#work">{T(("Смотреть работы", "See the work"))}</a>
      <a class="btn" href="{CONTACT['telegram']}">{T(("Написать в Telegram", "Message on Telegram"))}</a>
    </div>
  </div>
  <div class="wall" aria-hidden="true"><div class="wall__track">{tiles}</div></div>
</section>
""")
    rows = []
    for i, c in enumerate(CASES):
        href = f"cases/{c['slug']}.html"
        rows.append(f"""
    <li class="case reveal" style="--c:{c['color']}">
      <a class="case__img{' case__img--contain' if c.get('fit')=='contain' else ''}" href="{href}" tabindex="-1" aria-hidden="true">{img(c['cover'], c['name'], sizes='(min-width: 900px) 60vw, 100vw', zoom=False, vt='cover-'+c['slug'])}</a>
      <div class="case__txt">
        <p class="case__kind"><span class="swatch" aria-hidden="true"></span>{T(c['kind'])}</p>
        <h3 class="case__name"><a href="{href}">{T(c['name'])}</a></h3>
        <p class="case__sum">{T(c['summary'])}</p>
        <a class="case__more" href="{href}">{T(("Открыть кейс", "Open the case"))}</a>
      </div>
    </li>""")
    out.append(f"""
<section class="work" id="work" aria-labelledby="work-h">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="work-h" class="sec-h">{T(("Работы", "Work"))}</h2>
      <p class="sec-sub">{T(("Восемь кейсов: от B2B-кабинета с таблицами до виджета на живых данных и рекламных кампаний. В каждом — задача, решения и экраны.", "Eight cases, from a B2B app with complex tables to a widget on live data and ad campaigns. Each shows the problem, the decisions and the screens."))}</p>
    </div>
    <ol class="cases">{''.join(rows)}
    </ol>
  </div>
</section>
""")
    caps = "".join(f'<li class="cap reveal"><h3 class="cap__h">{T(h)}</h3><p>{T(p)}</p></li>' for h, p in CAPABILITIES)
    how = "".join(f'<li>{T(p)}</li>' for p in HOW)
    out.append(f"""
<section class="about" id="about" aria-labelledby="about-h">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="about-h" class="sec-h">{T(("Что я делаю", "What I do"))}</h2>
    </div>
    <ul class="caps">{caps}</ul>
    <div class="how">
      <h2 class="sec-h sec-h--sm">{T(("Как я работаю", "How I work"))}</h2>
      <ul class="how__list">{how}</ul>
      <p class="how__tools">{T(("Инструменты: Figma (переменные, компоненты, прототипы), FigJam, Higgsfield AI, Notion, базовые HTML и CSS.", "Tools: Figma (variables, components, prototyping), FigJam, Higgsfield AI, Notion, basic HTML and CSS."))}</p>
    </div>
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
    if k == "video":
        _, vsrc, poster, cap = b
        return (f'<figure class="fig fig--video"><video controls playsinline preload="none" poster="{src(poster)}" width="1080" height="1920">'
                f'<source src="{vsrc}" type="video/mp4"></video><figcaption>{T(cap)}</figcaption></figure>')
    if k == "videos":
        figs = "".join(f'<figure class="fig fig--video"><video controls playsinline preload="none" poster="{src(p)}" width="1080" height="1920">'
                       f'<source src="{v}" type="video/mp4"></video><figcaption>{T(cap)}</figcaption></figure>' for v, p, cap in b[1])
        return f'<div class="vids">{figs}</div>'
    raise ValueError(k)


def build_case(i, c):
    nxt = CASES[(i + 1) % len(CASES)]
    title = (f"{c['name'][0]} — кейс, Каджик Варданян", f"{c['name'][1]} — case study, Kadzhik Vardanyan")
    out = [head(title, c["summary"], f"/cases/{c['slug']}.html", image=src(c["cover"]), depth=1), header(1, "work")]
    facts = "".join(f'<div><dt>{T(t)}</dt><dd>{T(d)}</dd></div>' for t, d in c["facts"])
    links = "".join(f'<a class="btn" href="{u}">{T(l)}{ARROW_OUT}</a>' for l, u in c["links"])
    secs = []
    for j, (h, blocks) in enumerate(c["sections"]):
        sid = f"s{j+1}"
        secs.append(f'<section class="cs reveal" aria-labelledby="{sid}"><h2 class="cs__h" id="{sid}">{T(h)}</h2><div class="cs__body">'
                    + "".join(block(b) for b in blocks) + "</div></section>")
    out.append(f"""<main id="main" class="case-page" style="--c:{c['color']}">
<article>
  <div class="wrap">
    <a class="back" href="../index.html#work">{T(("Все работы", "All work"))}</a>
    <header class="ch">
      <p class="case__kind"><span class="swatch" aria-hidden="true"></span>{T(c['kind'])}</p>
      <h1 class="ch__h">{T(c['name'])}</h1>
      <p class="ch__lead">{T(c['summary'])}</p>
      <dl class="facts">{facts}</dl>
      {f'<div class="ch__links">{links}</div>' if links else ''}
      {'<p class="ch__note">' + T(("В Figma открыты отдельные фрагменты проекта. Полную версию покажу по запросу.", "The Figma file shows selected parts of the project. The full version is available on request.")) + '</p>' if any('figma.com' in u for _, u in c['links']) else ''}
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
    for i, c in enumerate(CASES):
        build_case(i, c)
    build_404()
    # sitemap
    urls = [SITE + "/"] + [f"{SITE}/cases/{c['slug']}.html" for c in CASES]
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n")
    write("robots.txt", f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
