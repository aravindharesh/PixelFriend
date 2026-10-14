'use strict';
const api = window.pixelFriend;
const $ = id => document.getElementById(id);
let settings, initialized = false, saveChain = Promise.resolve();
function render(state) {
  const seconds = Math.ceil(state.remaining / 1000);
  $('status').textContent = state.status === 'paused' ? 'Reminders paused' : state.status === 'inactive' ? 'Waiting for activity' : 'Reminders are active';
  $('countdown').textContent = state.status === 'inactive' ? 'Timing will continue when you return to your Mac.' : `${state.status === 'paused' ? 'Paused with' : 'Next reminder in'} ${Math.floor(seconds / 60)}m ${seconds % 60}s${state.active ? ' · Reminder on screen' : ''}`;
  $('pause').textContent = state.status === 'paused' ? 'Resume reminders' : 'Pause reminders';
  if (!initialized) { settings = state.settings; for (const key of ['userName', 'cheerMessage', 'interval', 'customIntervalMinutes', 'inactivityThresholdMinutes']) $(key).value = settings[key]; $('pauseWhenInactive').checked = settings.pauseWhenInactive; $('launchAtLogin').checked = settings.launchAtLogin; initialized = true; showSelection(); }
}
function showSelection() {
  $('preview').src = `../assets/ReminderVideos/PreviewImages/${settings.reminderCharacter}.png`;
  for (const button of document.querySelectorAll('[data-character]')) button.setAttribute('aria-pressed', String(button.dataset.character === settings.reminderCharacter));
  $('customRow').hidden = settings.interval !== 'custom'; $('idleRow').hidden = !settings.pauseWhenInactive;
}
function save() {
  const snapshot = { ...settings };
  saveChain = saveChain.catch(() => {}).then(() => api.save(snapshot)).then(() => { $('saveStatus').textContent = 'Settings saved'; }).catch(() => { $('saveStatus').textContent = 'Could not save settings. Please try again.'; });
}
for (const button of document.querySelectorAll('[data-character]')) button.addEventListener('click', () => { settings.reminderCharacter = button.dataset.character; showSelection(); save(); });
$('settings').addEventListener('submit', event => event.preventDefault());
$('settings').addEventListener('change', event => {
  const { id, value, checked } = event.target;
  if (['pauseWhenInactive', 'launchAtLogin'].includes(id)) settings[id] = checked;
  else if (id === 'interval') settings[id] = value === 'custom' ? value : Number(value);
  else if (['customIntervalMinutes', 'inactivityThresholdMinutes'].includes(id)) { const max = id === 'customIntervalMinutes' ? 1440 : 120; settings[id] = Math.min(max, Math.max(1, Math.round(Number(value) || 1))); $(id).value = settings[id]; }
  else settings[id] = value;
  showSelection(); save();
});
for (const action of ['test', 'pause', 'quit']) $(action).addEventListener('click', () => api.action(action));
api.onState(render); api.getState().then(render);
