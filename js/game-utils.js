export const $ = id => document.getElementById(id);

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function gameHeader(title, score = 0, rival = null) {
  return `<div class="game-header">
    <div>
      <h2>${title}</h2>
      <small>Score <b id="gameScore">${score}</b>
      ${rival === null ? "" : ` · Rival <b id="rivalScore">${rival}</b>`}</small>
    </div>
    <button class="back" data-menu>← Games</button>
  </div>`;
}
