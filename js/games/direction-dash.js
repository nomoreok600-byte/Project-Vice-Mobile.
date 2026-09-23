import { $, randomInt } from "../game-utils.js";

export function directionDash(root, g, header) {
  const arrows = ["↑", "→", "↓", "←"];
  let target = 0, time = 25, lives = 3, streak = 0;
  let last = 0, shownAt = 0, promptLimit = 1.7, swipeStart = null;

  root.innerHTML = `<div class="game-screen">
    ${header("Direction Dash")}
    <div class="row"><span>Time</span><b id="ddTime">25s</b></div>
    <div class="track"><div id="ddTimer" class="fill"></div></div>
    <div class="row" style="margin-top:12px"><span>Lives: <b id="ddLives">♥ ♥ ♥</b></span><span>Streak: <b id="ddStreak">0</b></span></div>
    <div class="prompt" id="ddPrompt"><div><strong>Follow the arrow</strong><small id="ddArrow"></small></div></div>
    <div class="controls" id="ddButtons"></div>
    <p class="note">Tap, swipe on the prompt, or use keyboard arrows.</p>
  </div>`;

  const prompt = $("ddPrompt");
  const buttons = $("ddButtons");
  buttons.innerHTML = arrows.map((arrow, i) =>
    `<button class="direction" data-dir="${i}">${arrow}</button>`
  ).join("");

  function next() {
    target = randomInt(0, 3);
    shownAt = performance.now();
    promptLimit = Math.max(.7, 1.7 - g.score * .02);
    $("ddArrow").textContent = arrows[target];
  }

  function showLives() {
    $("ddLives").textContent = "♥ ".repeat(lives) + "♡ ".repeat(3 - lives);
  }

  function mistake() {
    lives--;
    streak = 0;
    showLives();
    $("ddStreak").textContent = "0";
    if (lives <= 0) {
      g.finish("You used all three lives.", g.score);
      return;
    }
    next();
  }

  function answer(index) {
    if (g.over) return;
    if (index !== target) {
      mistake();
      return;
    }
    streak++;
    g.score++;
    $("gameScore").textContent = g.score;
    $("ddStreak").textContent = streak;
    g.sound("score");
    g.vibrate(15);
    next();
  }

  buttons.addEventListener("click", event => {
    const button = event.target.closest("[data-dir]");
    if (button) answer(Number(button.dataset.dir));
  });

  const keyHandler = event => {
    const map = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 };
    if (map[event.key] !== undefined) {
      event.preventDefault();
      answer(map[event.key]);
    }
  };
  window.addEventListener("keydown", keyHandler);
  g.addCleanup(() => window.removeEventListener("keydown", keyHandler));

  prompt.addEventListener("pointerdown", event => {
    swipeStart = { x: event.clientX, y: event.clientY };
    prompt.setPointerCapture?.(event.pointerId);
  });

  prompt.addEventListener("pointerup", event => {
    if (!swipeStart) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
    answer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
  });

  showLives();
  next();

  function frame(now) {
    if (g.over) return;
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000));
    last = now;
    time -= dt;

    if (now - shownAt > promptLimit * 1000) {
      mistake();
      shownAt = now;
    }

    $("ddTime").textContent = `${Math.max(0, time).toFixed(1)}s`;
    $("ddTimer").style.transform = `scaleX(${Math.max(0, time / 25)})`;

    if (time <= 0) {
      g.finish("Time ran out.", g.score);
      return;
    }
    g.raf = requestAnimationFrame(frame);
  }

  g.raf = requestAnimationFrame(frame);
}
