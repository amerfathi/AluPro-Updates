# Offline License Workflow

This project now supports offline signed licenses without a server.

## Operator UI (Recommended)

Run the local License Admin Tool:

```bash
npm run license:admin
```

This opens a local dashboard to:

- save private key path
- add customers
- issue signed activation tokens
- track active/expired licenses
- enable/disable product features per customer license

### Feature Access Control

- Every license now supports explicit feature flags.
- If no known UI features are included, the app keeps full access (legacy compatibility).
- Recommended: issue new licenses with explicit feature selection from License Admin.

## Desktop EXE for License Admin

```bash
npm run build:license-admin:win
```

Output:

- `dist-license-admin/AluPro License Admin Setup 2.0.7.exe`

## 1) Generate signing keys (one time, secure machine)

```bash
npm run license:keypair -- --out-dir C:\secure\alu-license-keys --copy-public-to resources/license-public-key.pem --force
```

- Keep `private-key.pem` outside the app repository.
- `resources/license-public-key.pem` is bundled into the app.

## 2) Build the Windows installer

```bash
npm run build:win
```

## 3) Get customer device HWID

Open app on customer machine and copy displayed HWID from activation screen.

## 4) Generate license token for that device

```bash
npm run license:generate -- --private-key C:\secure\alu-license-keys\private-key.pem --hwid PC-XXXXXXXXXXXX --expiry 2027-12-31 --license-id LIC-2026-001 --plan pro --features bom,cut,machining
```

Paste the generated token into the app activation screen.

## Notes

- No server is required.
- The app validates license signature in the main process on every startup.
- Expiry is checked offline.
- Basic rollback detection is included, but fully tamper-proof time validation is not possible without a trusted time source.
