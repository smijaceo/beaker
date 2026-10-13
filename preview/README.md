# Synthetic browser preview

This folder is the static source deployed to the existing Beaker preview Site. It uses synthetic fixtures and browser-local storage, not the Python server/database. Existing local records are not reseeded by this update.

It has no organizational SSO, shared persistence, live integration writeback or configured printer sender. Imports/receipts and some server-only actions are explicitly unavailable. Exported ZPL is not physical printing.

The full application lives in the parent directory. Run it with the existing README instructions; do not substitute this preview for its backend.

Intro hardware assets remain missing; see ../docs/current-refinement.md.
