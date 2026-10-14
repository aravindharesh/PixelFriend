# PixelFriend for macOS

macOS build of [PixelFriend](https://www.aakashcreates.com/products/pixelfriend/), the tiny desktop companion that
walks onto your screen to remind you to drink water. Ported from the Windows 1.0.5 Electron bundle.

- Runs quietly from the **menu bar** (top right of the screen). No Dock icon, no Cmd+Tab entry.
- **Starts automatically** when you log in, so it survives reboots.
- Four characters, adjustable reminder interval, pauses when your Mac is idle.
- Works on Apple Silicon and Intel Macs (universal build). Everything stays on your Mac; no accounts, no telemetry.

## Install

1. **Download** `PixelFriend-1.0.5-mac.dmg` from the [Releases](../../releases) page.
2. **Open the DMG** by double-clicking it in your Downloads folder.
3. **Drag `PixelFriend`** into the `Applications` folder shown in the window.
4. **Eject the DMG** (click the eject arrow next to it in Finder's sidebar) and open your `Applications` folder.
5. **First launch:** right-click `PixelFriend` and choose **Open**, then click **Open** again in the dialog.
   macOS shows this warning once because the app is not signed with an Apple Developer ID.
   If macOS says it "cannot be opened", go to **System Settings > Privacy & Security**, scroll down, and click **Open Anyway**.
   Alternative for the terminal: `xattr -d com.apple.quarantine /Applications/PixelFriend.app`
6. The settings window appears and a small PixelFriend icon shows up in the menu bar. Done.

macOS may show a notification that PixelFriend was added as a Login Item. That is expected; it is what makes the app
start again after a reboot. You can turn this off with the "Start PixelFriend automatically when I log in" checkbox.

## Using it

- **Close the settings window** (red button) to keep reminders running in the background.
- **Click the menu bar icon** for: Open PixelFriend, Pause/Resume reminders, Test reminder now, Quit PixelFriend.
- When the character walks in, click **YES** after you drink or **Remind me later** to snooze for 10 minutes.
- **Quit PixelFriend** stops reminders completely until the next login or until you open the app again.

## Uninstall

1. Click the menu bar icon and choose **Quit PixelFriend**.
2. Drag `/Applications/PixelFriend.app` to the Trash.
3. Optional: remove settings with `rm -rf ~/Library/Application\ Support/pixelfriend-mac`.
   The Login Item entry disappears on its own once the app is gone.

## Build from source

Requires Node.js 20 or newer (`brew install node`).

```
git clone https://github.com/aravindharesh/PixelFriend.git
cd PixelFriend/MacOS
npm install
npm run dist      # -> dist/PixelFriend-1.0.5-mac.dmg
```

`npm run smoke` launches the app for 12 seconds and fires a test reminder without installing anything.
See `BUILD.md` for every change versus the Windows build and the code-signing notes.
