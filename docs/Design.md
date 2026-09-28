# Responsive Image Generator — Design Guide

This document defines the visual language and UI structure for the application.

## 1. Design Direction

The application should have a:

**Modern developer-tool / professional utility** aesthetic.

It should feel:

- Clean.
- Technical.
- Reliable.
- Efficient.
- Lightweight.

Avoid:

- Excessive gradients.
- Decorative illustrations.
- Large marketing-style hero sections.
- Excessive animation.
- Unnecessary cards.
- Excessive rounded elements.
- Visual clutter.

The application is a working tool, not a marketing website.

## 2. Color System

Use a neutral interface with a blue primary action color.

### Primary

```
Primary:        #2563EB
Primary Hover:  #1D4ED8
Primary Soft:   #EFF6FF
```

### Neutral

```
Background:     #F8FAFC
Surface:        #FFFFFF
Border:         #E2E8F0
Border Strong:  #CBD5E1

Text Primary:   #0F172A
Text Secondary: #475569
Text Muted:     #64748B
```

### Status

```
Success:        #16A34A
Success Soft:   #F0FDF4

Warning:        #D97706
Warning Soft:   #FFFBEB

Error:          #DC2626
Error Soft:     #FEF2F2

Info:           #0284C7
Info Soft:      #F0F9FF
```

These colors should be centralized through the Tailwind theme rather than repeatedly hard-coded throughout components.

## 3. Typography

Primary font:

**Inter**

Fallback:

```
system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Typography should prioritize readability rather than visual experimentation.

Suggested hierarchy:

- Application title: 20–24px, weight 600.
- Section title: 15–18px, weight 600.
- Body: 14px.
- Secondary text: 12–13px.
- File metadata: 12px.
- Buttons: 13–14px, medium weight.

## 4. Layout

Desktop application layout:

```
┌──────────────────────────────────────────────────────────────┐
│ Header                                                       │
├──────────────────────────────────────────────────────────────┤
│ Upload / Image Queue                                        │
├──────────────────────────────────────────────────────────────┤
│ Processing Settings                                         │
├──────────────────────────────────────────────────────────────┤
│ HTML Settings                                                │
├──────────────────────────────────────────────────────────────┤
│ Process Images                                               │
├──────────────────────────────────────────────────────────────┤
│ Results                                                      │
└──────────────────────────────────────────────────────────────┘
```

The exact arrangement may use a two-column desktop layout where useful.

The UI should remain comfortable on laptop screens.

## 5. Header

The header should contain:

- Application name.
- Short description or utility label.
- Optional session information.

Example conceptual title:

**Responsive Image Generator**

Subtitle:

**Resize · Compress · Convert · Generate HTML**

The header should remain compact.

## 6. Upload Area

The upload area should be immediately understandable.

Support:

- Drag and drop.
- File picker.
- Multiple files.

The drop zone should visually communicate:

- Upload action.
- Supported formats.
- Multiple-file capability.

Do not make the drop zone unnecessarily tall.

## 7. Image Queue

Each uploaded image should display:

- Thumbnail.
- Filename.
- Dimensions.
- Original file size.
- Remove action.
- Processing status when applicable.

The queue should support multiple images without becoming visually overwhelming.

For many images, use a compact list/grid rather than oversized cards.

## 8. Settings

Settings should be grouped into logical sections.

### Output Sizes

Display predefined widths as selectable chips/buttons.

Example:

```
[480] [768] [1024] [1280] [1440] [1920] [+ Custom]
```

Selected values should have a clear active state.

### Formats

Use selectable controls:

```
☑ WebP
☑ AVIF
☐ JPEG
☐ PNG
```

### Compression

Provide:

```
Lossy
Lossless
```

When lossy is selected, show quality control.

### Metadata

Provide a clear option:

```
☑ Strip metadata
```

If appropriate, explain that this can remove EXIF/GPS information.

## 9. HTML Settings

HTML settings should be visually separate from image-processing settings.

Controls:

- Output type.
- Alt text.
- `sizes`.
- Loading.
- Decoding.
- Fetch priority.
- Include dimensions.
- Include `srcset`.
- Include `sizes`.

Output types:

```
<img>
<picture>
```

The interface should explain advanced options only when necessary.

## 10. Results

Results should clearly communicate success.

Each processed image should show:

- Generated variants.
- Format.
- Dimensions.
- File size.
- Reduction compared with source where applicable.

Provide actions:

- Copy HTML.
- Download file.
- Download all.
- Download ZIP.

The generated HTML should be displayed in a code-style container with a clear copy button.

## 11. Progress

Processing should never appear frozen.

Display:

- Overall progress.
- Current image.
- Processing state.
- Completion state.

Example:

```
Processing 4 of 12 images
██████████████░░░░░░  67%
```

Avoid excessive animation.

## 12. Empty States

The initial state should be simple.

Example conceptual message:

**Drop images here**

or

**Upload images to get started**

Provide a secondary action:

**Browse files**

## 13. Error States

Errors should be:

- Specific.
- Understandable.
- Recoverable when possible.

Avoid technical stack traces in the UI.

For example, instead of:

```
ENOENT: syscall open...
```

show:

**Unable to process this image. Please try uploading it again.**

Detailed errors may be logged server-side.

## 14. Responsive Design

The application must support:

- Desktop.
- Laptop.
- Tablet.
- Mobile where practical.

Desktop is the primary environment because this is an internal developer tool.

At smaller widths:

- Columns should collapse.
- Settings should stack.
- Image metadata should wrap gracefully.
- Buttons should remain usable.
- No horizontal scrolling should be required.

## 15. Spacing

Use a consistent spacing scale based on Tailwind's spacing system.

Avoid arbitrary values unless there is a strong visual reason.

Prefer:

```
p-4
p-5
p-6
gap-3
gap-4
gap-6
```

rather than excessive one-off values.

## 16. Borders and Radius

Use subtle borders.

Default:

```
border: #E2E8F0
```

Suggested radius:

- Inputs: `rounded-md`
- Buttons: `rounded-md`
- Cards/panels: `rounded-lg`
- Drop zone: `rounded-lg`

Avoid making every element heavily rounded.

## 17. Shadows

Use shadows sparingly.

The application should primarily use:

- Borders.
- Background contrast.
- Spacing.

rather than large shadows.

## 18. Icons

Use a consistent icon library if an icon library is eventually approved.

Do not mix unrelated icon styles.

Icons should support the interface rather than replace text where clarity matters.

## 19. Accessibility

Interactive elements must have:

- Visible focus state.
- Appropriate labels.
- Keyboard accessibility.
- Sufficient contrast.
- Useful button text.

Do not rely solely on color to communicate status.

## 20. Animation

Animation should be minimal.

Acceptable:

- Progress transitions.
- Button loading state.
- Drop-zone state changes.
- Small success feedback.

Avoid:

- Page transitions.
- Decorative animations.
- Large motion effects.

The tool should feel fast.

## 21. Visual Priority

The primary action should always be obvious:

**Process Images**

Secondary actions:

- Add images.
- Remove.
- Copy HTML.
- Download.

The UI must not visually compete with the main processing workflow.

## 22. Design Principle

Every UI element should answer one of these questions:

1. What do I upload?
2. What will happen to my images?
3. What settings am I using?
4. What has been generated?
5. How do I get the result?

If an element does not contribute to these questions, it should be questioned before being added.
