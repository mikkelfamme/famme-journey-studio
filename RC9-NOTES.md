# RC9 — Zoom-aligned stage backdrop

RC9 fixes a visual coordinate mismatch in the Journey Editor. The funnel stage background previously lived in screen coordinates while React Flow nodes lived in transformed world coordinates. The stage backdrop now derives its boundaries from the same viewport x/zoom values as the nodes.

## Changes
- stage colors follow zoom and horizontal pan
- stage separators stay aligned with the journey
- stage labels remain readable
- creative/TODO badges have stronger contrast

No workspace schema changes are required.
