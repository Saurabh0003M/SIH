# Build deck/disha-intercollege.pptx from the official SIH idea template.
# Text + images only. Videos are inserted afterwards by insert_videos.ps1, which
# looks for the placeholder rectangles named VIDEOSLOT::<clip>.
import copy
from pptx import Presentation
from pptx.util import Inches as In, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree

TPL = r"F:\SIH\reference\SIH2025-IDEA-Presentation-Format.pptx"
OUT = r"F:\SIH\deck\disha-intercollege.pptx"
SHOTS = r"F:\SIH\media\screenshots"
POST = r"F:\SIH\media\posters"

HEAD = RGBColor(0x1F, 0x49, 0x7D)
BODY = RGBColor(0x1A, 0x1A, 0x1A)
MUTED = RGBColor(0x59, 0x59, 0x59)
SIH = RGBColor(0x00, 0x70, 0xC0)
CARD = RGBColor(0xF4, 0xF7, 0xFB)
LINE = RGBColor(0xD6, 0xE0, 0xEC)
GREEN = RGBColor(0x1E, 0x8E, 0x4A)
AMBER = RGBColor(0xB4, 0x6A, 0x00)
RED = RGBColor(0xC0, 0x27, 0x27)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

BODYFONT = "Arial"
MONO = "Courier New"


# ---------- low-level helpers ------------------------------------------------
def el(tag):
    return etree.SubElement(etree.Element("x"), qn(tag))  # detached factory


def make(tag, **attrs):
    e = etree.Element(qn(tag))
    for k, v in attrs.items():
        e.set(k, v)
    return e


def bullet(p, char="\u2022", indent=0.16, color=None):
    """Real OOXML bullet, so no literal bullet glyph ends up in the text."""
    pPr = p._p.get_or_add_pPr()
    pPr.set("marL", str(int(indent * 914400)))
    pPr.set("indent", str(int(-indent * 914400)))
    if color is not None:
        buClr = make("a:buClr")
        srgb = make("a:srgbClr", val=str(color))
        buClr.append(srgb)
        pPr.append(buClr)
    bf = make("a:buFont", typeface="Arial")
    bc = make("a:buChar", char=char)
    pPr.append(bf)
    pPr.append(bc)


def nobullet(p):
    pPr = p._p.get_or_add_pPr()
    pPr.append(make("a:buNone"))


def run(p, text, size, bold=False, color=BODY, font=BODYFONT, italic=False):
    r = p.add_run()
    r.text = text
    f = r.font
    f.size = Pt(size)
    f.bold = bold
    f.italic = italic
    f.name = font
    f.color.rgb = color
    return r


def textbox(slide, x, y, w, h):
    tb = slide.shapes.add_textbox(In(x), In(y), In(w), In(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Pt(2)
    tf.margin_right = Pt(2)
    tf.margin_top = Pt(1)
    tf.margin_bottom = Pt(1)
    return tb, tf


def card(slide, x, y, w, h, fill=CARD, line=LINE):
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, In(x), In(y), In(w), In(h))
    sh.adjustments[0] = 0.045
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.color.rgb = line
    sh.line.width = Pt(0.75)
    sh.shadow.inherit = False
    if sh.has_text_frame:
        sh.text_frame.text = ""
    return sh


def dotmark(slide, x, y, d, color):
    """The product's own motif: a small filled dot."""
    sh = slide.shapes.add_shape(MSO_SHAPE.OVAL, In(x), In(y), In(d), In(d))
    sh.fill.solid()
    sh.fill.fore_color.rgb = color
    sh.line.fill.background()
    sh.shadow.inherit = False
    return sh


def pointer_card(slide, x, y, w, h, pointer, bullets, hsize=12.5, bsize=11,
                 dot=SIH, gap=0.03):
    """A content block headed by one of the template's own prescribed pointers."""
    card(slide, x, y, w, h)
    dotmark(slide, x + 0.16, y + 0.185, 0.115, dot)
    tb, tf = textbox(slide, x + 0.34, y + 0.08, w - 0.48, h - 0.16)
    p = tf.paragraphs[0]
    nobullet(p)
    run(p, pointer, hsize, bold=True, color=HEAD)
    p.space_after = Pt(5)
    for item in bullets:
        para = tf.add_paragraph()
        bullet(para, color=dot)
        para.space_after = Pt(gap * 72)
        if isinstance(item, tuple):
            lead, rest = item
            run(para, lead, bsize, bold=True, color=BODY)
            run(para, rest, bsize, color=BODY)
        else:
            run(para, item, bsize, color=BODY)
    return tb


def plain_card(slide, x, y, w, h, title, lines, tsize=12, bsize=11,
               fill=CARD, dot=SIH):
    card(slide, x, y, w, h, fill=fill)
    dotmark(slide, x + 0.16, y + 0.185, 0.115, dot)
    tb, tf = textbox(slide, x + 0.34, y + 0.08, w - 0.48, h - 0.16)
    p = tf.paragraphs[0]
    nobullet(p)
    run(p, title, tsize, bold=True, color=HEAD)
    p.space_after = Pt(4)
    for item in lines:
        para = tf.add_paragraph()
        bullet(para, color=dot)
        para.space_after = Pt(2)
        if isinstance(item, tuple):
            run(para, item[0], bsize, bold=True, color=BODY)
            run(para, item[1], bsize, color=BODY)
        else:
            run(para, item, bsize, color=BODY)
    return tb


def caption(slide, x, y, w, text, size=9, color=MUTED, align=PP_ALIGN.LEFT,
            bold=False, italic=True, h=0.32):
    tb, tf = textbox(slide, x, y, w, h)
    p = tf.paragraphs[0]
    nobullet(p)
    p.alignment = align
    run(p, text, size, bold=bold, color=color, italic=italic)
    return tb


def picture(slide, path, x, y, w):
    return slide.shapes.add_picture(path, In(x), In(y), width=In(w))


def videoslot(slide, clip, x, y, w):
    """Placeholder the COM pass replaces with a real, looping media object."""
    h = w * 9 / 16
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, In(x), In(y), In(w), In(h))
    sh.name = "VIDEOSLOT::" + clip
    sh.fill.solid()
    sh.fill.fore_color.rgb = RGBColor(0xE9, 0xEE, 0xF4)
    sh.line.color.rgb = LINE
    sh.shadow.inherit = False
    return sh


def strip_chrome(slide):
    """Reclaim the space the template spends on itself.

    The blue footer bar, the page number and the footer caption cost 0.55in
    across the bottom of every content slide, and the team oval and the SIH
    lockup cost the top corners. Projected, that space is worth more than the
    branding: it is the difference between a 4.7in video and a 6.3in one. The
    oval and the logo stay, just smaller, so the deck is still recognisably the
    official template.
    """
    for sh in list(slide.shapes):
        low = sh.top is not None and sh.top > In(6.5)
        if (sh.name.startswith("Rectangle") and low) \
           or sh.name.startswith("Slide Number Placeholder") \
           or sh.name.startswith("Footer Placeholder"):
            kill(sh)
    for sh in slide.shapes:
        if sh.name.startswith("Oval"):
            sh.left, sh.top, sh.width, sh.height = In(0.16), In(0.09), In(1.00), In(0.48)
            for para in sh.text_frame.paragraphs:
                for r in para.runs:
                    r.font.size = Pt(8)
        elif sh.name.startswith("Picture"):
            sh.left, sh.top, sh.width, sh.height = In(11.70), In(0.07), In(1.34), In(0.68)
        elif sh.name.startswith("Title"):
            # All four, deliberately. These placeholders inherit their geometry
            # from the layout, so writing only top/height creates an xfrm whose
            # missing width defaults to zero - and the title then wraps one
            # letter per line down the left edge.
            sh.left, sh.top = In(1.24), In(-0.10)
            sh.width, sh.height = In(10.38), In(0.95)


def flowstep(slide, x, y, w, h, num, label, sub, colour=None):
    """One beat of a workflow: a numbered token, three words, and a whisper."""
    colour = colour or SIH
    card(slide, x, y, w, h)
    numcircle(slide, x + w / 2, y + 0.34, 0.42, num, colour)
    tb, tf = textbox(slide, x + 0.08, y + 0.60, w - 0.16, h - 0.66)
    p = tf.paragraphs[0]
    nobullet(p)
    p.alignment = PP_ALIGN.CENTER
    run(p, label, 12, bold=True, color=HEAD)
    p2 = tf.add_paragraph()
    nobullet(p2)
    p2.alignment = PP_ALIGN.CENTER
    run(p2, sub, 9.5, color=MUTED)


def arrowbetween(slide, x, y, w, h):
    sh = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, In(x), In(y), In(w), In(h))
    sh.fill.solid()
    sh.fill.fore_color.rgb = RGBColor(0xC8, 0xD3, 0xE2)
    sh.line.fill.background()
    sh.shadow.inherit = False
    return sh


def numcircle(slide, cx, cy, d, label, color):
    """A numbered token. Carries the eye down the card without a word of text."""
    sh = slide.shapes.add_shape(MSO_SHAPE.OVAL, In(cx - d / 2), In(cy - d / 2), In(d), In(d))
    sh.fill.solid()
    sh.fill.fore_color.rgb = color
    sh.line.fill.background()
    sh.shadow.inherit = False
    tf = sh.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    nobullet(p)
    p.alignment = PP_ALIGN.CENTER
    run(p, label, 15, bold=True, color=WHITE)
    return sh


def chip(slide, x, y, w, text, size=9.5, fill=RGBColor(0xFF, 0xFF, 0xFF)):
    """One source, as an object you can point at - not a line in a paragraph."""
    h = 0.30
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, In(x), In(y), In(w), In(h))
    sh.adjustments[0] = 0.30
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.color.rgb = RGBColor(0xC8, 0xD3, 0xE2)
    sh.line.width = Pt(0.75)
    sh.shadow.inherit = False
    tf = sh.text_frame
    tf.margin_left = tf.margin_right = Pt(5)
    tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    nobullet(p)
    p.alignment = PP_ALIGN.CENTER
    run(p, text, size, color=BODY)
    return sh


def find(slide, name):
    for sh in slide.shapes:
        if sh.name == name:
            return sh
    return None


def kill(shape):
    shape._element.getparent().remove(shape._element)


def set_oval(slide, text="Code Blooded"):
    for sh in slide.shapes:
        if sh.name.startswith("Oval") and sh.has_text_frame:
            tf = sh.text_frame
            # keep the template's own oval formatting; replace only the words
            keep = tf.paragraphs[0]
            for extra in tf.paragraphs[1:]:
                extra._p.getparent().remove(extra._p)
            runs = keep.runs
            if runs:
                runs[0].text = text
                runs[0].font.size = Pt(11)
                runs[0].font.bold = True
                for r in runs[1:]:
                    r._r.getparent().remove(r._r)
            else:
                run(keep, text, 11, bold=True)
            return sh
    return None


# ---------- open the template ------------------------------------------------
prs = Presentation(TPL)

# Delete slide 7 (the instructions page) in the OUTPUT only.
sldIdLst = prs.slides._sldIdLst
ids = list(sldIdLst)
prs.part.drop_rel(ids[6].rId)
sldIdLst.remove(ids[6])

s1, s2, s3, s4, s5, s6 = list(prs.slides)

# ---------- SLIDE 1 — TITLE PAGE --------------------------------------------
# Verbatim from the portal listing for PS 26202. The title is a long sentence,
# not a two-word label, so it gets its own smaller size or it runs off the slide.
PS_TITLE = ("Ideas focused on the intelligent use of resources for transforming and "
            "advancements of technology with combining the artificial intelligence to "
            "explore more various sources and get valuable insights.")
VALUES = [
    ("  26202", 18),
    ("  Student Innovation (Open Innovation) — " + PS_TITLE, 11),
    ("  Smart Automation", 18),
    ("  Software", 18),
    ("", 18),                 # Team ID: issued only after the intercollege round
    ("  Code Blooded", 18),
]
tb = find(s1, "TextBox 9")
tb.width = In(7.0)
paras = [p for p in tb.text_frame.paragraphs if p.runs]
for para, (val, size) in zip(paras, VALUES):
    para.alignment = PP_ALIGN.LEFT
    for r in para.runs:
        r.font.size = Pt(min(size, 18))
    if val:
        run(para, val, size, bold=False, color=RGBColor(0x0B, 0x30, 0x5B))

# ---------- SLIDE 2 — IDEA TITLE ---------------------------------------------
# Rebuilt as a workflow. The old version put three paragraphs where a judge needed
# one glance: what happens, in order, and who does the clicking.
title = find(s2, "Title 1")
tr = [r for r in title.text_frame.paragraphs[0].runs]
tr[-1].text = "Disha — it points, you click, and then it fades"
for r in tr:
    r.font.size = Pt(30)
set_oval(s2)
strip_chrome(s2)
kill(find(s2, "TextBox 8"))

tb, tf = textbox(s2, 0.28, 0.86, 12.77, 0.34)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Proposed Solution  ·  Detailed explanation of the proposed solution", 14,
    bold=True, color=HEAD)

FLOW = [
    ("1", "Open any portal", "nothing installed on their side"),
    ("2", "Disha reads the controls", "names and roles, not your text"),
    ("3", "One dot appears", "its colour is the confidence"),
    ("4", "You click", "Disha never can"),
    ("5", "The dot fades", "gone after five clean runs"),
]
FW = (12.77 - 4 * 0.34) / 5
for i, (n, lab, sub) in enumerate(FLOW):
    x = 0.28 + i * (FW + 0.34)
    flowstep(s2, x, 1.24, FW, 1.30, n, lab, sub,
             colour=GREEN if i == 4 else SIH)
    if i < 4:
        arrowbetween(s2, x + FW + 0.05, 1.24 + 0.44, 0.24, 0.22)

LX, LW = 0.28, 6.30
pointer_card(
    s2, LX, 2.76, LW, 1.62,
    "How it addresses the problem",
    ["Finishes the task without knowing the word “withdraw”.",
     "No paid intermediary, no travel, no second visit.",
     "Points instead of clicking — safe on Aadhaar and banking."],
    hsize=13, bsize=11.5)

card(s2, LX, 4.52, LW, 2.02)
dotmark(s2, LX + 0.16, 4.705, 0.115, SIH)
tb, tf = textbox(s2, LX + 0.34, 4.60, LW - 0.48, 1.86)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Innovation and uniqueness of the solution", 13, bold=True, color=HEAD)
p.space_after = Pt(5)
p2 = tf.add_paragraph()
nobullet(p2)
p2.space_after = Pt(4)
run(p2, "Two independent judgements must agree before you see green:", 11, color=BODY)
for col, lab, txt in ((GREEN, "GREEN", "model ≥ 0.80  and  page ≥ 0.75"),
                      (AMBER, "AMBER", "best guess — check before clicking"),
                      (RED, "RED", "not sure — verify this one")):
    para = tf.add_paragraph()
    bullet(para, color=col)
    para.space_after = Pt(2)
    run(para, lab + "  ", 11, bold=True, color=col)
    run(para, txt, 11, color=BODY)

RX, RW = 6.72, 6.33
videoslot(s2, "01-chain", RX, 2.76, RW)
caption(s2, RX, 2.76 + RW * 9 / 16 + 0.05, RW,
        "Live capture — four dots, three screens, one goal typed in plain words.",
        align=PP_ALIGN.CENTER)

card(s2, 0.28, 6.72, 12.77, 0.60, fill=RGBColor(0xFF, 0xF6, 0xE6),
     line=RGBColor(0xF0, 0xD9, 0xA8))
tb, tf = textbox(s2, 0.44, 6.78, 12.45, 0.50)
p = tf.paragraphs[0]
nobullet(p)
p.alignment = PP_ALIGN.CENTER
run(p, "Microsoft Copilot Vision already points at things. ", 11, bold=True,
    color=RGBColor(0x7A, 0x4A, 0x00))
run(p, "We do not claim to have invented that. Ours is the combination — exposed confidence, "
       "DOM + ARIA grounding, a scaffold that removes itself.", 11, color=RGBColor(0x5A, 0x3E, 0x0A))

# ---------- SLIDE 3 — TECHNICAL APPROACH -------------------------------------
# The diagram does the explaining. The left column stops being prose and becomes
# what it always was: a stack of names, and a pipeline.
set_oval(s3)
strip_chrome(s3)
kill(find(s3, "TextBox 8"))

LX, LW = 0.28, 5.30

tb, tf = textbox(s3, LX, 0.86, LW, 0.30)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Technologies to be used", 13, bold=True, color=HEAD)

STACK = ["Manifest V3 extension", "Vanilla JS · no build",
         "DOM + ARIA", "not the a11y tree",
         "Model is pluggable", "Gemini · OpenRouter · local",
         "Vision fallback", "GUI-Actor (MIT), documented"]
CW2 = (LW - 0.10) / 2
for i, txt in enumerate(STACK):
    x = LX + (i % 2) * (CW2 + 0.10)
    y = 1.18 + (i // 2) * 0.38
    chip(s3, x, y, CW2, txt, size=9.5,
         fill=RGBColor(0xEF, 0xF4, 0xFA) if i % 2 == 0 else RGBColor(0xFF, 0xFF, 0xFF))

tb, tf = textbox(s3, LX, 2.80, LW, 0.30)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Methodology and process for implementation", 13, bold=True, color=HEAD)

PIPE = [
    ("1", "Read the page", "every control, its name and role"),
    ("2", "Ask the model", "a compact text list, never a screenshot"),
    ("3", "Score it ourselves", "on-device, from the page evidence"),
    ("4", "Both must agree", "the weaker number becomes the colour"),
    ("5", "Draw one dot", "the human clicks; we wait for the DOM"),
]
for i, (n, head_, sub) in enumerate(PIPE):
    y = 3.14 + i * 0.60
    numcircle(s3, LX + 0.26, y + 0.23, 0.40, n, SIH if i < 4 else GREEN)
    tb, tf = textbox(s3, LX + 0.56, y + 0.02, LW - 0.60, 0.52)
    p = tf.paragraphs[0]
    nobullet(p)
    run(p, head_, 11.5, bold=True, color=HEAD)
    q = tf.add_paragraph()
    nobullet(q)
    run(q, sub, 10, color=MUTED)

plain_card(
    s3, LX, 6.18, LW, 1.12,
    "Working prototype, verified in a browser",
    [("live grounding, colour bands, contingent fading, on-page ask bar, screen share with a "
      "real pause, offline mode. Vision fallback and the live-model green dot are next.", "")],
    tsize=11.5, bsize=10, fill=RGBColor(0xEC, 0xF6, 0xEE), dot=GREEN)

RX, RW = 5.92, 7.13
from PIL import Image as _Img
_aw, _ah = _Img.open(SHOTS + r"\architecture.png").size
AH = RW * _ah / _aw
picture(s3, SHOTS + r"\architecture.png", RX, 0.86, RW)
caption(s3, RX, 0.86 + AH + 0.04, RW,
        "Two independent judgements, and the boundary nothing crosses: "
        "only control names leave the device.",
        h=0.30, align=PP_ALIGN.CENTER)

# ---------- SLIDE 4 — FEASIBILITY AND VIABILITY ------------------------------
# The measured run was a bullet. It is the most persuasive thing we own - a tool
# that says "not sure" on a near-tie - so it is now the bottom third of the slide,
# as four circles readable from the back of the room.
set_oval(s4)
strip_chrome(s4)
kill(find(s4, "TextBox 8"))

LX, LW = 0.28, 7.02

tb, tf = textbox(s4, LX, 0.88, LW, 0.30)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Analysis of the feasibility of the idea", 13, bold=True, color=HEAD)

FEAS = [
    ("Technical", ["running today, on portals", "we do not control"]),
    ("Financial", ["free-tier model;", "a local one costs zero"]),
    ("Operational", ["an extension — no ministry", "integration, no portal change"]),
    ("Market", ["$1,000 Azure credits", "already in hand"]),
]
MW = (LW - 3 * 0.10) / 4
for i, (head_, sublines) in enumerate(FEAS):
    x = LX + i * (MW + 0.10)
    card(s4, x, 1.20, MW, 1.12)
    tb, tf = textbox(s4, x + 0.08, 1.28, MW - 0.16, 0.96)
    p = tf.paragraphs[0]
    nobullet(p)
    p.alignment = PP_ALIGN.CENTER
    run(p, head_, 12, bold=True, color=HEAD)
    for line in sublines:
        q = tf.add_paragraph()
        nobullet(q)
        q.alignment = PP_ALIGN.CENTER
        run(q, line, 9.5, color=MUTED)

tb, tf = textbox(s4, LX, 2.44, LW, 0.30)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Potential challenges and risks", 13, bold=True, color=HEAD)
run(p, "   →   ", 13, bold=True, color=MUTED)
run(p, "Strategies for overcoming these challenges", 13, bold=True, color=HEAD)

PAIRS = [
    ("Unlabelled / icon-only controls", "page score drops → the dot goes red, never a silent guess"),
    ("The model picks the wrong element", "a glance wasted, not a transaction — the human always clicks"),
    ("Users over-trust a confident dot", "the fade removes the dot once they can do it alone"),
    ("Copilot Vision already points", "nobody else shows the confidence, or takes it away"),
]
for i, (risk, fix) in enumerate(PAIRS):
    y = 2.78 + i * 0.46
    chip(s4, LX, y, 2.62, risk, size=10, fill=RGBColor(0xFD, 0xF0, 0xF0))
    arrowbetween(s4, LX + 2.70, y + 0.08, 0.22, 0.15)
    tb, tf = textbox(s4, LX + 3.00, y + 0.02, LW - 3.00, 0.28)
    p = tf.paragraphs[0]
    nobullet(p)
    run(p, fix, 10.5, color=BODY)

RX, RW = 7.55, 5.50
videoslot(s4, "02-red-verify", RX, 0.88, RW)
caption(s4, RX, 0.88 + RW * 9 / 16 + 0.05, RW,
        "The near-tie it refuses to guess — red at 51%, and the card saying why.",
        align=PP_ALIGN.CENTER)
picture(s4, SHOTS + r"\explainer-red-case.png", RX + 0.45, 4.45, 4.60)

card(s4, LX, 4.72, LW, 2.58, fill=RGBColor(0xFD, 0xF7, 0xF7), line=RGBColor(0xF0, 0xC8, 0xC8))
tb, tf = textbox(s4, LX + 0.18, 4.80, LW - 0.36, 0.34)
p = tf.paragraphs[0]
nobullet(p)
run(p, "The measured run  ·  “i want to take my money out”", 12.5, bold=True, color=HEAD)

RUN = [("64%", "Wallet", AMBER), ("57%", "Withdraw", AMBER),
       ("51%", "Amount field", RED), ("75%", "Confirm", AMBER)]
D = 1.02
gap = (LW - 0.5 - 4 * D) / 3
for i, (pct, lab, col) in enumerate(RUN):
    cx = LX + 0.25 + D / 2 + i * (D + gap)
    sh = s4.shapes.add_shape(MSO_SHAPE.OVAL, In(cx - D / 2), In(5.28), In(D), In(D))
    sh.fill.solid()
    sh.fill.fore_color.rgb = col
    sh.line.fill.background()
    sh.shadow.inherit = False
    tfc = sh.text_frame
    tfc.margin_left = tfc.margin_right = tfc.margin_top = tfc.margin_bottom = 0
    pc = tfc.paragraphs[0]
    nobullet(pc)
    pc.alignment = PP_ALIGN.CENTER
    run(pc, pct, 22, bold=True, color=WHITE)
    tb, tf = textbox(s4, cx - D / 2 - 0.10, 5.28 + D + 0.04, D + 0.20, 0.28)
    p = tf.paragraphs[0]
    nobullet(p)
    p.alignment = PP_ALIGN.CENTER
    run(p, lab, 10.5, bold=True, color=BODY)
    if i < 3:
        arrowbetween(s4, cx + D / 2 + gap / 2 - 0.13, 5.28 + D / 2 - 0.09, 0.26, 0.18)

tb, tf = textbox(s4, LX + 0.18, 6.86, LW - 0.36, 0.40)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Offline matcher, no model — capped below green by design. ", 10.5, bold=True, color=RED)
run(p, "Accuracy is unmeasured; these four numbers are the only ones we quote.",
    10.5, color=BODY)

# ---------- SLIDE 5 — IMPACT AND BENEFITS ------------------------------------
# Numbers first, then a before/after a judge can read in one look. The old
# version buried three sourced statistics under two paragraphs of prose.
set_oval(s5)
strip_chrome(s5)
kill(find(s5, "TextBox 8"))

LX, LW = 0.28, 7.00

STATS = [
    ("21%", ["of rural Indians 15–24 can", "search, email and bank online"], "MoSPI CAMS 2022–23"),
    ("11.4%", ["of connected households use", "the internet for gov services"], "NCAER, June 2026"),
    ("1 in 5", ["households using digital services", "depend on help from outside"], "NCAER, June 2026"),
]
SW = (LW - 2 * 0.12) / 3
for i, (big, mid, src) in enumerate(STATS):
    x = LX + i * (SW + 0.12)
    card(s5, x, 0.88, SW, 1.62, fill=RGBColor(0xEF, 0xF4, 0xFA))
    tb, tf = textbox(s5, x + 0.10, 0.96, SW - 0.20, 1.46)
    p = tf.paragraphs[0]
    nobullet(p)
    p.alignment = PP_ALIGN.CENTER
    run(p, big, 30, bold=True, color=SIH)
    for line in mid:
        q = tf.add_paragraph()
        nobullet(q)
        q.alignment = PP_ALIGN.CENTER
        run(q, line, 9.5, color=BODY)
    q = tf.add_paragraph()
    nobullet(q)
    q.alignment = PP_ALIGN.CENTER
    q.space_before = Pt(3)
    run(q, src, 8, color=MUTED, italic=True)

tb, tf = textbox(s5, LX, 2.60, LW, 0.30)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Potential impact on the target audience", 13, bold=True, color=HEAD)

BEFORE_AFTER = [
    ("Today", RGBColor(0xF3, 0xF4, 0xF6), RGBColor(0xD1, 0xD5, 0xDB), MUTED,
     ["Pays someone at a shop to click", "Travels, waits, comes back next week",
      "Learns nothing — same again next time"]),
    ("With Disha", RGBColor(0xEC, 0xF6, 0xEE), RGBColor(0xB6, 0xDF, 0xC4), GREEN,
     ["Finishes it themselves, at home", "One dot, in their own words",
      "After five clean runs the dot is gone"]),
]
BW = (LW - 0.46) / 2
for i, (head_, fill, line_, accent, items) in enumerate(BEFORE_AFTER):
    x = LX + i * (BW + 0.46)
    card(s5, x, 2.94, BW, 1.72, fill=fill, line=line_)
    tb, tf = textbox(s5, x + 0.14, 3.02, BW - 0.28, 1.56)
    p = tf.paragraphs[0]
    nobullet(p)
    run(p, head_, 13, bold=True, color=accent)
    p.space_after = Pt(4)
    for it in items:
        q = tf.add_paragraph()
        bullet(q, color=accent)
        q.space_after = Pt(2)
        run(q, it, 10.5, color=BODY)
arrowbetween(s5, LX + BW + 0.09, 3.66, 0.28, 0.26)

tb, tf = textbox(s5, LX, 4.76, LW, 0.30)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Benefits of the solution (social, economic, environmental, etc.)", 13,
    bold=True, color=HEAD)

BEN = [
    ("Social", ["independence on services", "people already qualify for"]),
    ("Economic", ["no per-visit intermediary,", "no travel (CSC studies)"]),
    ("Educational", ["+0.47 SD active learning,", "g = 0.74 spaced retrieval"]),
]
for i, (head_, lines) in enumerate(BEN):
    x = LX + i * (SW + 0.12)
    card(s5, x, 5.10, SW, 1.16, fill=RGBColor(0xEC, 0xF6, 0xEE), line=RGBColor(0xB6, 0xDF, 0xC4))
    tb, tf = textbox(s5, x + 0.10, 5.18, SW - 0.20, 1.00)
    p = tf.paragraphs[0]
    nobullet(p)
    p.alignment = PP_ALIGN.CENTER
    run(p, head_, 12, bold=True, color=GREEN)
    for line in lines:
        q = tf.add_paragraph()
        nobullet(q)
        q.alignment = PP_ALIGN.CENTER
        run(q, line, 9.5, color=BODY)

tb, tf = textbox(s5, LX, 6.38, LW, 0.42)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Both learning figures validate the mechanism, not our product. ", 10.5,
    bold=True, color=BODY)
run(p, "It needs a browser and one install — that is the adoption cost.", 10.5, color=MUTED)

RX, RW = 7.50, 5.55
videoslot(s5, "04-fade", RX, 0.88, RW)
caption(s5, RX, 0.88 + RW * 9 / 16 + 0.05, RW,
        "The same task three times until the dot is gone.", align=PP_ALIGN.CENTER)
PW = 4.60
picture(s5, SHOTS + r"\practice-portal.png", RX + (RW - PW) / 2, 4.42, PW)
caption(s5, RX, 4.42 + PW * 9 / 16 + 0.04, RW,
        "Vidya Setu — the student practice portal, safe to fail in.",
        align=PP_ALIGN.CENTER, size=9, h=0.26)

# ---------- SLIDE 6 — RESEARCH AND REFERENCES --------------------------------
# Was a wall of citations nobody reads. A judge does not want to read our
# bibliography; they want to see, in three seconds, that each claim has something
# behind it. So: four columns of evidence, each answering "what does this prove".
set_oval(s6)
strip_chrome(s6)
kill(find(s6, "TextBox 8"))

tb, tf = textbox(s6, 0.28, 0.88, 12.77, 0.38)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Details / Links of the reference and research work", 15, bold=True, color=HEAD)

EVIDENCE = [
    ("1", SIH, "The problem is real",
     ["MoSPI CAMS 2022–23", "NSS 78th Round", "NCAER, June 2026", "PIB · MeitY"],
     "21% ICT-skill · 1 in 5 households need outside help"),
    ("2", GREEN, "The mechanism works",
     ["Freeman, PNAS 2014", "Adesope 2017 · Latimier 2021", "Renkl et al. — fading",
      "Fitts 1954 · Wobbrock 2009"],
     "+0.47 SD · g = 0.74 — validates the mechanism, not our product"),
    ("3", AMBER, "The prior art",
     ["MS Copilot Vision", "microsoft/GUI-Actor (MIT)", "SeeClick · CogAgent · OSWorld",
      "Lazar 2015 · Trewin 2014"],
     "Pointing already ships. Exposed confidence does not."),
    ("4", RED, "Our own evidence",
     ["github.com/Saurabh0003M/SIH", "deck/real-site-run.md", "Red Bull Basement 2026"],
     "Code, recorded runs, licences — including the ones we got wrong."),
]

CW = (12.77 - 3 * 0.18) / 4
for i, (num, colour, title, chips, proof) in enumerate(EVIDENCE):
    x = 0.28 + i * (CW + 0.18)
    card(s6, x, 1.36, CW, 3.32)
    numcircle(s6, x + CW / 2, 1.72, 0.46, num, colour)
    tb, tf = textbox(s6, x + 0.12, 2.02, CW - 0.24, 0.36)
    p = tf.paragraphs[0]
    nobullet(p)
    p.alignment = PP_ALIGN.CENTER
    run(p, title, 13.5, bold=True, color=HEAD)
    for j, c in enumerate(chips):
        chip(s6, x + 0.16, 2.48 + j * 0.36, CW - 0.32, c)
    tb, tf = textbox(s6, x + 0.14, 2.48 + len(chips) * 0.36 + 0.10, CW - 0.28, 0.80)
    p = tf.paragraphs[0]
    nobullet(p)
    p.alignment = PP_ALIGN.CENTER
    run(p, proof, 10, color=MUTED, italic=True)

plain_card(
    s6, 0.28, 5.52, 12.77, 0.86,
    "What these sources do NOT say",
    [("Accuracy is unmeasured. ",
      "48.54 crore counts transactions, not citizens. 21% is a combined ICT-skill measure, "
      "not “cannot use a government website”. The learning figures validate the mechanism."),],
    tsize=12.5, bsize=11, fill=RGBColor(0xEC, 0xF6, 0xEE), dot=GREEN)

tb, tf = textbox(s6, 0.28, 6.52, 12.77, 0.60)
p = tf.paragraphs[0]
nobullet(p)
p.alignment = PP_ALIGN.CENTER
run(p, "github.com/Saurabh0003M/SIH", 18, bold=True, color=SIH)
p2 = tf.add_paragraph()
nobullet(p2)
p2.alignment = PP_ALIGN.CENTER
run(p2, "the working prototype, the practice portal, every recorded run, and ATTRIBUTION.md "
        "— every borrowed repository with its licence and commit hash", 10.5, color=MUTED)

# ---------- SLIDE 7 — the Q&A loop (room only) -------------------------------
# Not part of the six. This is the slide you leave up while judges ask questions:
# three clips looping side by side, so the product keeps demonstrating itself
# while you talk. insert_videos.ps1 deletes it before writing the PDF, so the
# portal submission is still exactly six slides.
s7 = prs.slides.add_slide(s6.slide_layout)
for shp in list(s7.shapes):
    kill(shp)  # start from a clean sheet; the layout's placeholders are in the way

tb, tf = textbox(s7, 0.28, 0.16, 12.77, 0.62)
p = tf.paragraphs[0]
nobullet(p)
p.alignment = PP_ALIGN.CENTER
run(p, "Disha is running. Ask us anything.", 30, bold=True, color=HEAD, font="Times New Roman")

QA = [
    ("01-chain", "Four dots, three screens", "one goal, typed in plain words"),
    ("02-red-verify", "The near-tie it refuses to guess", "red at 51%, and the card saying why"),
    ("03-navigation", "Every navigation state", "two arrowheads, then one, then the dot"),
]
QW = (13.33 - 2 * 0.24 - 2 * 0.15) / 3
for i, (clip, head, sub_) in enumerate(QA):
    x = 0.24 + i * (QW + 0.15)
    videoslot(s7, clip, x, 1.02, QW)
    y = 1.02 + QW * 9 / 16 + 0.06
    tb, tf = textbox(s7, x, y, QW, 0.60)
    p = tf.paragraphs[0]
    nobullet(p)
    p.alignment = PP_ALIGN.CENTER
    run(p, head, 12.5, bold=True, color=HEAD)
    p2 = tf.add_paragraph()
    nobullet(p2)
    p2.alignment = PP_ALIGN.CENTER
    run(p2, sub_, 10.5, color=MUTED, italic=True)

# the numbers a judge is most likely to reach for, and the limits, in one band
band_y = 1.02 + QW * 9 / 16 + 0.78
card(s7, 0.28, band_y, 12.77, 7.32 - band_y, fill=RGBColor(0xF4, 0xF7, 0xFB))
tb, tf = textbox(s7, 0.52, band_y + 0.10, 12.29, 7.32 - band_y - 0.20)
p = tf.paragraphs[0]
nobullet(p)
run(p, "What you are looking at", 13, bold=True, color=HEAD)
p.space_after = Pt(5)
for lead, rest in (
    ("Measured on our practice portal: ",
     "“i want to take my money out” gave 64% → 57% → 51% red → 75%. "
     "That run used the offline matcher with no model, which is capped below green by design."),
    ("Green needs two numbers to agree: ",
     "model ≥ 0.80 AND page evidence ≥ 0.75. We display the weaker of the two, never the "
     "average, so the number can never contradict the colour."),
    ("Read-only runs on live public portals: ",
     "scholarships.gov.in, swayam.gov.in, aicte-india.org — including the ones it got wrong "
     "and reported red. Nothing was clicked on any of them."),
    ("What we do not claim: ",
     "accuracy is unmeasured, the vision fallback is documented but not built, and Microsoft "
     "Copilot Vision already points at things — we say so on slide 2."),
    ("Why not let the AI click? ",
     "On an Aadhaar or a banking page a wrong click is a transaction, not a glance. And the "
     "moment it clicks for you, you have learned nothing. The human clicking is the product."),
    ("Who pays for it? ",
     "Nobody has to. Free-tier model, or a local one at zero cost that never leaves the machine. "
     "Installs as an extension — no ministry integration, no portal changes."),
):
    para = tf.add_paragraph()
    bullet(para, color=SIH)
    para.space_after = Pt(3)
    run(para, lead, 11, bold=True, color=BODY)
    run(para, rest, 11, color=BODY)

prs.save(OUT)
print("saved", OUT)
