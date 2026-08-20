---
name: gc-muted-zine-poster-v0-1
description: Generate Muted Zine Poster v0.1 poetic paper-poster prompts and the matching generated image. Use when the user gives a theme, sentence, object, mood, article idea, photo, or content brief and wants a quiet Japanese/Korean zine-like editorial poster with large negative space, aged paper texture, experimental typography, and a restrained muted palette without high-chroma color blocks. This is the low-saturation sibling of gc-minimal-zine-poster-v0-1.
---

# Muted Zine Poster v0.1

Turn the user's content into both:

1. a final image-generation prompt, and
2. a generated raster image made from that prompt.

## Mode Policy

Use **Standard Mode** for all generation. Use the Standard Mode Prompt Compiler in this `SKILL.md` to convert the user's content into a compact, imageable, high-fidelity prompt. If the user asks for higher quality, strengthen the prompt using the rules below.

## Standard Mode Prompt Compiler

Default generation should compile only the parts that become pixels in the final image prompt.

### Visual Rules Used by the Prompt Compiler

Use these rule groups as prompt material:

- **风格总述:** use only the visual identity and anti-identity: poetic minimal paper poster, huge negative space, old paper, tiny anchor, sparse type, muted grayscale or near-monochrome palette, zine/editorial mood.
- **核心视觉规则:** use the concrete renderable rules for canvas, composition, background, image anchor, typography, color, texture, lighting, and mood.
- **稳定共性:** use as non-negotiable must-haves: vertical 3:5 paper canvas, small cluster, scanned-paper view, old print defects, serif/typewriter text, and a restrained muted palette with no high-chroma anchor.
- **可替换变量:** use as slot choices: object, photo/cutout/silhouette/block type, text line, date/weather, position, paper tone, optional pale wash color.
- **反向约束:** use as negative prompt material.
- **Prompt 结构模板:** use its field order, not its sample wording.

Do not use these as default prompt material:

- source path, sample count, README/metadata notes, or analysis scope
- long explanatory prose about why the style works
- sample-specific signatures, dates, captions, objects, or text
- example prompts as text to imitate line by line
- checklist phrasing unless it becomes a concrete visual constraint

### First-Principles Prompt Fields

Every Standard Mode prompt must answer these rendering questions in this order:

1. **Canvas:** What is the output frame and base surface?
   - tall vertical 3:5 phone-poster; full-frame aged paper; no border, no mockup.

2. **Attention Geometry:** Where does the eye go and how much is empty?
   - 70%-90% plain paper; one visual cluster occupying about 8%-25%; placed center, upper-middle, lower-middle, lower-left, or upper-right; no edge-hugging.

3. **Image Anchor:** What is the one imageable subject?
   - convert the user's theme into one object, fragment, photo crop, specimen, cutout, silhouette, old printed illustration, texture window, or small conceptual relation.

4. **Anchor Treatment:** What material process makes the anchor belong to paper?
   - grayscale photos and paper fragments may use low contrast, photocopy softness, torn edge, softened edge, halftone, scanline, risograph grain, xerox wear, ink bleed, or slight misregistration. The entire image stays muted; do not introduce a high-chroma anchor.

5. **Typography System:** How does text behave visually?
   - small serif/typewriter/monospaced type; one short readable phrase; optional tiny date/location/weather and signature; semi-legible microtext or fragmented letters; text can drift, press against the image edge, blur, misregister, repeat in a line, or run vertically.

6. **Color Logic:** What is the restrained muted strategy?
   - Paper tones plus gray/black ink dominate. At most one very pale wash is allowed (light beige, pale yellow, faint blue-gray, soft gray-green) and it should read as a tinted paper strip, diagonal band, or diluted photo region rather than a color block. Avoid `cobalt`, `ultramarine`, `vivid`, `saturated`, `high-chroma`, or any strong accent. Do not describe the image as `near-monochrome` if there is a pale wash; say `muted palette with a pale [color] wash` instead.

7. **Reproduction Texture:** What print/scanning process defines the whole image?
   - flat orthographic scanned-paper appearance; matte absorbent paper; diffuse light; low-to-medium contrast; no hard shadow; no 3D depth.

8. **Emotional Temperature:** What should the viewer feel before identifying the object?
   - quiet, poetic, nostalgic, sparse, diary-like, archival, distant, memory-like, Japanese/Korean indie zine or minimal editorial.

9. **Hard Avoids:** What must not appear?
   - full-bleed scene, commercial headline, product ad, logo/CTA, glossy mockup, clean UI white, cinematic lighting, 3D, neon, cute cartoon, fashion editorial drama, dense scrapbook, too many colors, long clean text, any high-chroma color block.

### Muted Color Engine

This section defines the color strategy for Standard Mode.

- Default to a muted grayscale or near-monochrome palette. Use wording such as `grayscale scanned photo`, `low-contrast black ink`, `muted gray-green wash`, or `pale yellow paper band`.
- The paper, photo, microtext, and secondary marks should all stay subdued. Any pale wash should cover roughly 0.5%-3% of the canvas and remain visibly desaturated even at thumbnail size.
- Prefer a colored paper strip, diagonal band, or diluted photo region over a solid colored object. A pale wash should feel like aged paper or faded ink, not like a design accent.
- Do not use `fully saturated`, `opaque`, `vivid`, `high-chroma`, `cobalt`, `ultramarine`, `tomato-red`, `pear-green`, or similar strong-color wording.
- Do not use `near-monochrome`, `no strong accent`, `pale accent`, `muted accent`, `faded accent`, or `pastel accent` to weaken the whole image; apply `low contrast` and `muted grayscale` only to the ink and photo treatment, and use `pale [color] wash` only when a wash is actually present.
- Use only one pale wash hue per image. A tiny secondary neutral tone is allowed only when it supports the paper texture.

### Standard Prompt Shape

Write the final Standard Mode prompt as four compact paragraphs:

1. canvas + paper + negative space + cluster size/location
2. subject metaphor + anchor type + anchor treatment
3. typography + muted color strategy + print defects
4. flat scan mood + avoid-list

In paragraph 3, state the exact muted treatment and, if present, the pale wash hue and its material form. This structure is more important than reciting every rule. Prefer a concrete, imageable prompt over a long style essay.

## Variation Engine

Before writing the prompt, choose one option from each axis. Randomness must change visual grammar, not only position. If recent outputs used the same layout or anchor, choose a different one.

### Layout Family

- **center-fragment:** tiny central image or object with surrounding air
- **lower-left-float:** small anchor in the lower-left quadrant, lots of empty top space
- **upper-right-block:** small photo/text block in the upper-right with loose text drift
- **dual-panel:** two small overlapping or adjacent panels with a narrow gap
- **irregular-cutout:** torn or organic paper shape carrying image or type
- **type-led:** typography is the main visual anchor, image secondary or absent
- **dot-orbit:** dots, letters, or hairline create an orbit around a small subject
- **single-specimen:** one isolated object or mark with almost no support graphics

### Image Anchor

- tiny faded photo
- torn-paper clipping
- flat silhouette
- old printed illustration
- object specimen
- translucent geometric overlay
- abstract texture window
- grayscale photo strip

### Typography Mode

- fragmented floating letters
- short phrase pressed against image edge
- archive microtext with date/weather
- diagonal scattered words
- low-contrast gray ghost text
- headline-as-object with rough letterpress
- text inside a paper strip or cutout
- repeated text line running horizontally or vertically
- almost textless, only a tiny caption

### Texture Mode

- xerox softness
- risograph grain
- letterpress ink bleed
- halftone degradation
- film grain photo
- scan noise and paper fibers
- aged paper mottling
- soft motion blur on selected text

### Mood Mode

- quiet
- summer
- solitude
- childhood
- seaside
- afternoon
- night
- memory
- slight surrealism

## Workflow

1. Determine mode.
   - Use Standard Mode.

2. Parse the user's content.
   - Identify the core subject, mood, exact text if supplied, possible visual metaphor, and any reference image role.
   - For an article or complex idea, extract one central imageable idea rather than summarizing the whole argument.
   - If no image text is supplied, invent one short poetic English or Chinese phrase.

3. Select a variation recipe.
   - In Standard Mode, pick layout, image anchor, typography, texture, and mood from the Variation Engine, then choose muted color treatment through the Muted Color Engine. Do not select `high-chroma` or `saturated` options.
   - Do not default to "tiny photo + gray text + no color" unless it truly fits.
   - If the recipe becomes too dense, simplify typography or color treatment first.

4. Write the final image prompt.
   - In Standard Mode, use the Standard Mode Prompt Compiler to compile the user's content into the four-paragraph prompt shape: canvas, anchor, typography/muted-color/print, flat-scan mood and avoid-list.
   - Specify exact in-image text only when useful. Keep it short because image models distort long text.
   - Make the prompt decisive: say where the anchor sits, how large it is, how text behaves, what muted treatment appears, and how the print/scan texture looks.

5. Generate the image.
   - Use the built-in image generation capability by default.
   - Do not stop after prompt-only unless the user explicitly asks for prompt-only.
   - If the result obviously violates the selected mode or recipe, tighten the prompt and regenerate once.
   - In Standard Mode, inspect the result at thumbnail scale. If a high-chroma anchor appears or the palette becomes too colorful, regenerate once with stronger muted wording and no color-block phrasing.

6. Return the image and prompt.

## Negative Constraints

Always avoid:

- full-bleed subject or scene
- commercial poster headline hierarchy
- product ad layout, logo lockup, CTA, or brand campaign feeling
- clean digital UI background
- glossy paper mockup or heavy paper shadow
- 3D rendering, cinematic lighting, hard shadows, depth of field, neon, cyberpunk
- cute cartoon, kawaii illustration, anime poster, fashion editorial drama
- too many objects, stickers, colors, captions, or decorative textures
- high-resolution stock-photo realism
- long, clean, perfectly readable text blocks
- any high-chroma or strongly saturated color block

## Output Format

````markdown
**生成图**

![Muted Zine Poster v0.1 style poster](absolute-image-path-or-rendered-image)

**最终 Prompt**

```text
[final prompt used for image generation]
```

**说明**

- Mode: Standard
- Recipe: [layout / anchor / typography / muted-color / texture / mood]
- [one short note about the content interpretation]
````

If generated images render directly without a file path, show the image normally and still include the final prompt.

## Quality Gate

Before finalizing, check:

- Did the run use the Standard Mode Prompt Compiler?
- Did the run choose a variation recipe across layout, anchor, typography, muted color, texture, and mood?
- Is the structure materially different from recent visible outputs?
- Does the image remain a sparse vertical paper poster?
- Does 70%-90% of the poster read as paper?
- Is the subject cluster roughly 8%-25% of the canvas?
- Is there one clear visual metaphor rather than a whole illustrated scene?
- Does the anchor have old-photo, clipping, print, scan, or paper-specimen treatment?
- Are typography and microtext part of the composition?
- Is there only one restrained muted color strategy?
- In Standard Mode, is the palette clearly muted with no high-chroma block?
- In Standard Mode, does any pale wash stay desaturated and occupy about 0.5%-3% of the canvas?
- In Standard Mode, did the prompt avoid `saturated`, `vivid`, `high-chroma`, `cobalt`, `ultramarine`, and similar strong-color wording?
- Did the prompt avoid full-bleed, commercial, 3D, neon, cinematic, cartoon, cute, brand, and generic template aesthetics?
- Did you actually generate the image?

## Example Requests

- "用 $gc-muted-zine-poster-v0-1 做一张关于雨天的图"
- "用 $gc-muted-zine-poster-v0-1 标准模式，做一张关于旧书的图"
- "用这张照片做一张同风格 poster"
