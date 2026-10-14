'use strict';
const CHARACTERS = ['character5', 'character2', 'character3', 'character4'];
const defaults = { userName: 'Friend', interval: 45, customIntervalMinutes: 75, pauseWhenInactive: true, inactivityThresholdMinutes: 12, reminderCharacter: 'character2', cheerMessage: 'Nice! 💙', launchAtLogin: true };
function clamp(value, min, max, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback; }
function validate(input = {}) {
  return { userName: typeof input.userName === 'string' ? input.userName.slice(0, 80) : defaults.userName,
    interval: [45, 90, 120, 'custom'].includes(input.interval) ? input.interval : 45,
    customIntervalMinutes: clamp(input.customIntervalMinutes, 1, 1440, 75),
    pauseWhenInactive: typeof input.pauseWhenInactive === 'boolean' ? input.pauseWhenInactive : true,
    inactivityThresholdMinutes: clamp(input.inactivityThresholdMinutes, 1, 120, 12),
    reminderCharacter: CHARACTERS.includes(input.reminderCharacter) ? input.reminderCharacter : defaults.reminderCharacter,
    cheerMessage: typeof input.cheerMessage === 'string' ? input.cheerMessage.slice(0, 120) : defaults.cheerMessage,
    launchAtLogin: typeof input.launchAtLogin === 'boolean' ? input.launchAtLogin : defaults.launchAtLogin };
}
class ReminderEngine {
  constructor(settings, onReminder, clock = Date.now) { this.settings = settings; this.onReminder = onReminder; this.clock = clock; this.paused = false; this.inactive = false; this.remaining = null; this.next = clock() + this.interval(); }
  interval() { return (this.settings.interval === 'custom' ? this.settings.customIntervalMinutes : this.settings.interval) * 60000; }
  get suspended() { return this.paused || this.inactive; }
  snapshot() { return { status: this.paused ? 'paused' : this.inactive ? 'inactive' : 'active', remaining: Math.max(0, this.suspended ? this.remaining ?? this.interval() : this.next - this.clock()), next: this.next }; }
  setSuspension(key, value) { const was = this.suspended; if (this[key] === value) return; if (!was) this.remaining = Math.max(0, this.next - this.clock()); this[key] = value; if (was && !this.suspended) { this.next = this.clock() + (this.remaining ?? this.interval()); this.remaining = null; } }
  togglePause() { this.setSuspension('paused', !this.paused); }
  setInactive(value) { this.setSuspension('inactive', value); }
  schedule(delay = this.interval()) { this.next = this.clock() + delay; if (this.suspended) this.remaining = delay; }
  update(settings) { const reset = settings.interval !== this.settings.interval || settings.customIntervalMinutes !== this.settings.customIntervalMinutes; this.settings = settings; if (reset) this.schedule(); if (!settings.pauseWhenInactive) this.setInactive(false); }
  trigger() { this.schedule(); this.onReminder(); }
  tick() { if (!this.suspended && this.clock() >= this.next) this.trigger(); }
}
module.exports = { defaults, validate, ReminderEngine, CHARACTERS };

