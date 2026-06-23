"""One-off generator for the basil sprig app icon, replacing the default
Expo logo. Draws everything procedurally (no external art assets) using
the same palette as the app's UI (see src/constants/brand.ts).
"""
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

GREEN_DEEP = (44, 71, 51, 255)      # Brand.greenDeep #2c4733
GREEN = (68, 96, 74, 255)           # Brand.green #44604a
CREAM = (246, 241, 227, 255)        # Brand.background #f6f1e3
TERRACOTTA = (187, 91, 44, 255)     # Brand.terracotta #bb5b2c
TERRACOTTA_DEEP = (147, 67, 29, 255)  # Brand.terracottaDeep #93431d

SS = 4  # supersampling factor for smooth anti-aliased edges


def make_leaf(width, height, fill, vein_color, vein_width):
    """A pointed-oval leaf (vesica piscis: intersection of two circles
    whose centers sit on the horizontal axis, so the lens points fall on
    the vertical axis - top tip and bottom tip), with a center vein and a
    few angled side veins."""
    w, h = width * SS, height * SS
    cx, cy = w / 2, h / 2

    # Solve for R, d (circle radius / center separation) so the lens is
    # exactly `h` tall (tip to tip) and close to `w` wide at its widest.
    half_h = h * 0.485  # tip distance from center, leaving a hair of margin
    half_w = w * 0.46
    # tip^2 = R^2 - (d/2)^2 ; widest-point x where circle meets midline:
    # at y=cy the right circle's edge is at cx + d/2 + R*cos(asin(... ));
    # simplest: pick d, then R = sqrt(half_h^2 + (d/2)^2), and check width.
    d = half_w * 0.95
    r = math.sqrt(half_h ** 2 + (d / 2) ** 2)

    cx1, cx2 = cx - d / 2, cx + d / 2

    m1 = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m1).ellipse([cx1 - r, cy - r, cx1 + r, cy + r], fill=255)
    m2 = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m2).ellipse([cx2 - r, cy - r, cx2 + r, cy + r], fill=255)

    lens = np.minimum(np.array(m1), np.array(m2))
    mask_img = Image.fromarray(lens, mode="L").filter(ImageFilter.GaussianBlur(SS * 0.5))
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    solid = Image.new("RGBA", (w, h), fill)
    img.paste(solid, (0, 0), mask_img)

    draw = ImageDraw.Draw(img)
    top = (cx, cy - half_h * 0.92)
    bottom = (cx, cy + half_h * 0.92)
    draw.line([top, bottom], fill=vein_color, width=vein_width * SS)
    for t in (0.32, 0.50, 0.68):
        midx = cx
        midy = top[1] + (bottom[1] - top[1]) * t
        spread = half_w * 0.62 * math.sin(t * math.pi)
        drop = half_h * 0.22
        draw.line(
            [(midx, midy), (midx - spread, midy + drop)],
            fill=vein_color, width=max(1, vein_width * SS - 2),
        )
        draw.line(
            [(midx, midy), (midx + spread, midy + drop)],
            fill=vein_color, width=max(1, vein_width * SS - 2),
        )

    img = img.resize((width, height), Image.LANCZOS)
    return img


def paste_rotated(canvas, glyph, center, angle, scale=1.0):
    if scale != 1.0:
        glyph = glyph.resize(
            (max(1, int(glyph.width * scale)), max(1, int(glyph.height * scale))),
            Image.LANCZOS,
        )
    rotated = glyph.rotate(angle, resample=Image.BICUBIC, expand=True)
    x = int(center[0] - rotated.width / 2)
    y = int(center[1] - rotated.height / 2)
    canvas.alpha_composite(rotated, (x, y))


def build_sprig(canvas_size, leaf_fill, vein_color, with_stem=True, stem_color=None):
    """Returns an RGBA image of a single bold basil leaf glyph (transparent
    bg), sized to canvas_size, centered with margin. A single leaf reads
    far more clearly than a multi-leaf sprig at small icon sizes."""
    S = canvas_size
    canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    leaf = make_leaf(int(S * 0.62), int(S * 0.86), leaf_fill, vein_color, vein_width=4)
    leaf_center = (S * 0.5, S * 0.44)

    if with_stem:
        stem_color = stem_color or TERRACOTTA
        draw = ImageDraw.Draw(canvas)
        leaf_bottom_y = leaf_center[1] + leaf.height / 2 - S * 0.03
        draw.line(
            [(S * 0.5, leaf_bottom_y), (S * 0.5, S * 0.90)],
            fill=stem_color, width=max(3, int(S * 0.022)),
        )

    paste_rotated(canvas, leaf, leaf_center, angle=0, scale=1.0)
    return canvas


def master_icon(size=1024):
    canvas = Image.new("RGBA", (size, size), GREEN_DEEP)
    sprig = build_sprig(size, CREAM, GREEN_DEEP)
    canvas.alpha_composite(sprig)
    return canvas.convert("RGB")


def glyph_only(size=512, color=CREAM, vein=GREEN_DEEP, stem=TERRACOTTA):
    return build_sprig(size, color, vein, stem_color=stem)


def monochrome_glyph(size=512):
    g = build_sprig(size, (255, 255, 255, 255), (255, 255, 255, 255), stem_color=(255, 255, 255, 255))
    return g


def fit_transparent(glyph, out_size):
    """Center `glyph` (RGBA, transparent bg) into an image of out_size,
    preserving aspect ratio, with transparent padding."""
    ow, oh = out_size
    scale = min(ow / glyph.width, oh / glyph.height) * 0.86
    new_w, new_h = max(1, int(glyph.width * scale)), max(1, int(glyph.height * scale))
    resized = glyph.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGBA", out_size, (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((ow - new_w) // 2, (oh - new_h) // 2))
    return canvas


OUT = r"C:\Users\aadhr\OneDrive\Desktop\plantscope-basil-ios\assets\images"

icon = master_icon(1024)
icon.save(f"{OUT}\\icon.png")
print("saved icon.png", icon.size)

fg = glyph_only(512)
fg.save(f"{OUT}\\android-icon-foreground.png")
print("saved android-icon-foreground.png", fg.size)

bg = Image.new("RGB", (512, 512), GREEN_DEEP[:3])
bg.save(f"{OUT}\\android-icon-background.png")
print("saved android-icon-background.png")

mono = monochrome_glyph(512)
mono.save(f"{OUT}\\android-icon-monochrome.png")
print("saved android-icon-monochrome.png")

favicon_master = master_icon(256).resize((48, 48), Image.LANCZOS)
favicon_master.save(f"{OUT}\\favicon.png")
print("saved favicon.png")

splash_glyph = glyph_only(600)
splash = fit_transparent(splash_glyph, (228, 213))
splash.save(f"{OUT}\\splash-icon.png")
print("saved splash-icon.png", splash.size)
