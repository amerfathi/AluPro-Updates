# Offline License Assumptions

This note documents the implementation assumptions for the first offline licensing hardening slice.

## Scope

- Replace renderer-only activation checks with a main-process offline license validator.
- Keep existing product workflows unchanged (production, contracts, inventory, reports).
- Avoid server dependencies.

## Assumptions

1. License activation is fully offline.
2. The app receives a signed license token from an operator/admin workflow.
3. Public key is bundled with the app (`resources/license-public-key.pem`).
4. Private key is never bundled with the app.
5. System clock can be manipulated by users; we only add rollback detection (not perfect anti-tamper).
6. No database schema changes are required.

## Non-Goals (This Slice)

- No subscription server.
- No online revocation list.
- No multi-device seat management API.
- No billing workflow changes.
