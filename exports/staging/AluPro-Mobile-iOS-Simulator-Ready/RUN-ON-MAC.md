# Run on Mac

This export is prepared for iPhone Simulator use through Xcode.

## What is already ready

- The web app is built.
- Capacitor iOS files are generated.
- The Xcode project already exists at `ios/App/App.xcodeproj`.

## Steps on macOS

1. Unzip this project on your Mac.
2. Open `ios/App/App.xcodeproj` in Xcode.
3. Wait for Swift packages to finish loading.
4. Choose an iPhone Simulator device from the top toolbar.
5. Press Run.

## If Xcode asks for anything

- If prompted for a development team, choose your Apple ID team.
- If packages are missing, let Xcode resolve them automatically.

## Important

This package is simulator-ready as a source project.
The actual iPhone `.app` for Simulator is created by Xcode on macOS after pressing Run.
