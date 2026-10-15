# Version 1.2 quality review

## Implemented improvements

- Added portrait, square and landscape video export, 720p/1080p and 6/15/30-second durations.
- Kept the exported pattern immutable while recording; paused live drawing to reduce competing work.
- Selected supported media formats with honest file extensions and visible WebM compatibility guidance.
- Released capture tracks on completion, cancel, page hiding, encoder failure and timeout.
- Added preview, download, optional native file sharing, and a public Story landing page.
- Avoided continuous redraws while paused or hidden and capped live painting at 30 fps.
- Reused chain endpoints rather than evaluating the same Fourier sum twice per frame.
- Prevented stale contour results from being applied during the settings debounce window.
- Fitted SVG geometry to actual reconstructed bounds so overshoot stays inside the export.
- Increased mobile control hit areas and prevented the space shortcut from affecting the app behind dialogs.

## Validation

The automated Node suite covers FFT/model correctness, contour cases and recorder lifecycle using a mock recorder. The mathematical canvas renderer is shared by the website, exported video and the produced Story MP4. FFprobe verifies the produced asset as 1080 × 1920, 30 fps, H.264, yuv420p, 15 seconds. Selected video frames were visually inspected.

Browser-level encoding, device share sheets and Instagram import were not tested on physical phones. A device that reports codec support may still reject recording due to resource limits; the UI displays failures and allows a smaller resolution or alternative format.

## Further opportunities

1. Semantic foreground selection for difficult photographs. Current contour extraction is geometric, so user intent still requires contour selection.
2. Multiple contours with pen-up transitions. The current mathematical model follows one closed path.
3. Deterministic offline browser encoding with WebCodecs and a bundled MP4 muxer, after measuring mobile support and bundle cost. Current browser export is real-time.
4. A custom domain for an account-independent sharing URL. GitHub Pages exposes the repository owner's public handle.
5. Physical Android Chrome and iPhone Safari checks for file downloads, native sharing and Instagram ingestion.

## Version 1.3 additions

- Added 24 shape presets with searchable thumbnails, five families, and random selection within the active filter.
- Added voluntary GitHub Star links in the studio header, support card, completed-video panel and Story page, with a short sign-in-and-star explanation.
- New preset tests verify finite normalized paths, Fourier convergence and 5,000-term reconstruction for every shape, including the spiral ribbon and fractal boundary.

## Version 1.4 additions

- Replaced exactly 12 gallery entries while retaining 24 total: eight original animal/ornament drawings and four advanced geometric patterns.
- Added sampled vector line art for a butterfly, owl, koi, seahorse, dragon, stag, lotus and winged scarab. Internal features are connected and open branches are retraced as a continuous closed walk; seams are visible by design.
- Added a 17/7 star polygon, 9:16 torus-knot projection, guilloche rosette and fifth-order Koch boundary (3,072 edges).
- Added an Animals & ornaments filter and raised thumbnail sampling for detailed line art. Preset selection preserves the user's term count.
- Rendered all 12 new paths into a review sheet and inspected recognizable silhouettes, internal lines, orientation and framing.
- The full test suite passes, including exact replacement/drawing counts, closed illustration walks, cache immutability and less than 0.1% normalized reconstruction error at 5,000 terms for every gallery entry. Rebuilt the offline HTML with embedded illustration data.
