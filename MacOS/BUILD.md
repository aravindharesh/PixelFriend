# PixelFriend for macOS — build notes

Source is the exact app bundle from the Windows 1.0.5 installer (app.asar), repackaged for macOS.

## Changes vs the Windows build
- package.json: new file; mac build config (universal DMG), Electron pinned to 44.7.0 (same as Windows build).
- src/main.js: added `app.on('activate')` so clicking the Dock icon reopens the window;
  overlay windows call `setVisibleOnAllWorkspaces(true)` so reminders appear on the current Space.
- src/control.html: "Pause when Windows is inactive" -> "Pause when your Mac is inactive";
  "system tray" -> "menu bar".
- src/style.css: added `-apple-system` ahead of `Segoe UI` in the UI font stack.
Everything else (engine, bubble, character player, assets, videos, fonts) is untouched.

## Commands
    npm run smoke     # launches app, prints SMOKE lines, fires a test reminder, quits after 12 s
    npm run dist      # builds dist/PixelFriend-1.0.5-mac.dmg (universal: Apple Silicon + Intel)

## Signing
No Apple Developer identity on this machine, so the DMG is unsigned and not notarized.
Testers: right-click the app > Open, or `xattr -d com.apple.quarantine /Applications/PixelFriend.app`.
For the public website download the author must sign + notarize with their Developer ID.

## Verify signature after build
    codesign -dv --verbose=2 dist/mac-universal/PixelFriend.app
Expect `Signature=adhoc`. If it says "not signed at all", run
    codesign --force --deep --sign - dist/mac-universal/PixelFriend.app
    npx electron-builder --mac dmg --prepackaged dist/mac-universal/PixelFriend.app

## Start at login (added 2026-10-14)
New setting `launchAtLogin` (default on). The packaged app registers itself as a macOS Login Item
via `app.setLoginItemSettings`; it appears under System Settings > General > Login Items & Extensions.
When macOS launches it at login the settings window stays hidden; reminders run from the menu bar.
Only active in the packaged app (not `npm run smoke`), so the dev Electron binary never gets registered.

## Menu-bar-only (added 2026-10-14)
`app.dock.hide()` at startup: no Dock icon, no Cmd+Tab entry. The app is reachable only from the
menu bar icon (click opens the menu: Open PixelFriend / Pause / Test / Quit).
`openControl` calls `app.focus({ steal: true })` so the settings window comes to the front despite no Dock presence.
`mac.extendInfo.LSUIElement = true` also marks the app as a background (agent) app in Info.plist, so macOS
never shows a Dock icon even before any JavaScript runs.
Note: `setVisibleOnAllWorkspaces` must be called with `{ skipTransformProcessType: true }`, otherwise Electron
transforms the process back to a Foreground app and the Dock icon reappears despite LSUIElement / dock.hide().
