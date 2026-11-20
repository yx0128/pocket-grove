# Pocket Grove build postmortem

These are the issues that actually cost time in the reference build, with the exact fixes. Read this before debugging similar symptoms.

## 1. Flat tiles invisible — RoundedBox radius inflated the island

**Symptom:** grass, cobblestone, pond, and the fountain base were present in the React tree and scene graph but invisible in screenshots. Tall props rendered fine. Lifting the pieces 0.8 units made them appear.

**Cause:** the island grass cap used `RoundedBox args={[8.9, 0.16, 8.9]} radius={0.18}`. The radius was larger than half the height (0.08), so the rounded-rectangle shape/bevel inflated the geometry. `Box3.max.y` was `0.304` instead of the expected `0.03`, burying every flat asset whose top was around `0.10`.

**Fix:** reduce the radius to `0.06` (or use a plain box). Rule: `radius < min(width, height, depth) / 2`.

**How to diagnose:** expose the scene (`?debug=1`) and log `new THREE.Box3().setFromObject(object)` for the island group and for one flat piece. Compare `max.y`. Do not trust visual assumptions about RoundedBox height.

## 2. Entire sky orange — world-space sky shader under a top-down camera

**Symptom:** the screen was a flat peach/orange gradient with no blue.

**Cause:** a gradient sky dome used world-direction Y. The camera looked down, so every view ray sampled the lower hemisphere / bottom colour. The visible horizon was above the screen because the pitch was steeper than the half-FOV.

**Fix:** render the Canvas with `alpha: true` and put the gradient on the page behind it:
`radial-gradient(circle at 80% 8%, rgba(255,244,204,.88), transparent 32%), linear-gradient(180deg,#9bd6ea,#c7e7ee 45%,#f9dfba)`.
Remove the sky dome. Fog can stay; it only affects far objects.

## 3. Grid lines invisible in Build mode

**Symptom:** `lineSegments` with a 1 px line and 0.42 opacity barely showed against sage tiles.

**Fix:** replace the lines with 18 thin box bars (8.02 × 0.002 × 0.026) at `y=0.064`, opacity 0.7, colour `#4f6f49`. Make board tiles a uniform colour (`#aecfa0`) so View mode has no checkerboard.

## 4. Validity tint hidden under flat assets

**Symptom:** hovering an occupied grass/path tile showed no red cell, because the highlight plane at y=0.062 sat inside the flat asset base (top 0.10).

**Fix:** introduce `HIGHLIGHT_Y = 0.103`, above flat asset tops. Because the highlight is now above the pointer plane (0.1), add `raycast={() => undefined}` to the highlight and ring meshes.

## 5. Ghost preview/ring stealing clicks

**Symptom:** placement or removal stopped working when the ghost was visible.

**Cause:** translucent preview meshes were raycastable and above the pointer plane.

**Fix:** `NoRaycast` wrapper sets `object.raycast = () => {}` on every asset descendant; ghost highlight/ring also get `raycast={() => undefined}`. All tile events go through one invisible 8×8 pointer plane at y=0.1.

## 6. Right-click removal vs right-drag pan

**Symptom:** right-dragging the camera deleted pieces, or the browser context menu appeared.

**Fix:** record pointer-down position; on pointer-up, only remove if movement is ≤ 6 px and the button is 2. Prevent the context menu at the app root. Assets do not raycast, so right-clicking their cell still reaches the plane.

## 7. Shop modal looked transparent and behind the HUD

**Symptom:** the shop screenshot showed the island through the cards and the sidebar above the modal.

**Cause:** the modal's CSS animation was stuck at opacity 0 in headless Chrome. Its z-index was already 70; the screenshot caught the entrance animation (or it was throttled). The panel computed `opacity: 0`, transform 0.97/18 px.

**Fix for QA:** inject `*,*::before,*::after{animation-duration:.001s!important;animation-delay:0s!important;transition-duration:.001s!important}` before screenshots. Do not “fix” z-order until you have checked computed opacity and z-index. In a real browser the modal is fine.

## 8. Node 26 + jsdom localStorage

**Symptom:** all store tests failed with `Cannot read properties of undefined (reading 'setItem')`; Vitest warned “localStorage is not available because --localstorage-file was not provided.”

**Cause:** Node 26's experimental `localStorage` global shadowed jsdom's.

**Fix:** in `src/test/setup.ts`, create an in-memory storage object and `Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true })` before the store is imported. Mirror it on `window` for jsdom.

## 9. Camera framing at 8×8

- Initial `[9,9.5,11]` with fov 38 made the island fill the frame and the near corner sit behind the hotbar.
- Final `[9.6,10,12.4]`, target `[0,0.25,0.5]`, fov 40 gives margin and keeps the near corner above the dock.
- Clamps: distance 7.5–28, max polar π/2.2.

## 10. Flat-board readability

The 8×8 board is large relative to 1×1 props. The reference demo fills the centre with a path cross, fountain plaza, grass clusters, and trees. For a screenshot, use 20+ placed pieces; the starter state intentionally feels emptier so there is room to build.

## 11. Rewards and persistence

- A completed task stays completed; no toggle-back. This prevents coin farming.
- Persist only data, not UI flags. On hydrate, reset mode to Build and select the first owned item.
- Sanitize everything: unknown item ids, duplicate/out-of-range cells, malformed tasks, non-finite counts.
- Keep `partialize` and the `merge` sanitizer in sync when adding fields.

## 12. External assets

Do not add GLB/HDR/font CDN dependencies “for polish.” The zero-broken-link requirement is a feature: all ten miniatures, clouds, and the island are procedural. Use CSS/system fonts and Web Audio.
