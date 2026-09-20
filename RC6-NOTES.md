# Famme Journey Studio 2.0.0-rc.6

## Presentation & read-only view

RC6 fixes two presentation issues found in RC5:

- Print/PDF no longer prints the transformed live React Flow viewport. It renders a dedicated page-safe journey diagram and detail appendix.
- View mode is now strictly read-only while preserving clickable node inspection, URLs, creative previews, tracking details and visible connection arrows.

The print representation is intentionally optimized for paper/PDF and may compact node positions without altering the saved editor layout.
