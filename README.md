# Orbit — Fourier Pattern Studio

A browser-local creative coding playground that turns sketches and image contours into rotating Fourier epicycles.

[![Computed Fourier preview of the Moore curve](assets/preview.svg)](https://sjskoko.github.io/orbit-fourier-studio/)

**[Launch the live web demo →](https://sjskoko.github.io/orbit-fourier-studio/)**

Draw a path or upload an image, refine its contour, and animate it with up to 5,000 Fourier terms. Click the preview above to launch the studio.

**[Story page & MP4 download →](https://sjskoko.github.io/orbit-fourier-studio/story/)** · 15 seconds · 1080 × 1920 · H.264 MP4

**Offline:** download [`orbit-studio.html`](dist/orbit-studio.html) and open it in a modern browser. No server or installation is required for the standalone version.

## Features

- **Draw your own path** with a mouse, touch screen or stylus; undo and clear strokes.
- **Upload an image** and inspect candidate contours before animating one.
- **Advanced contour lab:** automatic background polarity, Otsu and adaptive thresholds, alpha silhouettes, Canny-style photo edges, noise reduction and morphological cleanup.
- **Refine geometry:** remove tiny components, include or exclude interior contours, ignore image-frame outlines, simplify vertices and smooth the curve.
- **Choose visually:** click a contour in the preview, or use the ranked contour list. Toggle the binary mask to understand extraction.
- **1–5,000 Fourier terms**, with exact numeric input, 8,192 arc-length samples and a dependency-free radix-2 FFT.
- **Two animation modes:** independent X/Y chains or a single complex-plane chain.
- Playback, scrubbing, speed, colors, fullscreen, PNG snapshots, complete SVG paths and JSON project files.
- **Video export:** 9:16 story, 1:1 square or 16:9 landscape; 720p/1080p; 6/15/30 seconds; MP4 when available, with a clearly labeled WebM fallback.
- **Story landing page:** a ready-to-share MP4, mobile layout, file sharing, link copying and Instagram Link sticker instructions.
- All image and sketch processing happens locally. There are no analytics, image-upload endpoints, API keys or runtime dependencies.

## Video export

1. Draw or upload a path, then adjust the terms and colors.
2. Click **Export video** and choose the frame, quality, duration and format.
3. Keep the tab visible. The export records one complete drawing, then holds the final image for one second.
4. Preview the result, download it, or share the file using the device share sheet when supported.

Recording uses the browser's Canvas Capture and MediaRecorder APIs, at a target of 30 fps. MP4 is preferred when the browser reports support. WebM is explicitly labeled and may need conversion before Instagram accepts it. The app does not rename WebM files as MP4. Actual frame cadence depends on browser/device performance. Use 720p or fewer terms on a slow device.

No microphone, camera or screen-recording permission is requested. Video contains no audio. Hiding the tab cancels export to avoid a frozen or incomplete recording; cancel, encoder error and timeout paths release all capture tracks. A download remains available if native file sharing is unsupported.

### Instagram Story

Open the [Story page](https://sjskoko.github.io/orbit-fourier-studio/story/), save the MP4, add it to an Instagram Story and add the page URL with a **Link** sticker. Suggested sticker label: **Make your own ↗**. The share sheet does not guarantee direct posting to Instagram; publishing is completed in Instagram.

The included `dist/story/orbit-story.mp4` is a silent 15-second H.264 video, 1080 × 1920 at 30 fps, with a 7 → 31 → 255 term progression. It uses the same geometry renderer as the web studio. The URL is for the public landing page; it does not upload or share a visitor's own drawing.

To convert a downloaded WebM locally with FFmpeg:

```sh
ffmpeg -i orbit-story.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart orbit-story.mp4
```

## Run locally

Use any static HTTP server from the repository root:

```sh
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Static hosting enables the dedicated contour Web Worker. The standalone HTML embeds its worker source and has a synchronous fallback when workers are unavailable.

## Image lab guide

| Mode | Best for | Behavior |
| --- | --- | --- |
| Auto | Logos and silhouettes | Uses alpha when meaningful transparency is present; otherwise Otsu and border-based foreground polarity. |
| Otsu | Clear foreground/background contrast | Finds a global intensity threshold automatically. |
| Adaptive | Uneven lighting | Compares each pixel with its neighborhood mean. Foreground can be dark or light. |
| Photo edges | Photographs and line detail | Gaussian-style blur, Sobel gradients, non-maximum suppression and hysteresis; traces the boundaries of the resulting edge regions. |
| Alpha | Transparent PNG or SVG | Extracts opaque silhouettes independent of their RGB color. |
| Manual | Difficult contrast | Uses an explicit threshold and polarity. |

Start with **Auto**. Try **Adaptive** when shadows affect the result, and **Photo edges** for internal details. Use the binary-mask preview before increasing Fourier terms: more terms cannot repair a poor source contour.

- **Denoise** applies repeated separable binomial blur passes.
- **Close small gaps** performs a 3×3 dilation followed by erosion; **Remove specks** uses the inverse order.
- **Minimum area** removes small connected foreground regions and filters small contour loops, including holes.
- **Simplify** uses closed-loop Ramer–Douglas–Peucker simplification.
- **Smoothing** uses Chaikin corner cutting. Higher values round sharp corners and change the source geometry.
- Up to **100 contours**, ranked by enclosed area, are available at **512, 768 or 1,024 px** processing resolution.
- A deterministic [sample image](dist/examples/contour-test.svg) includes a silhouette, a hole and small specks for experimentation.

## How the animation works

1. Resample a selected closed path at 8,192 uniformly spaced arc-length positions.
2. Normalize it to a centered coordinate system.
3. Compute normalized complex Fourier coefficients using a radix-2 FFT.
4. Keep exactly N signed-frequency terms, starting with DC and increasing absolute frequency.
5. Draw rotating vectors in descending amplitude order; their sum locates the tip.
6. Reconstruct the full sampled curve with the inverse FFT for export and error calculation.

In X/Y mode, each axis retains N terms independently. For even N, the final signed-frequency pair is incomplete; the real projection is used for each axis. Complex-plane reconstruction can therefore differ slightly from X/Y mode at even N. Both modes use their own reconstructed path for the displayed error.

The error is:

```text
NRMSE (%) = 100 × RMS(reconstruction − sampled_path)
                 / RMS(sampled_path − mean(sampled_path))
```

This measures reconstruction of the **processed selected path**, not segmentation quality against the original image or the error definition of any reference video.

## Tests and offline build

Node.js 20 or later is sufficient. No package installation is needed.

```sh
npm test
npm run build:offline
node scripts/preview.cjs
```

The tests cover FFT agreement with a direct DFT, exact 5,000-term selection, even/odd X/Y reconstruction, error convergence, alpha and polarity detection, holes, diagonal topology, noise removal, adaptive and edge extraction, simplification and smoothing. Video regression checks cover layout dimensions, format selection, complete-loop timing, 5,000-term renderer agreement, cancellation, visibility changes, empty output, encoder failures and resource cleanup. These use a mocked recorder; they do not certify browser/device encoding compatibility. The included story MP4 is independently checked with FFprobe.

## Repository layout

```text
dist/                 Static web demo and standalone HTML
  app.js              UI, drawing, animation and file handling
  math.js             Arc-length sampling, FFT and reconstruction
  render.js           Shared canvas renderer for live view and video
  video.js            Recorder lifecycle, formats and timing
  video-ui.js         Export modal, preview, download and native share
  story/              Public story landing page, MP4 and poster
  contours.js         Pure image-processing and contour engine
  contour-worker.js   Background extraction worker
  examples/           Small synthetic input fixture
tests/                Image-processing regression checks
verify.cjs            Fourier and UI-target regression checks
scripts/              Offline packaging and computed preview
assets/preview.svg    Illustration computed from the Fourier model
```

## GitHub Pages

The live demo is deployed automatically by the included `pages.yml` workflow. Every push to `main` tests the source, rebuilds the offline file and publishes `dist/` to GitHub Pages. For a fork, select **GitHub Actions** in **Settings → Pages** and run the workflow.

GitHub Pages normally includes the GitHub account or organization handle in its URL. Use a custom domain if an account-free URL is required. This repository intentionally excludes the private hosting manifest, account-specific deployment links, credentials and user-uploaded images.

## Limitations

- This is geometric image processing, not semantic object segmentation. It cannot reliably infer the intended object in every photograph.
- Photo-edge mode traces regions around edges; it can produce inner/outer double outlines rather than a single centerline.
- One closed contour is animated at a time. Separate hand-drawn strokes and open endpoints are connected in drawing order.
- Area filtering and smoothing can remove small details. Reducing simplification and smoothing preserves more corners.
- High term counts and large images may render more slowly on mobile devices; subpixel circles are skipped visually while their vectors still contribute to the sum.
- PNG saves the current animation canvas. SVG saves the complete reconstructed path on a transparent background, with bounds fitted to avoid Fourier overshoot clipping. Video export is supported; GIF export is not implemented.
- MediaRecorder format availability and frame cadence vary by browser. Native mobile sharing and Instagram import should be checked on the target device.
- JSON projects preserve the active sampled path, drawing strokes and animation settings. They do not retain the original image or image-lab extraction settings.

## Privacy

Images are decoded and processed in the browser. The app does not transmit their contents. Files are saved only when you request an export. Hosting providers still receive ordinary page requests. A public GitHub repository exposes its owner handle even when the source contains no personal information.

## Quality review

Version 1.2 also stops redundant redraws while paused or hidden, caps live painting at 30 fps, removes duplicate chain endpoint calculations, blocks stale contour application immediately when extraction settings change, improves mobile tap targets, and fits SVG exports to their actual bounds. See [the quality review](docs/quality-review.md) for validation and remaining opportunities.

The optional `scripts/render-story.cjs` production tool requires `@napi-rs/canvas`, FFmpeg and the DejaVu fonts referenced in the script. It is not part of the dependency-free website or CI.
