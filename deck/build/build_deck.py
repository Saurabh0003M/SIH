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
VALUES = [
    "  26207",
    "  Student Innovation",
    "  Smart Education",
    "  Software",
    "",                       # Team ID: issued only after the intercollege round
    "  Code Blooded",
]
tb = find(s1, "TextBox 9")
tb.width = In(7.0)
paras = [p for p in tb.text_frame.paragraphs if p.runs]
for para, val in zip(paras, VALUES):
    para.alignment = PP_ALIGN.LEFT
    for r in para.runs:
        r.font.size = Pt(20)
    if val:
        run(para, val, 20, bold=False, color=RGBColor(0x0B, 0x30, 0x5B))

# ---------- SLIDE 2 — IDEA TITLE --------------------------------------------
title = find(s2, "Title 1")
tr = [r for r in title.text_frame.paragraphs[0].runs]
tr[-1].text = "Disha \u2014 it points, you click, and then it fades"
for r in tr:
    r.font.size = Pt(30)
set_oval(s2)
kill(find(s2, "TextBox 8"))   # its pointers are reproduced verbatim below

tb, tf = textbox(s2, 0.35, 1.20, 12.6, 0.42)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Proposed Solution (Describe your Idea/Solution/Prototype)", 16,
    bold=True, color=HEAD)

LX, LW = 0.35, 7.72
pointer_card(
    s2, LX, 1.66, LW, 1.55,
    "Detailed explanation of the proposed solution",
    [
        "Disha reads the page's own controls and their accessible names, then marks the one next step with a colour-coded dot.",
        ("You click. Disha never can. ", "At an OTP or payment step it pauses and hands control back."),
        ("Every success dims the dot; five clean repetitions remove it entirely.", ""),
        ("Not pre-scripted for any portal", " \u2014 it reads whatever is on screen."),
    ],
    hsize=13, bsize=11.5)

pointer_card(
    s2, LX, 3.30, LW, 1.42,
    "How it addresses the problem",
    [
        ("A citizen who does not know the word ", "withdraw still finishes the task \u2014 and finishes it themselves."),
        "No paid intermediary, no travel, no \u201ccome back next week\u201d.",
        ("Because it points instead of clicking, ", "it is safe on Aadhaar, banking and scholarship portals where an autopilot agent is not."),
    ],
    hsize=13, bsize=11.5)

pointer_card(
    s2, LX, 4.82, LW, 1.45,
    "Innovation and uniqueness of the solution",
    [
        ("Confidence you can see. ", "The dot's colour is not the model's self-report \u2014 the page evidence is scored separately and both must agree."),
        ("It teaches, then leaves. ", "Guidance fades on success, returns after a mistake."),
        ("Zero integration cost. ", "No ministry rebuilds anything."),
    ],
    hsize=13, bsize=11.5)

RX, RW = 8.28, 4.68
videoslot(s2, "01-chain", RX, 1.66, RW)
caption(s2, RX, 1.66 + RW * 9 / 16 + 0.04, RW,
        "Live capture \u2014 four dots, three screens, one goal typed in plain words.")

# the band legend: the product's own three colours, explained once
card(s2, RX, 4.98, RW, 1.34)
tb, tf = textbox(s2, RX + 0.16, 5.04, RW - 0.32, 1.22)
p = tf.paragraphs[0]
nobullet(p)
run(p, "What the colour means", 12, bold=True, color=HEAD)
p.space_after = Pt(4)
for col, lab, txt in ((GREEN, "Green", "model \u2265 0.80 and page \u2265 0.75"),
                      (AMBER, "Amber", "best guess \u2014 check before clicking"),
                      (RED, "Red", "not sure \u2014 verify this one")):
    para = tf.add_paragraph()
    bullet(para, color=col)
    para.space_after = Pt(2)
    run(para, lab + ": ", 10.5, bold=True, color=col)
    run(para, txt, 10.5, color=BODY)

card(s2, 0.35, 6.40, 12.62, 0.45, fill=RGBColor(0xFF, 0xF6, 0xE6),
     line=RGBColor(0xF0, 0xD9, 0xA8))
tb, tf = textbox(s2, 0.52, 6.44, 12.3, 0.38)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Closest shipped product: Microsoft Copilot Vision \u201cHighlights.\u201d ", 10,
    bold=True, color=RGBColor(0x7A, 0x4A, 0x00))
run(p, "We do not claim to have invented on-screen pointing. Ours is the combination "
       "\u2014 exposed confidence, DOM + ARIA grounding, a fading scaffold, and India-specific task packs.",
    10, color=RGBColor(0x5A, 0x3E, 0x0A))

# ---------- SLIDE 3 — TECHNICAL APPROACH ------------------------------------
set_oval(s3)
kill(find(s3, "TextBox 8"))

LX, LW = 0.35, 6.10
pointer_card(
    s3, LX, 1.30, LW, 1.88,
    "Technologies to be used (e.g. programming languages, frameworks, hardware)",
    [
        ("Manifest V3 Chrome extension", ", vanilla JavaScript, no build step."),
        ("Model is pluggable", " \u2014 Gemini free tier, Anthropic, or a local Ollama model with no internet."),
        ("DOM + ARIA", ", not Chrome's accessibility tree \u2014 that needs the debugger permission and breaks on old government markup."),
        ("Vision grounding (GUI-Actor, MIT)", " is the documented fallback."),
    ],
    hsize=11.5, bsize=10.5)

# methodology block, with the pipeline as a monospaced chain
y = 3.30
card(s3, LX, y, LW, 2.30)
dotmark(s3, LX + 0.16, y + 0.185, 0.115, SIH)
tb, tf = textbox(s3, LX + 0.34, y + 0.08, LW - 0.48, 2.14)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Methodology and process for implementation (Flow Charts/Images/ working prototype)",
    11.5, bold=True, color=HEAD)
p.space_after = Pt(5)
p = tf.add_paragraph()
nobullet(p)
p.space_after = Pt(5)
run(p, "page \u2192 enumerate interactive elements + ARIA names \u2192 compact text list "
       "\u2192 model returns {id, confidence} \u2192 on-device grounding score \u2192 colour band "
       "\u2192 draw dot \u2192 human clicks \u2192 wait for the DOM to settle \u2192 next step",
    9.5, color=RGBColor(0x1B, 0x3A, 0x5C), font=MONO)
for lead, rest in (
    ("Green needs 0.80 model ", "and 0.75 page evidence \u2014 two numbers, not one."),
    ("We display the weaker of the two, never the average", " \u2014 so the number can never contradict the colour."),
):
    para = tf.add_paragraph()
    bullet(para, color=SIH)
    para.space_after = Pt(2)
    run(para, lead, 10.5, bold=True, color=BODY)
    run(para, rest, 10.5, color=BODY)

plain_card(
    s3, LX, 5.72, LW, 1.10,
    "Product status",
    [("Working prototype, verified end-to-end in a browser: ",
      "live grounding, colour bands, contingent fading, on-page ask bar, screen share "
      "with a real pause, offline mode. Vision fallback and the live-model green dot are next.")],
    tsize=11.5, bsize=10, fill=RGBColor(0xEC, 0xF6, 0xEE), dot=GREEN)

RX, RW = 6.66, 6.32
AW = 6.00
picture(s3, SHOTS + r"\architecture.png", RX, 1.30, AW)
caption(s3, RX, 1.30 + AW * 9 / 16 + 0.03, RW,
        "Read \u2192 Decide \u2192 Guide, and the boundary nothing crosses: only control names leave the device.",
        h=0.28)

videoslot(s3, "03-navigation", RX, 5.06, 3.20)
caption(s3, RX + 3.34, 5.34, 2.95,
        "Every navigation state in one take \u2014 two arrowheads, then one, then the dot, "
        "then the same going up.", size=9.5)

# ---------- SLIDE 4 — FEASIBILITY AND VIABILITY ------------------------------
set_oval(s4)
kill(find(s4, "TextBox 8"))

LX, LW = 0.35, 7.55
pointer_card(
    s4, LX, 1.30, LW, 1.40,
    "Analysis of the feasibility of the idea",
    [
        ("Technical: ", "built and running today; DOM + ARIA works on portals we do not control."),
        ("Financial: ", "a compact text request per step on a free-tier model; a local model costs zero. Cloud for the next build is already covered \u2014 $1,000 in Microsoft Azure credits through Red Bull Basement 2026."),
        ("Operational: ", "installs as an extension. No ministry integration, no portal changes."),
    ],
    hsize=12.5, bsize=11)

pointer_card(
    s4, LX, 2.78, LW, 1.42,
    "Potential challenges and risks",
    [
        ("Unlabelled / icon-only controls ", "\u2014 our weakest case."),
        ("The model picks the wrong element.", ""),
        ("Trust: ", "users may over-rely on a confident-looking dot."),
        ("Market: ", "Copilot Vision already points at things."),
    ],
    hsize=12.5, bsize=11)

pointer_card(
    s4, LX, 4.28, LW, 1.42,
    "Strategies for overcoming these challenges",
    [
        ("Unlabelled controls drop the page score \u2192 the dot goes red", ", never a silent guess; vision grounding is the fallback."),
        ("A wrong pick costs a glance, not a transaction ", "\u2014 the human always clicks."),
        ("Over-reliance is answered by the fade itself.", ""),
    ],
    hsize=12.5, bsize=11)

plain_card(
    s4, LX, 5.78, LW, 1.06,
    "The measured run",
    [
        ("\u201ci want to take my money out\u201d on our practice portal: ",
         "64% \u2192 57% \u2192 51% red \u2192 75%."),
        ("That run used the offline matcher with no model, ",
         "which is capped below green by design. Accuracy is unmeasured."),
    ],
    tsize=12, bsize=10.5, fill=RGBColor(0xFD, 0xF0, 0xF0), dot=RED)

RX, RW = 8.10, 4.87
videoslot(s4, "02-red-verify", RX, 1.30, RW)
caption(s4, RX, 1.30 + RW * 9 / 16 + 0.03, RW,
        "The near-tie that goes red at 51%, and the card that says why.", h=0.28)
EW = 3.80
picture(s4, SHOTS + r"\explainer-red-case.png", RX + (RW - EW) / 2, 4.45, EW)
caption(s4, RX, 4.45 + EW * 9 / 16 + 0.02, RW,
        "Both numbers, side by side: page 0.815, words 0.763, margin 0.052.",
        align=PP_ALIGN.CENTER, size=8.5, h=0.26)

# ---------- SLIDE 5 — IMPACT AND BENEFITS ------------------------------------
set_oval(s5)
kill(find(s5, "TextBox 8"))

LX, LW = 0.35, 7.40
pointer_card(
    s5, LX, 1.30, LW, 1.48,
    "Potential impact on the target audience",
    [
        ("Positive \u2014 improvement: ", "the citizen completes the task alone instead of paying someone to click."),
        ("New opportunities: ", "a teacher or NGO worker walks a task once and it becomes a pack others reuse."),
        ("Negative \u2014 technology adoption: ", "it needs a browser and a first install."),
    ],
    hsize=12.5, bsize=11)

pointer_card(
    s5, LX, 2.88, LW, 1.68,
    "Benefits of the solution (social, economic, environmental, etc.)",
    [
        ("Social \u2014 improved access, empowerment: ", "independence on services people are already entitled to."),
        ("Economic \u2014 cost: ", "avoids the per-visit intermediary and travel documented in the CSC studies."),
        ("Educational: ", "guidance fades on demonstrated success \u2014 active learning +0.47 SD, "
         "spaced retrieval g = 0.74. Both validate the mechanism, not our product."),
    ],
    hsize=12.5, bsize=11)

# three sourced stat callouts
STATS = [
    ("21%", "of rural Indians aged 15\u201324 can search, email and bank online",
     "MoSPI CAMS 2022\u201323, combined ICT-skill measure"),
    ("11.4%", "of connected households use the internet for government services",
     "NCAER, June 2026"),
    ("1 in 5", "households using digital services depends on help from outside",
     "NCAER, June 2026"),
]
sw = (LW - 0.24) / 3
for i, (big, mid, src) in enumerate(STATS):
    x = LX + i * (sw + 0.12)
    card(s5, x, 4.76, sw, 2.06, fill=RGBColor(0xEF, 0xF4, 0xFA))
    tb, tf = textbox(s5, x + 0.12, 4.82, sw - 0.24, 1.94)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    nobullet(p)
    p.alignment = PP_ALIGN.CENTER
    run(p, big, 26, bold=True, color=SIH)
    p2 = tf.add_paragraph()
    nobullet(p2)
    p2.alignment = PP_ALIGN.CENTER
    run(p2, mid, 9.5, color=BODY)
    p3 = tf.add_paragraph()
    nobullet(p3)
    p3.alignment = PP_ALIGN.CENTER
    p3.space_before = Pt(3)
    run(p3, src, 8, color=MUTED, italic=True)

RX, RW = 7.92, 5.05
videoslot(s5, "04-fade", RX, 1.30, RW)
caption(s5, RX, 1.30 + RW * 9 / 16 + 0.03, RW,
        "The same task three times until the dot is gone \u2014 the education claim, on video.",
        h=0.28)
PW = 3.80
picture(s5, SHOTS + r"\practice-portal.png", RX + (RW - PW) / 2, 4.52, PW)
caption(s5, RX, 4.52 + PW * 9 / 16 + 0.02, RW,
        "Vidya Setu \u2014 the practice sandbox, shaped like a government portal, safe to fail in.",
        align=PP_ALIGN.CENTER, size=8.5, h=0.26)

# ---------- SLIDE 6 — RESEARCH AND REFERENCES --------------------------------
set_oval(s6)
kill(find(s6, "TextBox 8"))

tb, tf = textbox(s6, 0.35, 1.22, 12.6, 0.4)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Details / Links of the reference and research work", 16, bold=True, color=HEAD)

REFS_L = [
    ("MoSPI", ", Comprehensive Annual Modular Survey 2022\u201323 \u2014 the 21% combined ICT-skill figure."),
    ("NSS 78th Round (2020\u201321)", " \u2014 computer literacy 24.7% national, 18.1% rural."),
    ("NCAER", ", The Evolving Landscape of Digital Inclusion in India, June 2026."),
    ("PIB / MeitY", " \u2014 CSC network: 48.54 crore transactions, 5,01,731 centres, FY 2025\u201326."),
    ("IAMAI\u2013Kantar", ", Internet in India 2024 \u00b7 BHASHINI metrics dashboard."),
]
REFS_R = [
    ("Freeman et al., PNAS 2014", " \u2014 active learning, +0.47 SD across 225 studies."),
    ("Adesope et al. 2017", " (retrieval, g = 0.51) \u00b7 ", "Latimier et al. 2021", " (spacing, g = 0.74)."),
    ("Renkl et al.", " \u2014 guidance fading triggered by mastery evidence, not elapsed time."),
    ("Microsoft Copilot Vision release notes", " \u2014 the closest shipped prior art."),
    ("microsoft/GUI-Actor", " (MIT) \u2014 the vision-grounding fallback on our roadmap."),
]


def reflist(x, y, w, h, items):
    card(s6, x, y, w, h)
    tb, tf = textbox(s6, x + 0.18, y + 0.12, w - 0.36, h - 0.24)
    first = True
    for it in items:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        bullet(p, color=SIH)
        p.space_after = Pt(7)
        for i, chunk in enumerate(it):
            run(p, chunk, 11.5, bold=(i % 2 == 0), color=BODY)


reflist(0.35, 1.72, 6.10, 2.30, REFS_L)
reflist(6.87, 1.72, 6.10, 2.30, REFS_R)

# the honest state of the evidence, and the one live link we have
plain_card(
    s6, 0.35, 4.12, 12.62, 1.06,
    "What these sources do and do not say",
    [
        ("The two learning figures validate the mechanism, not our product. ",
         "We have not measured Disha's accuracy, and we do not quote one."),
        ("48.54 crore is a count of transactions, not of citizens; ",
         "21% is a combined ICT-skill measure, not \u201ccannot use a government website\u201d."),
    ],
    tsize=12.5, bsize=11, fill=RGBColor(0xEC, 0xF6, 0xEE), dot=GREEN)

card(s6, 0.35, 5.26, 12.62, 1.58, fill=RGBColor(0xEF, 0xF4, 0xFA))
dotmark(s6, 0.51, 5.445, 0.115, SIH)
tb, tf = textbox(s6, 0.69, 5.34, 12.06, 1.42)
p = tf.paragraphs[0]
nobullet(p)
run(p, "Our own work, and where else this idea has been", 12.5, bold=True, color=HEAD)
p.space_after = Pt(5)
p = tf.add_paragraph()
bullet(p, color=SIH)
p.space_after = Pt(3)
run(p, "github.com/Saurabh0003M/SIH", 12, bold=True, color=SIH)
run(p, " \u2014 the working prototype, the practice portal, the recorded runs, and "
       "ATTRIBUTION.md: every borrowed repository with its licence and commit hash.",
    11, color=BODY)
p = tf.add_paragraph()
bullet(p, color=SIH)
p.space_after = Pt(3)
run(p, "Read-only grounding runs on live public portals ", 11, bold=True, color=BODY)
run(p, "(scholarships.gov.in, swayam.gov.in, aicte-india.org) are recorded in "
       "deck/real-site-run.md \u2014 including the ones Disha got wrong and reported red.",
    11, color=BODY)
p = tf.add_paragraph()
bullet(p, color=SIH)
run(p, "Red Bull Basement 2026: ", 11, bold=True, color=BODY)
run(p, "this idea is in the programme. Participating teams receive $1,000 in Microsoft Azure "
       "credits through Microsoft for Startups \u2014 an application-phase benefit, not a prize.",
    11, color=BODY)

prs.save(OUT)
print("saved", OUT)
