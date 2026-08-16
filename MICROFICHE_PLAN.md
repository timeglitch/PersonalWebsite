# Microfiche Project Viewer Plan

Status: planned, not implemented.

Baseline commit: `f55dab3` (`Finalize portfolio layout before microfiche viewer`)

## Current site direction

- Desktop uses a full-height two-column layout.
- The left column contains Frank's name, description, external links, and project list.
- The right column is reserved for the project viewer.
- Mobile intentionally uses a separate stacked project layout and will not use the draggable microfiche viewer.
- The visual language is editorial, typed, warm, and influenced by 1970s–80s print and hospitality design.
- Microfilm effects should remain confined to the viewer. Do not add a global aging or noise filter.
- Sound defaults to on above the 900px desktop breakpoint and off at 900px and below. It remains manually toggleable.

## Chosen viewer concept

Build the viewer as a large indexed microfiche contact sheet rather than a sequence of interchangeable cards.

Projects will be distributed across a two-dimensional sheet at different coordinates. Each project occupies a cluster of related cells. Moving between projects pans and zooms the viewing lens across the sheet, allowing intervening material to pass through the viewport.

This combines:

- Microfiche-style contact-sheet composition.
- Microfilm-inspired transport movement and sound.
- Newspaper clippings, business cards, technical records, and other project-specific printed artifacts.

Avoid cinema-film clichés such as sprocket holes, constant scratches, heavy flicker, or a permanent sepia overlay.

## Navigation and interaction

### Primary navigation

- Clicking a project in the left column animates the sheet to that project's cluster.
- Hovering a project should only highlight its destination; it should not trigger a long pan.
- The left project list always reflects the project currently centered in the viewer.
- Vocalize is the initial centered project.

### Direct manipulation

- Users can drag the contact sheet with a `grab` / `grabbing` cursor.
- Dragging has restrained inertia and soft resistance at the finite sheet boundaries.
- Releasing the sheet centers it on the nearest project cluster.
- Snapping also updates the active project in the left column.
- Do not implement infinite wrapping.
- A small amount of pointer-following lens movement is acceptable if it remains subtle.

### Click versus drag

- Movement of approximately 6–8 pixels or more counts as a drag.
- A click or tap without meaningful movement activates the centered website clipping.
- The primary website capture includes a visible `Open live site ↗` action.
- Public project links open in a new tab using normal anchor links.
- Clicking a smaller surrounding artifact centers its associated project rather than navigating away.
- The private Asset System GUI displays `Private project / documentation on request` and has no external link.

### Wheel and keyboard

- Wheel or trackpad input over the viewer may scrub through nearby cells, then snap to the nearest project.
- Arrow keys navigate between projects.
- Enter opens the active public project.
- Reduced-motion mode replaces extended pans with a short fade and snap.

## Contact-sheet content

Use material from Frank's actual projects wherever possible. Do not fill the sheet with unrelated vintage stock imagery.

Each public project should initially receive a cluster of approximately three or four cells:

1. A cover card with project name, dates, and archive coordinates.
2. A recognizable website capture.
3. A newspaper-style description clipping.
4. A project-specific technical or contextual artifact where useful.

Add approximately twelve transitional artifacts across the sheet. These should be derived from real project details or serve a clear archival/indexing purpose.

Possible cell types include:

- Full or partial website screenshots.
- Interface details and navigation crops.
- Code fragments.
- Development timestamps and concise notes.
- Maps, parking records, and availability data.
- Satellite coordinates, telemetry, and map fragments.
- Audio waveforms and phonetic diagrams.
- Concert-program or arts-listing fragments.
- Technical labels, reference cards, test patterns, and archive dividers.

## Project-specific direction

### Vocalize

- Language-lab worksheet or instructional leaflet.
- Actual application capture.
- Phonetic notation, vowel diagram, or waveform fragment.
- React, TypeScript, and audio-processing metadata.

### SJSU Parking Tracker

- Municipal parking notice, receipt, or small traffic report.
- Actual dashboard capture.
- Availability data, map fragment, or timestamped status record.

### Satellite Tracker

- Scientific observation plate or telemetry report.
- Actual three-dimensional visualization capture.
- Coordinates, EONET wildfire data, or orbital/map fragment.

### San Francisco Balalaika Ensemble

- Concert program, arts-section clipping, or performance notice.
- Actual website capture.
- Performance date, repertoire fragment, or ensemble detail.

### Asset System GUI

- Equipment inventory card, technical log, or institutional form.
- Treat as a restricted/private archive until screenshots are supplied.
- Later replace the temporary treatment with user-provided interface captures.

## Website capture strategy

Capture the public sites directly and save the resulting images locally. Do not rely on live iframes; several project sites prevent embedding, and local captures provide stable performance and composition.

Public sources currently available:

- Vocalize: `https://vocalize-web-ten.vercel.app/`
- SJSU Parking Tracker: `https://timeglitch.github.io/SJSUParkingMonitor/`
- Satellite Tracker: `https://windborne-nu.vercel.app/`
- San Francisco Balalaika Ensemble: `https://sfbalalaika.org`

For each site, aim to collect:

- One landing-page capture.
- One or two meaningful interface details.
- A headline or navigation crop.
- A mobile capture only when it reveals a genuinely different design.

Store captures as local project assets so the viewer does not depend on network access at runtime. The captures intentionally represent an archived moment; refresh them manually when desired.

Treat captures inside the microfiche viewer with a warm, restrained two-color process. Preserve enough original structure and contrast that each project remains recognizable. Do not apply the treatment to the rest of the website.

## Motion and sound

- Travel time should respond to the distance between project coordinates.
- Use acceleration, directional blur during movement, restrained inertia, and a small settling motion.
- Blur and contrast changes should exist only while the sheet is moving.
- Add a quiet transport texture while dragging or traveling.
- Scale transport intensity subtly with movement speed and distance.
- Finish with a short mechanical lock/click sound.
- Avoid constant ambient noise.
- Respect the existing sound toggle and responsive default.

## Visual defaults

- Use a finite contact sheet with indexed coordinates such as `A2`, `C4`, and `B7`.
- Show partial neighboring cells so the active project feels embedded in a larger archive.
- Retain recognizable website imagery while reducing it to a warm two-color microfiche palette.
- Mix dense printed artifacts with quiet empty cells so the sheet remains legible.
- Keep indexing, crop marks, stamps, tape, and uneven edges selective rather than universal.

## Initial implementation scope

1. Create a data model for sheets, project clusters, cells, coordinates, assets, and external links.
2. Capture and store real images from the four public project websites.
3. Build five project clusters and approximately twelve transitional artifacts.
4. Render the finite two-dimensional contact sheet inside the existing right-hand viewer.
5. Implement left-list navigation, animated panning, dragging, inertia, and nearest-project snapping.
6. Synchronize the centered project with the left project list.
7. Implement click-versus-drag detection and live-site links.
8. Add keyboard navigation and reduced-motion behavior.
9. Add distance-based transport sound using the existing responsive sound state.
10. Verify desktop interaction and confirm that the current stacked mobile layout is unchanged.

## Deferred material

The initial implementation can use project-derived captures and code-native archival graphics. Later, replace or supplement cells with personal source material such as:

- Notebook sketches.
- Early mockups and abandoned versions.
- Photos of performances or installations.
- Handwritten notes.
- Flyers, documentation, diagrams, and development artifacts.
- Short first-person notes explaining why each project exists.

No additional product decision is currently blocking implementation. The recommendations in this document should be treated as the working defaults unless revised.
