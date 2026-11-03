"""Erzeugt alle Piktogramme aus src/ mit den Farben aus farben.json.

Aufruf (im Ordner dieses Pakets):  py -3 erzeugen.py      (macOS/Linux: python3 erzeugen.py)
Keine Zusatzpakete noetig, nur Python 3.

Die Quellzeichnungen in src/ liegen im alten 24er-Raster (Arbeitsflaeche 3-21). Beim Erzeugen werden sie
auf 4-20 skaliert, Ecken gerundet, Strichstaerke/Radius/Deckkraft aus farben.json gesetzt und
class="accent" zur Duoton-Flaeche. Elemente mit data-knock="1" werden in der Aktiv-Version aus der Flaeche ausgespart.
"""
import html, json, math, pathlib, re, shutil

HERE = pathlib.Path(__file__).parent
K = 16 / 18           # 3-21 -> 4-20
RADIUS = 1.0
STROKE = 1.25
ACCENT_OPACITY = 0.2

TOK = re.compile(r"[MmLlHhVvCcSsQqAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?")
ARGN = dict(M=2, L=2, H=1, V=1, C=6, S=4, Q=4, A=7, Z=0)


def sc(p): return (12 + (p[0] - 12) * K, 12 + (p[1] - 12) * K)
def num(v): return ("%.3f" % v).rstrip("0").rstrip(".")
def fmt(p): return num(p[0]) + " " + num(p[1])


def subpaths(d):
    """Parse d into [(segments, closed)] in output coordinates.
    segment: ('L', p0, p1) or ('X', text, p0, p1) for curves/arcs."""
    toks = TOK.findall(d)
    i, cmd = 0, None
    res, cur, start, segs = [], (0, 0), (0, 0), None   # cur/start in source coords
    while i < len(toks):
        if toks[i].isalpha():
            cmd = toks[i]; i += 1
        C, rel = cmd.upper(), cmd.islower()
        a = [float(t) for t in toks[i:i + ARGN[C]]]; i += ARGN[C]
        ox, oy = cur if rel else (0, 0)
        if C == "M":
            if segs: res.append((segs, False))
            cur = start = (a[0] + ox, a[1] + oy); segs = []
            cmd = "l" if rel else "L"
        elif C in "LHV":
            if C == "L": p = (a[0] + ox, a[1] + oy)
            elif C == "H": p = (a[0] + (cur[0] if rel else 0), cur[1])
            else: p = (cur[0], a[0] + (cur[1] if rel else 0))
            segs.append(("L", sc(cur), sc(p))); cur = p
        elif C == "Z":
            if math.dist(cur, start) > 1e-9: segs.append(("L", sc(cur), sc(start)))
            res.append((segs, True)); segs = []; cur = start
        elif C == "A":
            p = (a[5] + ox, a[6] + oy)
            txt = "A%s %s %s %d %d %s" % (num(a[0] * K), num(a[1] * K), num(a[2]), a[3], a[4], fmt(sc(p)))
            segs.append(("X", txt, sc(cur), sc(p))); cur = p
        else:
            pts = [(a[k] + ox, a[k + 1] + oy) for k in range(0, len(a), 2)]
            segs.append(("X", C + " ".join(fmt(sc(q)) for q in pts), sc(cur), sc(pts[-1]))); cur = pts[-1]
    if segs: res.append((segs, False))
    return res


def towards(a, b, d):
    t = d / math.dist(a, b)
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def rounded(segs, closed, R):
    n = len(segs)
    lens = [math.dist(s[1], s[2]) if s[0] == "L" else 0 for s in segs]

    def corner(i, j):
        a, b = segs[i], segs[j]
        if a[0] != "L" or b[0] != "L" or not lens[i] or not lens[j]: return 0
        v1 = (a[2][0] - a[1][0], a[2][1] - a[1][1]); v2 = (b[2][0] - b[1][0], b[2][1] - b[1][1])
        if abs(v1[0] * v2[1] - v1[1] * v2[0]) / (lens[i] * lens[j]) < 0.05: return 0
        return min(R, lens[i] * 0.45, lens[j] * 0.45)

    cut_in, cut_out = [0] * n, [0] * n
    pairs = [(k, k + 1) for k in range(n - 1)] + ([(n - 1, 0)] if closed and n > 1 else [])
    for i, j in pairs:
        r = corner(i, j); cut_out[i] = r; cut_in[j] = r

    def seg_start(k):
        s = segs[k]
        if s[0] == "X": return s[2]
        return towards(s[1], s[2], cut_in[k]) if cut_in[k] else s[1]

    d = "M" + fmt(seg_start(0))
    for k, s in enumerate(segs):
        if s[0] == "X":
            d += s[1]; continue
        d += "L" + fmt(towards(s[2], s[1], cut_out[k]) if cut_out[k] else s[2])
        if cut_out[k]:
            d += "Q" + fmt(s[2]) + " " + fmt(seg_start((k + 1) % n))
    return d + ("Z" if closed else "")


ATTR = re.compile(r'([\w:-]+)="([^"]*)"')
ELEM = re.compile(r"<(path|rect|circle)\b([^>]*?)/>")


def convert(tag, attrs):
    a = dict(ATTR.findall(attrs))
    R = float(a.pop("data-r", RADIUS))
    accent = a.get("class") == "accent"
    if tag == "path":
        a["d"] = "".join(rounded(s, c, R) for s, c in subpaths(a["d"]) if s)
    elif tag == "rect":
        x, y = sc((float(a["x"]), float(a["y"])))
        a.update(x=num(x), y=num(y), width=num(float(a["width"]) * K), height=num(float(a["height"]) * K))
        a["rx"] = num(R)
    else:
        cx, cy = sc((float(a["cx"]), float(a["cy"])))
        a.update(cx=num(cx), cy=num(cy), r=num(float(a["r"]) * K))
    if accent:
        a.update(fill="currentColor", stroke="none")
        a["fill-opacity"] = str(ACCENT_OPACITY)
    elif a.get("fill") == "#000":
        a["fill"] = "currentColor"
    order = ["class", "d", "x", "y", "width", "height", "rx", "cx", "cy", "r"]
    keys = [k for k in order if k in a] + [k for k in a if k not in order]
    return "<%s %s/>" % (tag, " ".join('%s="%s"' % (k, a[k]) for k in keys))


def build(src, active=False):
    """active=False: line + duotone. active=True: accent filled solid, data-knock lines cut out of it."""
    text = src.read_text(encoding="utf-8")
    title = re.search(r"<title>(.*?)</title>", text).group(1)
    accent, lines, knock = [], [], []
    for t, at in ELEM.findall(text):
        is_knock = 'data-knock="1"' in at
        e = convert(t, at.replace('data-knock="1"', ""))
        if 'class="accent"' in e: accent.append(e)
        elif is_knock and active: knock.append(e)
        else: lines.append(e)
    if active and accent:
        accent = [e.replace(' fill-opacity="%s"' % ACCENT_OPACITY, "") for e in accent]
        if knock:
            mid = "k-%s-%s" % (src.parent.name, src.stem)
            cut = [re.sub(r'fill="currentColor"', 'fill="#000"', e.replace("/>", ' stroke="#000"/>', 1)) for e in knock]
            accent = ['<mask id="%s" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">'
                      '<rect width="24" height="24" fill="#fff"/>%s</mask>' % (mid, "".join(cut)),
                      '<g mask="url(#%s)">%s</g>' % (mid, "".join(accent))]
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" '
            'stroke="currentColor" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round">\n'
            "<title>%s</title>\n%s\n</svg>\n" % (STROKE, title + (" (aktiv)" if active else ""),
                                                  "\n".join(accent + lines))), title




# ---------------------------------------------------------------------------
# Paket erzeugen
# ---------------------------------------------------------------------------
GROUPS = [("navigator", ["grundriss", "schnitt", "ansicht", "gesamtuebersicht", "auswertung"]),
          ("werkzeuge", ["auswahl", "wand", "decke", "fenster", "tuer", "deckendurchbruch", "treppe", "dach",
                         "dachflaechenfenster", "gelaender", "gelaende", "linie", "polygon", "rechteck", "kreis",
                         "schraffur", "text", "schnitt", "ansicht", "bemassung", "stuetze",
                         "technische-zeichnung", "raum"])]
LABELS = {"decke": "Decke", "treppe": "Treppe", "linie": "Linie", "ansicht": "Ansicht",
          "bemassung": "Bemaßung", "stuetze": "Stütze", "schnitt": "Schnitt"}
HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")


def load_colors():
    cfg = json.loads((HERE / "farben.json").read_text(encoding="utf-8"))
    for theme in ("hell", "dunkel"):
        for key in ("linie", "aktiv"):
            v = cfg[theme][key]
            if not HEX.match(v):
                raise SystemExit('farben.json: "%s.%s" = "%s" ist kein Farbwert im Format #RRGGBB' % (theme, key, v))
    return cfg


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def main():
    global STROKE, RADIUS, ACCENT_OPACITY
    cfg = load_colors()
    STROKE = cfg.get("strichstaerke", STROKE)
    RADIUS = cfg.get("eckenradius", RADIUS)
    ACCENT_OPACITY = cfg.get("duoton_deckkraft", ACCENT_OPACITY)

    out = HERE / "svg"
    if out.exists():
        shutil.rmtree(out)
    rows = []
    for group, names in GROUPS:
        for name in names:
            src = HERE / "src" / group / (name + ".svg")
            off, title = build(src)
            on, _ = build(src, active=True)
            on = on.replace('class="accent"', 'class="accent-voll"')
            # Variante 1: currentColor - die Farbe kommt aus der Anwendung (CSS color / Theme)
            write(out / "currentColor" / "inaktiv" / group / (name + ".svg"), off)
            write(out / "currentColor" / "aktiv" / group / (name + ".svg"), on)
            # Variante 2: feste Farben aus farben.json
            for theme in ("hell", "dunkel"):
                write(out / theme / "inaktiv" / group / (name + ".svg"), off.replace("currentColor", cfg[theme]["linie"]))
                write(out / theme / "aktiv" / group / (name + ".svg"), on.replace("currentColor", cfg[theme]["aktiv"]))
            label = re.sub(r"\s*-?werkzeug$", "", title, flags=re.I)
            rows.append((group, name, LABELS.get(name, label) if group == "werkzeuge" else label))

    write(HERE / "css" / "piktogramme.css", CSS % dict(
        hl=cfg["hell"]["linie"], ha=cfg["hell"]["aktiv"], dl=cfg["dunkel"]["linie"], da=cfg["dunkel"]["aktiv"],
        op=ACCENT_OPACITY))
    write(HERE / "vorschau.html", preview(rows, cfg))
    print("%d Piktogramme erzeugt (je inaktiv/aktiv, currentColor + hell + dunkel)" % len(rows))
    print("hell:   Linie %s, aktiv %s" % (cfg["hell"]["linie"], cfg["hell"]["aktiv"]))
    print("dunkel: Linie %s, aktiv %s" % (cfg["dunkel"]["linie"], cfg["dunkel"]["aktiv"]))


CSS = """/* Piktogramme - Farben. Erzeugt aus farben.json, nicht von Hand bearbeiten. */
:root {
  --pikto-linie: %(hl)s;
  --pikto-aktiv: %(ha)s;
  --pikto-duoton: %(op)s;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --pikto-linie: %(dl)s; --pikto-aktiv: %(da)s; }
}
:root[data-theme="dark"] { --pikto-linie: %(dl)s; --pikto-aktiv: %(da)s; }

/* Gilt fuer inline eingebettete SVGs aus svg/currentColor */
.pikto { width: 24px; height: 24px; color: var(--pikto-linie); }
.pikto .accent { fill-opacity: var(--pikto-duoton); }
.pikto.aktiv, .is-active > .pikto, [aria-selected="true"] > .pikto { color: var(--pikto-aktiv); }
"""


def preview(rows, cfg):
    def grid(theme, state):
        return "".join('<div class="c"><img src="svg/%s/%s/%s/%s.svg"><span>%s</span></div>'
                       % (theme, state, g, n, html.escape(t)) for g, n, t in rows)
    return """<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Piktogramme Vorschau</title><style>
body{margin:0;font-family:Segoe UI,Arial,sans-serif;background:#fff;color:#111}
h1{font-size:18px;margin:24px 32px 4px}h2{font-size:14px;margin:18px 32px 6px;color:#555}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;padding:6px 32px 16px}
.c{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 4px;border-radius:8px;background:#f6f7f9;font-size:12px}
.c img{width:40px;height:40px}.dark{background:#1f2328;color:#e6e8eb;padding:4px 0 16px}.dark .c{background:#2a2f36}.dark h2{color:#aab}
code{background:#eef;padding:1px 5px;border-radius:4px}.dark code{background:#333a44}
</style></head><body>
<h1>Piktogramme – Vorschau der Dateien</h1>
<h2>Hell · inaktiv (Linie <code>%s</code>)</h2><div class="grid">%s</div>
<h2>Hell · aktiv (<code>%s</code>)</h2><div class="grid">%s</div>
<div class="dark"><h2>Dunkel · inaktiv (Linie <code>%s</code>)</h2><div class="grid">%s</div>
<h2>Dunkel · aktiv (<code>%s</code>)</h2><div class="grid">%s</div></div>
</body></html>""" % (cfg["hell"]["linie"], grid("hell", "inaktiv"), cfg["hell"]["aktiv"], grid("hell", "aktiv"),
                     cfg["dunkel"]["linie"], grid("dunkel", "inaktiv"), cfg["dunkel"]["aktiv"], grid("dunkel", "aktiv"))


if __name__ == "__main__":
    main()
