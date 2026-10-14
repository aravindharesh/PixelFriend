'use strict';
const video = document.getElementById('video');
let role = 'entry', selected, movement, token = 0, canvasWidth = 540, originX = 0;
window.pixelFriend.onReminder(async data => {
  const current = ++token; role = data.role; selected = data.character; canvasWidth = data.canvasWidth || 540; originX = data.originX || 0;
  video.style.position = 'absolute'; video.style.left = originX + 'px'; video.style.width = (data.videoWidth || 540) + 'px';
  if (movement) movement.cancel(); movement = null;
  video.style.visibility = 'hidden'; video.style.transform = '';
  video.classList.toggle('corrected', selected === 'character2' && role === 'success-out');
  video.src = `../assets/ReminderVideos/Character${selected.slice(-1)}/${role}.webm`;
  try { await video.play(); if (current !== token) return; } catch { window.pixelFriend.action('video-error'); }
});
video.addEventListener('loadeddata', () => { video.style.visibility = 'visible'; });
video.addEventListener('timeupdate', () => {
  if (selected !== 'character5' || role === 'entry' || movement) return;
  const lead = role === 'success-out' ? 2.1 : 7;
  if (video.currentTime >= lead) movement = video.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${role === 'success-out' ? canvasWidth + 270 - originX : -560 - originX}px)` }], { duration: Math.max(100, (video.duration - video.currentTime + (role === 'disappointed-out' ? .45 : 0)) * 1000), easing: 'ease-in', fill: 'forwards' });
});
video.addEventListener('ended', async () => {
  if (role === 'entry') window.pixelFriend.action('entry-ready');
  else { if (movement) await movement.finished.catch(() => {}); window.pixelFriend.action('exit-done'); }
});
video.addEventListener('error', () => window.pixelFriend.action('video-error'));

