import { $, gameHeader } from "./game-utils.js";

import { gridTap } from "./games/grid-tap.js";
import { pong } from "./games/pong.js";
import { colorSwitch } from "./games/color-switch.js";
import { memory } from "./games/memory.js";
import { mathBlitz } from "./games/math-blitz.js";
import { directionDash } from "./games/direction-dash.js";
import { coinCatch } from "./games/coin-catch.js";
import { wordRush } from "./games/word-rush.js";
import { beatTap } from "./games/beat-tap.js";
import { snake } from "./games/snake.js";
import { runnerCatch } from "./games/runner-catch.js";
import { whackTile } from "./games/whack-tile.js";

const content = $("appContent");
const storageKey = "tile-master-mrb-scores-v1";

export const gameAPI = {
  finish,
  sound,
  vibrate,
  addCleanup
};

const games = [
  ["gridtap", "Grid Tap Blitz", "Find the target against the AI.", gridTap],
  ["pong", "Pong Solo", "Play paddle tennis against the AI.", pong],
  ["colorswitch", "Color Switch", "Tap the requested color.", colorSwitch],
  ["memory", "Simon Says", "Watch and repeat the sequence.", memory],
  ["math", "Math Blitz", "Solve quick equations.", mathBlitz],
  ["direction", "Direction Dash", "React to arrows; use swipe or buttons.", directionDash],
  ["coin", "Coin Catch", "Catch coins and dodge hazards.", coinCatch],
  ["word", "Word Rush", "Type words faster than the rival.", wordRush],
  ["beat", "Beat Tap", "Tap when the moving pulse is centered.", beatTap],
  ["snake", "Classic Snake", "Eat, grow, and avoid your tail.", snake],
  ["runner", "Runner Catch", "Catch runners; avoid hazards.", runnerCatch],
  ["whack", "Whack-a-Tile", "Tap targets, avoid the danger tile.", whackTile]
];

let current = null;
let currentId = "";
let cleanups = [];
let soundEnabled = true;
let audioContext = null;

function scores() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
  catch { return {}; }
}

function saveBest(id, score) {
  const data = scores();
  const record = Number(data[id] || 0);
  if (score <= record) return false;
  data[id] = score;
  try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch {}
  return true;
}

function best(id) {
  return Number(scores()[id] || 0);
}

function addCleanup(fn) {
  cleanups.push(fn);
}

function clearGame() {
  cancelAnimationFrame(current?.raf || 0);
  cleanups.forEach(fn => { try { fn(); } catch {} });
  cleanups = [];
  current = null;
}

function sound(type = "tap") {
  if (!soundEnabled) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioContext ||= new AC();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});

    const tones = {
      tap: [440, 650, .07],
      score: [523, 784, .15],
      error: [180, 90, .18],
      win: [440, 660, .25]
    }[type] || [440, 650, .07];

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    osc.type = type === "error" ? "sawtooth" : "sine";
    osc.frequency.setValueAtTime(tones[0], now);
    osc.frequency.exponentialRampToValueAtTime(tones[1], now + tones[2]);
    gain.gain.setValueAtTime(.09, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + tones[2]);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + tones[2]);
  } catch {}
}

function vibrate(pattern = 20) {
  try { navigator.vibrate?.(pattern); } catch {}
}

function later(fn, ms) {
  const id = setTimeout(fn, ms);
  addCleanup(() => clearTimeout(id));
  return id;
}

function finish(message, score = current?.score || 0) {
  if (!current || current.over) return;
  current.over = true;
  cancelAnimationFrame(current.raf);

  const isRecord = saveBest(currentId, score);
  $("resultTitle").textContent = isRecord ? "New personal best!" : "Game over";
  $("resultMessage").textContent =
    `${message} Score: ${score}. Best: ${best(currentId)}.`;
  $("resultDialog").showModal();

  sound("error");
  vibrate([70, 35, 90]);

  $("replayButton").onclick = () => {
    $("resultDialog").close();
    launch(currentId);
  };
}

function launch(id) {
  const entry = games.find(game => game[0] === id);
  if (!entry) return;

  clearGame();
  currentId = id;
  current = {
    id,
    score: 0,
    over: false,
    raf: 0,
    finish,
    sound,
    vibrate,
    later,
    addCleanup,
    best: best(id)
  };

  $("resultDialog").close();
  entry[3](content, current, gameHeader);
}

function renderMenu() {
  clearGame();
  content.innerHTML = `
    <div class="intro">
      <h2>Choose a game</h2>
      <p class="muted">Personal bests are saved on this device.</p>
    </div>
    <div class="menu-grid">
      ${games.map(([id, title, description]) => `
        <button class="game-card" data-game="${id}">
          <strong>${title}</strong>
          <small>${description}</small>
          <span class="game-best">BEST ${best(id)}</span>
        </button>`).join("")}
    </div>`;
}

document.addEventListener("click", event => {
  const gameButton = event.target.closest("[data-game]");
  if (gameButton) launch(gameButton.dataset.game);
  if (event.target.closest("[data-menu]")) renderMenu();
});

$("soundButton").addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  $("soundButton").textContent = `Sound: ${soundEnabled ? "On" : "Off"}`;
  sound("tap");
});

$("startButton").addEventListener("click", () => {
  $("splash").classList.add("hidden");
  renderMenu();
});

$("resultDialog").addEventListener("cancel", event => event.preventDefault());

renderMenu();
