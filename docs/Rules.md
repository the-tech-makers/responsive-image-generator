# Responsive Image Tool — Project Rules

These rules are mandatory project constraints.

## 1. Scope Rules

### 1.1 Internal Application

This application is an internal team tool.

Do not design V1 as:

- A public SaaS.
- A commercial service.
- A WordPress plugin.
- A browser extension.
- A public image-processing API.

### 1.2 No Unrequested Features

Do not introduce features simply because they might be useful.

A feature must either:

1. Solve the original image-processing workflow, or
2. Be explicitly approved before implementation.

## 2. Architecture Rules

### 2.1 Frontend

Use:

- React.
- Tailwind CSS.
- Vite.

Do not introduce Next.js, Redux, Zustand, React Query, or other state-management frameworks unless a real project requirement makes one necessary.

React state and small reusable hooks are sufficient for V1.

### 2.2 Backend

Use:

- Node.js 20.
- Native Node.js `http` module.

Do not introduce Express, Fastify, NestJS or another backend framework unless the architecture is explicitly reconsidered.

### 2.3 Image Processing

Use Sharp/libvips.

Do not implement image resizing, encoding or compression algorithms manually.

## 3. Dependency Rules

Dependencies must be kept minimal.

Before adding a package, ask:

1. Can Node.js provide this functionality natively?
2. Can the browser provide this functionality natively?
3. Is the dependency genuinely reducing complexity?
4. Does it introduce significant maintenance overhead?

Do not add a dependency merely for convenience.

## 4. File Size Rules

### 4.1 Maximum File Size

Application source files should generally remain between **200–300 lines maximum**.

This is a guideline for maintainability and a hard warning threshold.

If a file approaches 300 lines, consider splitting it.

### 4.2 Group Related Logic

Do not create dozens of tiny files for trivial functions.

Closely related functionality should remain together.

The goal is:

**Logical grouping without creating monolithic files.**

### 4.3 Avoid Both Extremes

Do not create:

- One enormous file containing the whole application.
- Hundreds of microscopic files containing single functions.

Use meaningful module boundaries.

## 5. Frontend Rules

### 5.1 Component Philosophy

Create components around meaningful UI responsibilities.

Good examples:

- DropZone.
- ImageList.
- ImageCard.
- OutputSettings.
- HtmlSettings.
- ProcessingStatus.
- ResultsPanel.

Avoid creating components for insignificant fragments such as individual labels or simple wrappers.

### 5.2 State

Keep state as local as possible.

Do not introduce global state management unless necessary.

### 5.3 API Communication

API calls should be centralized through a small frontend API utility rather than duplicated throughout components.

## 6. Image Processing Rules

### 6.1 No Upscaling

When enabled, an image must never be enlarged beyond its original dimensions.

### 6.2 Aspect Ratio

Image aspect ratio must be preserved unless an explicitly approved feature introduces cropping.

V1 does not include automatic cropping.

### 6.3 Original Files

Original uploads must remain untouched.

Generated variants are separate files.

### 6.4 Metadata

Metadata removal must be explicit in the processing configuration.

When enabled, unnecessary metadata should be removed, with special attention to EXIF/GPS information.

## 7. HTML Rules

### 7.1 Alt Text

Manual alt text is supported.

If the user leaves alt text empty:

```html
alt=""
```

must be generated.

The application must not invent alt text.

### 7.2 Responsive Markup

`srcset` must be generated from the actual files successfully produced by the processor.

The HTML generator must never reference a file that does not exist.

### 7.3 Dimensions

Width and height should be included by default when available.

### 7.4 Loading

Default:

```
loading="lazy"
```

### 7.5 Decoding

Default:

```
decoding="async"
```

### 7.6 Fetch Priority

Default:

```
fetchpriority="auto"
```

Users may change this.

## 8. Temporary Storage Rules

Uploaded/generated files are temporary.

Never treat the session storage directory as permanent application storage.

Each session must have isolated storage.

The application must not allow a client to specify arbitrary filesystem paths.

## 9. Session Rules

V1 does not require user accounts.

A temporary anonymous session is sufficient.

Each session must have:

- Unique session identifier.
- Creation timestamp.
- Last activity timestamp.
- Expiration information.

Initial inactivity expiration:

**12 hours.**

## 10. Cleanup Rules

Cleanup must be automated.

The application must periodically check for expired sessions.

Target cleanup interval:

**30–60 minutes.**

Cleanup must safely handle:

- Missing directories.
- Already-deleted files.
- Interrupted processing.
- Old abandoned sessions.

Cleanup errors must not crash the main application.

## 11. Security Rules

Even though the application is internal:

- Validate uploaded file types.
- Validate file sizes.
- Do not trust client-provided filenames.
- Sanitize filenames.
- Prevent path traversal.
- Never expose session storage directly.
- Never expose `.env`.
- Never allow arbitrary server filesystem paths from the browser.

If the application becomes publicly accessible, authentication or access restrictions must be evaluated before exposing it.

## 12. Performance Rules

Do not process an unlimited number of images simultaneously.

Image processing must use controlled concurrency.

The application should be designed around the available server resources:

- 6 CPU cores.
- Approximately 6 GB RAM.

Processing concurrency should be configurable if necessary.

Large batch uploads must not cause uncontrolled memory consumption.

## 13. UI Rules

The application should feel like a professional internal developer tool.

Priorities:

1. Clear.
2. Fast.
3. Compact.
4. Easy to scan.
5. Minimal unnecessary decoration.
6. Strong visual hierarchy.

Do not create excessively long forms.

Related options should be grouped into logical sections.

## 14. No Presets in V1

Do not implement:

- Project presets.
- Saved configurations.
- User profiles.
- Favorite settings.

These may be considered later.

## 15. No AI Features in V1

Do not implement:

- AI-generated alt text.
- AI image analysis.
- AI naming.
- AI optimization recommendations.

Alt text is manually entered by the user.

## 16. No Database in V1

Do not introduce a database.

Temporary session information should be handled through the filesystem.

## 17. No Authentication in V1

Do not build login/register functionality.

Authentication can be added later if deployment requirements change.

## 18. No Code Before Approval

Before implementing application code:

1. Project documentation must be reviewed.
2. Architecture must be approved.
3. UI/design must be approved.
4. Tasks must be agreed upon.

These markdown documents are the project source of truth.

If a later request conflicts with these rules, the conflict must be identified before implementation.

## 19. Change Control

Do not silently change architecture or requirements.

If implementation reveals a genuine reason to change:

1. Explain the problem.
2. Explain the proposed change.
3. Identify which project rule is affected.
4. Wait for approval before making the architectural change.

## 20. Definition of Done

A feature is not considered complete merely because the code exists.

A feature is complete only when:

- Implemented.
- Tested.
- Acceptance test passes.
- No known regression is introduced.
- Relevant documentation is updated.
- The task can be moved to `Completed.md`.
