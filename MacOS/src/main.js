'use strict';
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, powerMonitor, nativeImage, dialog } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { validate, ReminderEngine } = require('./engine');
let control, character, bubble, tray, engine, settings, active = false, phase = 'hidden', quitting = false, idleSample = 0, activeCharacter, videoBounds;
const root = path.join(__dirname, '..');
if (process.platform === 'win32') app.setAppUserModelId('local.pixelfriend.windows');
const prefs = () => path.join(app.getPath('userData'), 'settings.json');
const state = () => ({ settings, ...engine.snapshot(), active });
const options = { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true };
function secure(win) { win.webContents.setWindowOpenHandler(() => ({ action: 'deny' })); win.webContents.on('will-navigate', event => event.preventDefault()); }
function applyLoginItem() { if (!app.isPackaged) return; try { app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin }); } catch (error) { console.error('Could not update login item', error); } }
function update() { if (control && !control.isDestroyed()) control.webContents.send('state', state()); }
function trayMenu() { tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Open PixelFriend', click: openControl }, { label: engine.paused ? 'Resume reminders' : 'Pause reminders', click: () => { engine.togglePause(); trayMenu(); update(); } }, { label: 'Test reminder now', click: () => engine.trigger() }, { type: 'separator' }, { label: 'Quit PixelFriend', click: () => app.quit() }])); }
function openControl() { if (process.platform === 'darwin') app.focus({ steal: true }); control.show(); control.focus(); }
function sendCharacter(role) { character.webContents.send('reminder', { role, character: activeCharacter, canvasWidth: character.getBounds().width, originX: videoBounds.originX, videoWidth: videoBounds.videoWidth }); }
function present() {
  if (active) return;
  const work = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
  const width = Math.min(540, work.width), height = Math.round(width * 304 / 540);
  activeCharacter = settings.reminderCharacter;
  const originX = ['character3', 'character4'].includes(activeCharacter) ? work.width - width : 0;
  videoBounds = { x: work.x, y: Math.max(work.y, work.y + work.height - height - 83), width: work.width, height, originX, videoWidth: width };
  character.setBounds({ x: videoBounds.x, y: videoBounds.y, width: videoBounds.width, height: videoBounds.height });
  bubble.setBounds({ x: Math.max(work.x, Math.min(work.x + work.width - 480, videoBounds.x + originX + width / 2 - 240)), y: Math.max(work.y, videoBounds.y - 128), width: Math.min(480, work.width), height: 128 });
  active = true; phase = 'entry'; activeCharacter = settings.reminderCharacter;
  sendCharacter('entry'); character.showInactive(); update();
}
function finish() { character.hide(); bubble.hide(); active = false; phase = 'hidden'; engine.schedule(exitWasSnooze ? 600000 : engine.interval()); update(); }
let exitWasSnooze = false;
function exit(snooze) { phase = 'exit'; exitWasSnooze = snooze; bubble.hide(); sendCharacter(snooze ? 'disappointed-out' : 'success-out'); }
function handleAction(sender, action) {
  if (sender === control.webContents) {
    if (action === 'test') engine.trigger();
    if (action === 'pause') { engine.togglePause(); trayMenu(); update(); }
    if (action === 'quit') app.quit();
    return;
  }
  if (sender === character.webContents && action === 'entry-ready' && phase === 'entry') { phase = 'waiting'; bubble.webContents.send('reminder', { name: settings.userName.trim() || 'Friend' }); bubble.showInactive(); }
  if (sender === character.webContents && action === 'exit-done' && phase === 'exit') finish();
  if (sender === character.webContents && action === 'video-error' && active) { character.hide(); bubble.hide(); active = false; phase = 'hidden'; engine.schedule(600000); dialog.showErrorBox('Animation could not play', 'Please reinstall PixelFriend or run npm run convert-assets in the source project.'); }
  if (sender === bubble.webContents && phase === 'waiting' && ['drink', 'snooze'].includes(action)) {
    phase = 'response';
    if (action === 'snooze') exit(true);
    else { bubble.webContents.send('reminder', { response: settings.cheerMessage.trim() || 'Nice! 💙' }); setTimeout(() => { if (active) exit(false); }, 1200); }
  }
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
app.on('second-instance', () => { if (control) openControl(); });
app.whenReady().then(async () => {
  if (process.platform === 'darwin' && app.dock) app.dock.hide();
  try { settings = validate(JSON.parse(fs.readFileSync(prefs(), 'utf8').replace(/^\uFEFF/, ''))); } catch { settings = validate(); }
  engine = new ReminderEngine(settings, present);
  applyLoginItem();
  const openedAtLogin = process.platform === 'darwin' && app.isPackaged && Boolean(app.getLoginItemSettings().wasOpenedAtLogin);
  control = new BrowserWindow({ width: 540, height: 840, minWidth: 480, minHeight: 650, title: 'PixelFriend', show: !openedAtLogin, icon: path.join(root, 'assets/icon.ico'), autoHideMenuBar: true, webPreferences: options });
  control.on('close', event => { if (!quitting) { event.preventDefault(); control.hide(); } });
  const overlay = { frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true, resizable: false, maximizable: false, minimizable: false, hasShadow: false, show: false, webPreferences: options };
  character = new BrowserWindow({ ...overlay, width: 540, height: 304, focusable: false }); character.setIgnoreMouseEvents(true);
  bubble = new BrowserWindow({ ...overlay, width: 480, height: 128, focusable: false });
  for (const win of [control, character, bubble]) secure(win);
  for (const win of [character, bubble]) win.setVisibleOnAllWorkspaces(true, { skipTransformProcessType: true });
  ipcMain.handle('get-state', () => state());
  ipcMain.handle('save-settings', (event, input) => {
    if (event.sender !== control.webContents) throw new Error('Unauthorized settings request');
    const nextSettings = validate(input);
    fs.mkdirSync(path.dirname(prefs()), { recursive: true });
    fs.writeFileSync(prefs() + '.tmp', JSON.stringify(nextSettings, null, 2)); fs.renameSync(prefs() + '.tmp', prefs());
    engine.update(nextSettings); settings = nextSettings; applyLoginItem(); update(); return state();
  });
  ipcMain.on('action', (event, action) => handleAction(event.sender, action));
  await Promise.all([control.loadFile(path.join(__dirname, 'control.html')), character.loadFile(path.join(__dirname, 'character.html')), bubble.loadFile(path.join(__dirname, 'bubble.html'))]);
  tray = new Tray(nativeImage.createFromPath(path.join(root, 'assets/icon.png')).resize({ width: 24, height: 24 })); tray.setToolTip('PixelFriend — water reminder'); tray.on('double-click', openControl); if (process.platform === 'darwin') tray.on('click', () => tray.popUpContextMenu()); trayMenu();
  setInterval(() => {
    if (++idleSample >= 30) { idleSample = 0; engine.setInactive(settings.pauseWhenInactive && powerMonitor.getSystemIdleTime() >= settings.inactivityThresholdMinutes * 60); }
    engine.tick(); update();
  }, 1000);
  powerMonitor.on('suspend', () => engine.setInactive(true));
  powerMonitor.on('resume', () => { engine.setInactive(settings.pauseWhenInactive && powerMonitor.getSystemIdleTime() >= settings.inactivityThresholdMinutes * 60); });
  if (process.argv.includes('--smoke-test')) {
    for (const win of [control, character, bubble]) { console.log('SMOKE', path.basename(win.webContents.getURL()), await win.webContents.executeJavaScript('({ready:document.readyState,bridge:typeof window.pixelFriend})')); }
    engine.trigger(); setTimeout(() => app.quit(), 12000);
  }
});
}
app.on('before-quit', () => { quitting = true; });
app.on('activate', () => { if (control) openControl(); });
app.on('window-all-closed', () => {});





