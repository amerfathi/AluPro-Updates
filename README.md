# alu-app

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

### Offline License (No Server)

```bash
# Open License Admin dashboard (customers/subscriptions/tokens)
$ npm run license:admin

# 1) Generate keypair (do this on a secure admin machine)
$ npm run license:keypair -- --out-dir C:\secure\alu-license-keys --copy-public-to resources/license-public-key.pem --force

# 2) Generate customer license token
$ npm run license:generate -- --private-key C:\secure\alu-license-keys\private-key.pem --hwid PC-XXXXXXXXXXXX --expiry 2027-12-31 --license-id LIC-2026-001

# Build standalone License Admin EXE
$ npm run build:license-admin:win
```
