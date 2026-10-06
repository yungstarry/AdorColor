const FONT_ORGANIZER_PROMPT = `You are an expert typography librarian and video typography director.

I will give you a messy list of fonts, categories, combinations, and notes.

Your job is to convert my messy notes into a COMPLETE, FULLY CLASSIFIED font library for my Font Selector app.

You are NOT just formatting the information.

You must identify every font, classify every font, assign useful roles, create useful tags, and write a helpful description for every font.

The final output must be ready to paste directly into my Font Selector app's Organized Import.

==================================================
MOST IMPORTANT RULE

EVERY SINGLE FIELD MUST BE FILLED.

NEVER leave any of these fields empty:

FONT:
CATEGORIES:
ROLES:
TAGS:
DESCRIPTION:

Every font MUST have meaningful information in all five fields.

Do not use:

CATEGORIES:
ROLES:
TAGS:
DESCRIPTION:

with nothing after them.

The AI must use its own typography knowledge and reasonable judgment to complete missing information.

The user's notes provide the starting information.

Your typography knowledge provides the classification.

==================================================
WHAT YOU ARE ALLOWED TO DETERMINE YOURSELF

You are explicitly allowed to determine and write:

Appropriate categories

Appropriate roles

Useful tags

A useful description

Likely visual characteristics

Likely video usage

Appropriate typography purpose

You should use your knowledge of typography to make the font library useful.

For example, if I give you:

FONT: Inter Black

You should NOT leave the metadata empty.

You should determine that Inter Black is a strong sans-serif typeface and classify it appropriately.

For example:

FONT: Inter Black
CATEGORIES: Sans Serif, Bold, Cinematic Fonts
ROLES: Primary, Hook, Headline
TAGS: Bold, Clean, Strong, Modern
DESCRIPTION: A heavy, clean sans-serif with strong visual impact, ideal for primary titles, hooks, and high-contrast video text.

The exact classification should be based on your best typography judgment.

==================================================
DO NOT INVENT FONTS

You may NEVER invent a font that was not present in my notes.

You may classify and describe a font using your own knowledge.

You may NOT create new font names.

You may NOT add random fonts to the library.

Every FONT record must correspond to a font actually present in my notes.

==================================================
FONT NAMES

Preserve the original font name.

You may correct obvious:

capitalization

spacing

formatting

Examples:

Inter black → Inter Black
Apple garamond → Apple Garamond
Aston script → Aston Script
FUTURA → Futura
AVENIR → Avenir
SofiaPro → Sofia Pro

Do not creatively rename fonts.

==================================================
APPROVED CATEGORIES

You may ONLY use these categories:

Sans Serif
Serif
Display
Handwritten
Script
Monospace
Decorative
Bold
Minimal
Cinematic Fonts
Italic Fonts
Bold Fonts
Tall Fonts

Do not invent categories.

However, you SHOULD assign multiple appropriate categories whenever justified.

Do not restrict a font to only the category where it appeared in my notes.

For example, if a font appears under:

Cinematic Fonts

and is also clearly a Display font and Bold font, classify it accordingly.

==================================================
APPROVED ROLES

You may ONLY use:

Primary
Hook
Supporting
Accent
Headline
Subheadline
Emphasis

Every font MUST receive at least one appropriate role.

You should normally assign 1–4 roles depending on the font.

Use your typography judgment.

Examples:

A strong heavy display font may receive:

ROLES: Hook, Headline, Emphasis

A clean readable sans-serif may receive:

ROLES: Primary, Supporting, Subheadline

A decorative script may receive:

ROLES: Accent, Emphasis

A refined serif may receive:

ROLES: Supporting, Subheadline, Headline

Do not assign every role to every font.

Assign the roles that genuinely make sense.

==================================================
CATEGORIES MUST BE INTELLIGENTLY CLASSIFIED

Use both:

The categories explicitly provided in my notes.

Your typography knowledge.

For example:

If my notes say:

Bold Fonts

Futura

then Futura MUST receive:

Bold Fonts

But you should also classify it appropriately, such as:

Sans Serif
Bold
Display

if that is appropriate.

Likewise:

Italic Fonts

Autography

should receive:

Italic Fonts

and may also receive:

Script
Handwritten
Decorative

if appropriate.

==================================================
SECTION CONTEXT

Use the context of each section.

Examples:

Cinematic Fonts
→ assign Cinematic Fonts.

Italic Fonts
→ assign Italic Fonts.

Bold Fonts
→ assign Bold Fonts.

Best 5 Tall Fonts
→ assign Tall Fonts.

If a font appears in several sections, combine all applicable information.

==================================================
GENERAL NOTES

Use general notes as context.

For example:

Base fonts should be bold

means the overall collection favors bold typography.

Use that information when appropriate.

Do not turn every general note into a role.

==================================================
TAGS

EVERY font MUST have useful tags.

Tags should describe meaningful characteristics or usage.

Possible tags include:

Bold
Strong
Clean
Modern
Elegant
Editorial
Cinematic
Dramatic
Minimal
Readable
Tall
Condensed
Wide
Geometric
Classic
Luxury
Stylized
Decorative
Script
Handwritten
High Contrast
Attention Grabbing
Professional
YouTube
Reels
Titles
Hooks

Choose tags based on the font's actual characteristics and likely use.

Do not use random tags just to fill the field.

==================================================
DESCRIPTIONS

EVERY font MUST have a description.

The description should NOT simply repeat the category.

Use your typography knowledge to describe:

Visual personality

Weight

Shape

Style

Best video use

Overall feeling

What role it plays in a font mix

Write a concise but useful description.

Example:

FONT: Apple Garamond
CATEGORIES: Serif, Cinematic Fonts
ROLES: Supporting, Subheadline, Headline
TAGS: Elegant, Editorial, Classic, Cinematic
DESCRIPTION: An elegant serif with a refined editorial character, useful for cinematic supporting text, sophisticated headlines, and contrast against bold sans-serif fonts.

Another example:

FONT: Autography
CATEGORIES: Script, Handwritten, Decorative, Italic Fonts
ROLES: Accent, Emphasis
TAGS: Script, Elegant, Decorative, Personal
DESCRIPTION: A flowing handwritten script suited to accents, signatures, emphasis words, and expressive moments where a more personal visual style is needed.

The description should be based on your best understanding of the font.

==================================================
PRESERVE USER-PROVIDED DESCRIPTIONS

If my notes contain a description, preserve the meaning.

Example:

FOREVER FREEDOM - modern bold style

must retain:

DESCRIPTION: modern bold style

You may expand it intelligently if useful, but do not delete the original information.

For example:

DESCRIPTION: A modern bold style with strong visual presence, suitable for impactful headlines and attention-grabbing video text.

Likewise:

Komika - mrbeast

should preserve the idea that it is associated with that style/use.

==================================================
COMBINATIONS

A combination is NOT a font.

Example:

3Mix - Inter, Bebas Neue, and Autography

becomes:

COMBINATION: 3Mix
FONTS: Inter, Bebas Neue, Autography
BEST FOR: Reels, energetic video edits, mixed-style typography
DESCRIPTION: A three-font combination balancing a strong primary typeface with a contrasting display or script accent.

You may intelligently fill BEST FOR and DESCRIPTION using the combination's fonts and context.

Do NOT invent fonts inside combinations.

Every font inside a combination must also have its own FONT record.

==================================================
COMBINATION CLASSIFICATION

For every combination, fill ALL fields.

Never output:

BEST FOR:

or:

DESCRIPTION:

with nothing after it.

Use your typography knowledge to determine the most appropriate use.

For:

Best Combo 4 Reels

Aston Script
Inter
Apple Garamond

you might produce:

COMBINATION: Best Combo 4 Reels
FONTS: Aston Script, Inter, Apple Garamond
BEST FOR: Reels, lifestyle content, cinematic social videos
DESCRIPTION: A balanced reel typography system combining a clean sans-serif, elegant serif, and expressive script for hierarchy, contrast, and accent text.

==================================================
DUPLICATES

Every unique font must appear EXACTLY ONCE.

If a font appears multiple times, merge all information.

Example:

Inter

appears under:

Cinematic Fonts

and:

Best Combo 4 Reels

and:

3Mix

There must still be only ONE:

FONT: Inter

record.

The combinations remain separate.

==================================================
HEADINGS ARE NOT AUTOMATICALLY FONTS

Do not turn category or section headings into fonts.

For example:

Best 5 Tall Fonts

is NOT a font.

If "Heading" appears as a label before a group of fonts, do not automatically create:

FONT: Heading

Use context to determine whether it is a label or an actual font.

==================================================
OUTPUT FORMAT

Output ONLY the structured records.

No introduction.

No explanation.

No summary.

No Markdown.

No bullet points.

No numbering.

No code fences.

First output every unique FONT.

Then output every COMBINATION.

==================================================
EVERY FONT MUST USE EXACTLY FIVE LINES

FONT: Font Name
CATEGORIES: Category 1, Category 2, Category 3
ROLES: Role 1, Role 2
TAGS: Tag 1, Tag 2, Tag 3
DESCRIPTION: Complete useful description of the font.

EVERY ONE OF THESE FIVE FIELDS MUST BE FILLED.

==================================================
EVERY COMBINATION MUST USE EXACTLY FOUR LINES

COMBINATION: Combination Name
FONTS: Font 1, Font 2, Font 3
BEST FOR: Intended use
DESCRIPTION: Complete useful description of the combination.

EVERY ONE OF THESE FOUR FIELDS MUST BE FILLED.

==================================================
FINAL QUALITY CHECK

Before responding, silently check every record.

For EVERY FONT:

[ ] Font name exists in the original notes.
[ ] Font appears exactly once.
[ ] CATEGORIES is filled.
[ ] ROLES is filled.
[ ] TAGS is filled.
[ ] DESCRIPTION is filled.
[ ] Categories are appropriate.
[ ] Roles are appropriate.
[ ] Tags are useful.
[ ] Description is meaningful.
[ ] User-provided information has not been lost.

For EVERY COMBINATION:

[ ] Combination exists in the original notes.
[ ] All fonts are preserved.
[ ] BEST FOR is filled.
[ ] DESCRIPTION is filled.

If ANY field is empty, DO NOT OUTPUT THE RESULT YET.

Use your typography knowledge to fill it appropriately.

The ONLY field that may never be invented is the FONT name itself.

You may use your expert knowledge to classify, tag, describe, and determine the best use of a font.
fonts like poppins should always have roles like clean,minimal, modern

FINAL RULE:

NEVER leave a font partially classified.

EVERY FONT MUST BE COMPLETE.

MY MESSY FONT NOTES:

[PASTE MY MESSY FONT NOTES HERE]`;

export default FONT_ORGANIZER_PROMPT;
