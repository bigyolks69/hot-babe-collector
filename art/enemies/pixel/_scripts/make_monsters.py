
"""Hot Babe Collector — Mini Oni (walker) + Mochi Slime (hopper) full frames.
Exact look/palette/size from options W3 + H1.
32x32, face RIGHT, feet on bottom row. Outline #1a1424.
Run: python3 make_monsters.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
ENEMIES = os.path.dirname(OUT)
ART = os.path.dirname(ENEMIES)
HERO_PX = os.path.join(ART, "hero", "pixel")
FONT = "/usr/share/fonts/truetype/sand-box/google/Press Start 2P/PressStart2P-Regular.ttf"

def hx(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4)) + (255,)

# Same palette keys as make_monster_options.py (W3/H1 subset)
PAL = {
    "K": hx("1a1424"),
    "W": hx("ffffff"),
    "B": hx("ff8aa0"),
    "m": hx("c0506a"),
    "O": hx("ff6a70"),
    "o": hx("d03848"),
    "H": hx("ffe080"),
    "h": hx("e0b040"),
    "M": hx("70ffc0"),
    "g": hx("38c890"),
    "G": hx("c8ffe8"),
}
SKY = (120, 190, 240, 255)
NIGHT = (42, 30, 74, 255)
BG = (34, 32, 52, 255)

def row(s):
    return (s.replace(" ", ".") + "." * 32)[:32]

def new():
    return Image.new("RGBA", (32, 32))

def put(im, x, y, k):
    if 0 <= x < 32 and 0 <= y < 32 and k in PAL:
        im.putpixel((x, y), PAL[k])

def ascii_to(im, rows, dy=0, dx=0):
    for y, r in enumerate(rows):
        r = row(r)
        for x, ch in enumerate(r):
            if ch not in ". ":
                put(im, x + dx, y + dy, ch)

def outline(im):
    s = im.load()
    o = im.copy()
    q = o.load()
    for y in range(32):
        for x in range(32):
            if s[x, y][3]:
                continue
            for ddx, ddy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + ddx, y + ddy
                if 0 <= nx < 32 and 0 <= ny < 32 and s[nx, ny][3]:
                    q[x, y] = PAL["K"]
                    break
    return o

def eyes(im, lx, rx, ey, h=3, w=3, blink=False):
    if blink:
        for eye_x in (lx, rx):
            for x in range(eye_x, eye_x + w):
                put(im, x, ey + 1, "K")
        return
    for eye_x in (lx, rx):
        for y in range(ey, ey + h):
            for x in range(eye_x, eye_x + w):
                put(im, x, y, "W")
        put(im, eye_x + w - 1, ey + h - 1, "K")
        put(im, eye_x + w - 2, ey + h - 1, "K")
        put(im, eye_x + w - 1, ey + h - 2, "K")
        put(im, eye_x, ey, "W")
        if w >= 3:
            put(im, eye_x + 1, ey, "W")
            put(im, eye_x, ey + 1, "W")

def eyes_x(im, lx, rx, ey):
    """Dizzy X eyes for squished."""
    for eye_x in (lx, rx):
        put(im, eye_x, ey, "K")
        put(im, eye_x + 2, ey, "K")
        put(im, eye_x + 1, ey + 1, "K")
        put(im, eye_x, ey + 2, "K")
        put(im, eye_x + 2, ey + 2, "K")

def blush(im, lx, rx, by):
    for x in range(lx, lx + 2):
        put(im, x, by, "B")
    for x in range(rx, rx + 2):
        put(im, x, by, "B")

def mouth_fang(im, cx, my):
    put(im, cx - 1, my, "m")
    put(im, cx, my, "m")
    put(im, cx + 1, my, "W")
    put(im, cx + 1, my + 1, "W")

def mouth_smile(im, cx, my):
    put(im, cx - 1, my, "m")
    put(im, cx, my + 1, "m")
    put(im, cx + 1, my, "m")

def mouth_o(im, cx, my):
    put(im, cx, my, "m")
    put(im, cx - 1, my, "m")

def finish(im):
    return outline(im)

def bottom_align(im):
    px = im.load()
    ys = [y for y in range(32) for x in range(32) if px[x, y][3]]
    if not ys:
        return im
    shift = 31 - max(ys)
    if shift <= 0:
        return im
    out = new()
    out.alpha_composite(im, (0, shift))
    return out

def clear_rect(im, x0, y0, x1, y1):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < 32 and 0 <= y < 32:
                im.putpixel((x, y), (0, 0, 0, 0))

# =============================================================================
# MINI ONI — exact W3 body
# =============================================================================
ONI_BODY = [
    "..........H........H............",
    ".........HhH......HhH...........",
    "..........H........H............",
    ".........OOOOOOOOOO.............",
    ".......OOOoOOOOOOOOOO...........",
    "......OOOOOOOOOOOOOOOO..........",
    ".....OOOoOOOOOOOOOOOOOO.........",
    "....OOOOOOOOOOOOOOOOOOOO........",
    "...OOOOOOOOOOOOOOOOOOOOOO.......",
    "...OOOOOOOOOOOOOOOOOOOOOO.......",
    "..OOOOOOOOOOOOOOOOOOOOOOOO......",
    "..OOOOOOOOOOOOOOOOOOOOOOOO......",
    ".OOOOOOOOOOOOOOOOOOOOOOOOOO.....",
    ".OOOOOOOOOOOOOOOOOOOOOOOOOO.....",
    ".OOOOOOOOOOOOOOOOOOOOOOOOOO.....",
    "..OOOOOOOOOOOOOOOOOOOOOOOO......",
    "..OOOOOOOOOOOOOOOOOOOOOOOO......",
    "...OOOOOOOOOOOOOOOOOOOOOO.......",
    "....OOOOOOOOOOOOOOOOOOOO........",
    ".....OOO.OO........OO.OOO.......",
    "......OOOO..........OOOO........",
    ".......OO............OO.........",
    ".......OO............OO.........",
    ".......oo............oo.........",
    ".......oo............oo.........",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
]
ONI_DY = 7  # as in options

def paint_oni_face(im, bob=0, blink=False):
    ey = 10 - bob + ONI_DY
    eyes(im, 10, 18, ey, h=3, w=3, blink=blink)
    blush(im, 8, 22, ey + 3)
    if not blink:
        mouth_fang(im, 15, ey + 5)

def paint_oni_feet(im, lx, rx, lift_l=0, lift_r=0):
    """Stubby feet. lx/rx = left/right foot x. lift = raise foot off ground."""
    # clear default foot area first
    clear_rect(im, 0, 26, 31, 31)
    for foot_x, lift in ((lx, lift_l), (rx, lift_r)):
        top = 28 - lift
        for dx in range(4):
            put(im, foot_x + dx, top, "O")
            put(im, foot_x + dx, top + 1, "O")
            put(im, foot_x + dx, top + 2, "o")
            if lift == 0:
                put(im, foot_x + dx, 31, "o")
            else:
                put(im, foot_x + dx, top + 3, "o")
        # ankle connect
        put(im, foot_x + 1, top - 1, "O")
        put(im, foot_x + 2, top - 1, "O")

def make_oni(bob=0, blink=False, lean=0, lx=7, rx=21, lift_l=0, lift_r=0, custom_feet=False):
    im = new()
    ascii_to(im, ONI_BODY, dy=ONI_DY - bob, dx=lean)
    if custom_feet:
        paint_oni_feet(im, lx + lean, rx + lean, lift_l, lift_r)
    paint_oni_face(im, bob=bob, blink=blink)
    # if bob lifted feet via dy, re-stamp grounded feet (unless custom)
    if bob and not custom_feet:
        paint_oni_feet(im, 7 + lean, 21 + lean, 0, 0)
    return bottom_align(finish(im))

def make_oni_squished():
    """~11px tall pancake, horns visible, X eyes, bottom-aligned."""
    body = [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..........H........H............",  # 20 horns
        ".........HhH......HhH...........",
        "......OOOOOOOOOOOOOOOO..........",  # smashed body
        "....OOOoOOOOOOOOOOOOOOOO........",
        "...OOOOOOOOOOOOOOOOOOOOOO.......",
        "..OOOOOOOOOOOOOOOOOOOOOOOO......",
        "..OOOOOOOOOOOOOOOOOOOOOOOO......",
        ".OOOOOOOOOOOOOOOOOOOOOOOOOO.....",
        ".OOOO.OOOO........OOOO.OOOO.....",  # flat feet
        ".OOOOOOOO..........OOOOOOOO.....",
        ".oooooooo..........oooooooo.....",
        ".oooooooo..........oooooooo.....",
    ]
    im = new()
    ascii_to(im, body)
    eyes_x(im, 10, 18, 24)
    blush(im, 8, 22, 26)
    put(im, 14, 26, "m")
    put(im, 15, 26, "m")
    put(im, 16, 26, "W")  # fang still there
    return bottom_align(finish(im))

# =============================================================================
# MOCHI SLIME — exact H1 look
# =============================================================================
def slime_idle_body(wobble=0):
    """wobble 0 = round, 1 = slightly wider/shorter."""
    if wobble == 0:
        return [
            "................................",
            ".........GGGGGGGG...............",
            ".......GMMMMMMMMMMG.............",
            "......GMMMgMMMMMMMMG............",
            ".....GMMMMMMMMMMMMMMG...........",
            "....GMMMMMMMMMMMMMMMMG..........",
            "...GMMMgMMMMMMMMMMMMMMG.........",
            "...GMMMMMMMMMMMMMMMMMMG.........",
            "..GMMMMMMMMMMMMMMMMMMMMG........",
            "..GMMMMMMMMMMMMMMMMMMMMG........",
            "..GMMMgMMMMMMMMMMMMMMMMG........",
            "..GMMMMMMMMMMMMMMMMMMMMG........",
            "..GMMMMMMMMMMMMMMMMMMMMG........",
            "...GMMMMMMMMMMMMMMMMMMG.........",
            "...GMMMMMMMMMMMMMMMMMMG.........",
            "....GMMMMMMMMMMMMMMMMG..........",
            ".....GMMMMMMMMMMMMMMG...........",
            "......GMMMMMMMMMMMMG............",
            ".......GGMMMMMMMMGG.............",
            ".........GGGGGGGG...............",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
        ], 8, 6
    else:
        # slightly wider flatter wobble
        return [
            "................................",
            "................................",
            "........GGGGGGGGGG..............",
            "......GMMMMMMMMMMMMG............",
            ".....GMMMgMMMMMMMMMMG...........",
            "....GMMMMMMMMMMMMMMMMG..........",
            "...GMMMMMMMMMMMMMMMMMMG.........",
            "..GMMMgMMMMMMMMMMMMMMMMG........",
            "..GMMMMMMMMMMMMMMMMMMMMG........",
            ".GMMMMMMMMMMMMMMMMMMMMMMG.......",
            ".GMMMMMMMMMMMMMMMMMMMMMMG.......",
            ".GMMMgMMMMMMMMMMMMMMMMMMG.......",
            ".GMMMMMMMMMMMMMMMMMMMMMMG.......",
            "..GMMMMMMMMMMMMMMMMMMMMG........",
            "..GMMMMMMMMMMMMMMMMMMMMG........",
            "...GMMMMMMMMMMMMMMMMMMG.........",
            "....GMMMMMMMMMMMMMMMMG..........",
            ".....GGMMMMMMMMMMMMGG...........",
            ".......GGGGGGGGGGGG.............",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
        ], 9, 6

def make_slime(mode="idle", wobble=0):
    if mode == "idle":
        body, dy, ey = slime_idle_body(wobble)
        im = new()
        ascii_to(im, body, dy=dy)
        eyes(im, 10, 18, ey + dy, h=3, w=3)
        blush(im, 8, 22, ey + dy + 3)
        mouth_smile(im, 15, ey + dy + 5)
        put(im, 11, 3 + dy, "G")
        put(im, 12, 3 + dy, "G")
        put(im, 11, 4 + dy, "G")
        return bottom_align(finish(im))

    if mode == "squash":
        body = [
            "......GGGGGGGGGGGGGG............",
            "....GMMMMMMMMMMMMMMMMG..........",
            "...GMMMgMMMMMMMMMMMMMMG.........",
            "..GMMMMMMMMMMMMMMMMMMMMG........",
            ".GMMMMMMMMMMMMMMMMMMMMMMG.......",
            ".GMMMgMMMMMMMMMMMMMMMMMMG.......",
            ".GMMMMMMMMMMMMMMMMMMMMMMG.......",
            ".GMMMMMMMMMMMMMMMMMMMMMMG.......",
            "..GMMMMMMMMMMMMMMMMMMMMG........",
            "...GMMMMMMMMMMMMMMMMMMG.........",
            "....GGGGGGGGGGGGGGGGGG..........",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
        ]
        dy = 20  # will bottom_align
        ey = 3
        im = new()
        ascii_to(im, body, dy=dy)
        eyes(im, 10, 19, ey + dy, h=3, w=3)
        blush(im, 8, 23, ey + dy + 3)
        mouth_o(im, 16, ey + dy + 5)  # braced "oof"
        put(im, 12, dy + 1, "G")
        put(im, 13, dy + 1, "G")
        return bottom_align(finish(im))

    if mode == "rise":
        body = [
            "...........GG...............",
            ".........GMMMMG.............",
            "........GMMMgMMMG...........",
            ".......GMMMMMMMMMG..........",
            "......GMMMgMMMMMMMG.........",
            ".....GMMMMMMMMMMMMMG........",
            ".....GMMMMMMMMMMMMMG........",
            "....GMMMgMMMMMMMMMMMG.......",
            "....GMMMMMMMMMMMMMMMG.......",
            "....GMMMMMMMMMMMMMMMG.......",
            "...GMMMMMMMMMMMMMMMMMG......",
            "...GMMMgMMMMMMMMMMMMMG......",
            "...GMMMMMMMMMMMMMMMMMG......",
            "...GMMMMMMMMMMMMMMMMMG......",
            "...GMMMMMMMMMMMMMMMMMG......",
            "...GMMMMMMMMMMMMMMMMMG......",
            "....GMMMMMMMMMMMMMMMG.......",
            "....GMMMgMMMMMMMMMMMG.......",
            "....GMMMMMMMMMMMMMMMG.......",
            ".....GMMMMMMMMMMMMMG........",
            ".....GMMMMMMMMMMMMMG........",
            "......GMMMMMMMMMMMG.........",
            ".......GMMMMMMMMMG..........",
            "........GMMMMMMMG...........",
            ".........GGMMMMG............",
            "...........GGGG.............",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
        ]
        dy = 6
        ey = 10
        im = new()
        ascii_to(im, body, dy=dy)
        eyes(im, 11, 18, ey + dy, h=3, w=3)
        blush(im, 9, 22, ey + dy + 3)
        mouth_smile(im, 16, ey + dy + 5)
        put(im, 13, dy + 2, "G")
        put(im, 14, dy + 2, "G")
        return bottom_align(finish(im))

    if mode == "fall":
        # slightly tall, happy face (coming down)
        body = [
            "................................",
            "..........GGGGGG................",
            "........GMMMMMMMMG..............",
            ".......GMMMgMMMMMMG.............",
            "......GMMMMMMMMMMMMG............",
            ".....GMMMMMMMMMMMMMMG...........",
            "....GMMMgMMMMMMMMMMMMG..........",
            "....GMMMMMMMMMMMMMMMMG..........",
            "...GMMMMMMMMMMMMMMMMMMG.........",
            "...GMMMMMMMMMMMMMMMMMMG.........",
            "...GMMMgMMMMMMMMMMMMMMG.........",
            "...GMMMMMMMMMMMMMMMMMMG.........",
            "...GMMMMMMMMMMMMMMMMMMG.........",
            "...GMMMMMMMMMMMMMMMMMMG.........",
            "....GMMMMMMMMMMMMMMMMG..........",
            "....GMMMMMMMMMMMMMMMMG..........",
            ".....GMMMMMMMMMMMMMMG...........",
            "......GMMMMMMMMMMMMG............",
            ".......GMMMMMMMMMMG.............",
            "........GGMMMMMMGG..............",
            "..........GGGGGG................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
        ]
        dy = 10
        ey = 7
        im = new()
        ascii_to(im, body, dy=dy)
        eyes(im, 11, 18, ey + dy, h=3, w=3)
        blush(im, 9, 22, ey + dy + 3)
        mouth_smile(im, 16, ey + dy + 5)
        put(im, 12, dy + 3, "G")
        put(im, 13, dy + 3, "G")
        return bottom_align(finish(im))

    if mode == "squished":
        # flat puddle ~10px, dizzy eyes
        body = [
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "................................",
            "....GGGGGGGGGGGGGGGGGG..........",
            "..GMMMMMMMMMMMMMMMMMMMMG........",
            ".GMMMgMMMMMMMMMMMMMMMMMMG.......",
            "GMMMMMMMMMMMMMMMMMMMMMMMMG......",
            "GMMMMMMMMMMMMMMMMMMMMMMMMG......",
            "GMMMgMMMMMMMMMMMMMMMMMMMMG......",
            ".GMMMMMMMMMMMMMMMMMMMMMMG.......",
            "..GMMMMMMMMMMMMMMMMMMMMG........",
            "...GGGGGGGGGGGGGGGGGGGG.........",
            "................................",
            "................................",
        ]
        im = new()
        ascii_to(im, body)
        eyes_x(im, 10, 19, 24)
        blush(im, 8, 23, 26)
        put(im, 15, 26, "m")
        put(im, 16, 26, "m")
        put(im, 12, 22, "G")
        return bottom_align(finish(im))

    raise ValueError(mode)

# =============================================================================
# OUTPUT
# =============================================================================
def up(im, s):
    return im.resize((im.width * s, im.height * s), Image.NEAREST)

def on_bg(im, s, bg):
    b = Image.new("RGBA", (im.width * s, im.height * s), bg)
    b.alpha_composite(up(im, s))
    return b

def gif(frames, path, ms):
    fr = [on_bg(f, 4, SKY).convert("RGB").convert("P", palette=Image.ADAPTIVE, colors=48) for f in frames]
    fr[0].save(path, save_all=True, append_images=fr[1:], duration=ms, loop=0, disposal=2)

def bounds(im):
    px = im.load()
    xs, ys = [], []
    for y in range(32):
        for x in range(32):
            if px[x, y][3] > 0:
                xs.append(x)
                ys.append(y)
    return min(xs), min(ys), max(xs), max(ys)

def main():
    os.makedirs(OUT, exist_ok=True)
    F = {}

    # --- ONI ---
    F["oni_idle_0"] = make_oni(bob=0)
    F["oni_idle_1"] = make_oni(bob=1, blink=True)
    # walk: stubby waddle — alternate lead foot, bob, lean
    F["oni_walk_0"] = make_oni(bob=0, lean=1, lx=5, rx=22, lift_l=0, lift_r=2, custom_feet=True)  # right up
    F["oni_walk_1"] = make_oni(bob=1, lean=0, lx=7, rx=21, lift_l=0, lift_r=0, custom_feet=True)  # gather
    F["oni_walk_2"] = make_oni(bob=0, lean=-1, lx=8, rx=19, lift_l=2, lift_r=0, custom_feet=True)  # left up
    F["oni_walk_3"] = make_oni(bob=1, lean=0, lx=7, rx=21, lift_l=0, lift_r=0, custom_feet=True)
    F["oni_squished"] = make_oni_squished()

    # --- SLIME ---
    F["slime_idle_0"] = make_slime("idle", 0)
    F["slime_idle_1"] = make_slime("idle", 1)
    F["slime_squash"] = make_slime("squash")
    F["slime_rise"] = make_slime("rise")
    F["slime_fall"] = make_slime("fall")
    F["slime_squished"] = make_slime("squished")

    for k, im in F.items():
        im.save(os.path.join(OUT, k + ".png"))
        b = bounds(im)
        print(f"{k}: {b[2]-b[0]+1}x{b[3]-b[1]+1} @ {b}")

    # sheets
    oni_names = ["oni_idle_0", "oni_idle_1"] + [f"oni_walk_{i}" for i in range(4)] + ["oni_squished"]
    slime_names = ["slime_idle_0", "slime_idle_1", "slime_squash", "slime_rise", "slime_fall", "slime_squished"]
    sheet = Image.new("RGBA", (32 * max(len(oni_names), len(slime_names)), 64))
    for i, n in enumerate(oni_names):
        sheet.alpha_composite(F[n], (32 * i, 0))
    for i, n in enumerate(slime_names):
        sheet.alpha_composite(F[n], (32 * i, 32))
    sheet.save(os.path.join(OUT, "monsters_sheet.png"))

    ow = Image.new("RGBA", (32 * 4, 32))
    for i in range(4):
        ow.alpha_composite(F[f"oni_walk_{i}"], (32 * i, 0))
    ow.save(os.path.join(OUT, "oni_walk_sheet.png"))

    # gifs
    gif([F["oni_idle_0"], F["oni_idle_1"]], os.path.join(OUT, "oni_idle.gif"), 400)
    gif([F[f"oni_walk_{i}"] for i in range(4)], os.path.join(OUT, "oni_walk.gif"), 120)
    hop = [F["slime_idle_0"], F["slime_squash"], F["slime_rise"], F["slime_fall"], F["slime_squash"]]
    gif(hop, os.path.join(OUT, "slime_hop.gif"), 160)
    gif([F["slime_idle_0"], F["slime_idle_1"]], os.path.join(OUT, "slime_idle.gif"), 350)

    make_preview(F)
    return F

def make_preview(F):
    f8 = ImageFont.truetype(FONT, 8)
    f10 = ImageFont.truetype(FONT, 10)
    f12 = ImageFont.truetype(FONT, 12)
    S = 8
    pad = 20
    cw, ch = 32 * S + 16, 32 * S
    lab = 18
    rows = [
        ("MINI ONI — IDLE", ["oni_idle_0", "oni_idle_1"]),
        ("MINI ONI — WALK", [f"oni_walk_{i}" for i in range(4)]),
        ("MINI ONI — SQUISHED", ["oni_squished"]),
        ("MOCHI SLIME — IDLE / SQUASH / RISE / FALL / SQUISHED",
         ["slime_idle_0", "slime_idle_1", "slime_squash", "slime_rise", "slime_fall", "slime_squished"]),
    ]
    max_cols = 6
    row_h = lab + ch + 28
    W = pad * 2 + max_cols * (32 * S + 8)
    # shrink cell for 6-col row
    read_h = 110
    cmp_h = 48 * 4 + 90
    H = 40 + len(rows) * row_h + read_h + cmp_h + pad
    # use tighter spacing for slime row
    pv = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(pv)
    d.text((pad, 12), "ENEMIES — Mini Oni (walker) + Mochi Slime (hopper)", font=f12, fill=(255, 230, 120))
    y = 40
    for title, names in rows:
        d.text((pad, y), title, font=f10, fill=(255, 200, 140))
        y += lab
        gap = 8 if len(names) > 4 else 16
        for i, n in enumerate(names):
            x = pad + i * (32 * S + gap)
            pv.alpha_composite(on_bg(F[n], S, SKY), (x, y))
            d.text((x, y + ch + 4), n.replace("oni_", "").replace("slime_", ""), font=f8, fill=(200, 200, 220))
        y += ch + 28

    d.text((pad, y), "READABILITY  1x / 2x  on sky + night (#2a1e4a)", font=f10, fill=(180, 220, 255))
    y += 20
    rx = pad
    for n in ["oni_idle_0", "oni_walk_0", "oni_squished", "slime_idle_0", "slime_rise", "slime_squished"]:
        for bg in (SKY, NIGHT):
            pv.alpha_composite(on_bg(F[n], 1, bg), (rx, y))
            pv.alpha_composite(on_bg(F[n], 2, bg), (rx + 36, y))
            rx += 100
    y += 90

    d.text((pad, y), "SIZE CHECK  4x  —  hero / oni / slime", font=f10, fill=(180, 220, 255))
    y += 22
    hero = Image.open(os.path.join(HERO_PX, "hero_idle.png")).convert("RGBA")
    sc = 4
    band_h = 48 * sc + 16
    band = Image.new("RGBA", (W - pad * 2, band_h), SKY)
    gy = band_h - 8
    bd = ImageDraw.Draw(band)
    bd.rectangle([0, gy, band.width, band_h], fill=(60, 50, 40, 255))
    bd.line([(0, gy), (band.width, gy)], fill=(90, 160, 70, 255), width=3)
    hx_ = 24
    band.alpha_composite(up(hero, sc), (hx_, gy - 48 * sc))
    x = hx_ + 32 * sc + 40
    for n in ["oni_idle_0", "oni_walk_1", "slime_idle_0", "slime_rise", "slime_squash"]:
        band.alpha_composite(up(F[n], sc), (x, gy - 32 * sc))
        x += 32 * sc + 20
    pv.alpha_composite(band, (pad, y))

    out = os.path.join(ENEMIES, "preview_monsters.png")
    pv.convert("RGB").save(out)
    print("preview →", out)

if __name__ == "__main__":
    main()
