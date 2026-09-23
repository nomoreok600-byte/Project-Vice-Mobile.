export function gridTap(root, g, header) {
  let target = 0, time = 5, rival = 0, progress = 0, last = 0;

  root.innerHTML = `<div class="game-screen">
    ${header("Grid Tap Blitz", 0, 0)}
    <div class="row"><span>Time · correct taps add time</span><b id="gtTime">5.0s</b></div>
    <div class="track"><div id="gtTimer" class="fill"></div></div>
    <div class="row"><span>AI rival</span><b id="gtSpeed"></b></div>
    <div class="track"><div id="gtAI" class="fill"></div></div>
    <div class="prompt"><div><strong>Tap the ◆</strong><small>Wrong tile ends the game.</small></div></div>
    <div class="tiles" id="gtBoard"></div>
  </div>`;

  const board = $("gtBoard");

  function newRound() {
    board.replaceChildren();
    target = Math.floor(Math.random() * 9);
    for (let i = 0; i < 9; i++) {
      const button = document.createElement("button");
      button.className = "tile" + (i === target ? " target" : "");
      button.textContent = i === target ? "◆" : "";
      button.dataset.i = i;
      board.appendChild(button);
    }
  }

  board.addEventListener("click", event => {
    const tile = event.target.closest("[data-i]");
    if (!tile || g.over) return;
    if (Number(tile.dataset.i) !== target) {
      g.finish(`Wrong tile. The rival scored ${rival}.`, g.score);
      return;
    }
    g.score++;
    $("gameScore").textContent = g.score;
    time = Math.min(8, time + 0.4);
    g.sound("score");
    g.vibrate(18);
    newRound();
  });

  newRound();

  function frame(now) {
    if (g.over) return;
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000));
    last = now;
    time -= dt;

    const aiSeconds = Math.max(.22, .62 - g.score * .004);
    progress += dt / aiSeconds;
    if (progress >= 1) {
      const gained = Math.floor(progress);
      rival += gained;
      progress -= gained;
      $("rivalScore").textContent = rival;
    }

    $("gtSpeed").textContent = `${aiSeconds.toFixed(2)}s / point`;
    $("gtTime").textContent = `${Math.max(0, time).toFixed(1)}s`;
    $("gtTimer").style.transform = `scaleX(${Math.max(0, time / 8)})`;
    $("gtAI").style.transform = `scaleX(${progress})`;

    if (time <= 0) {
      g.finish(`Time ran out. Rival score: ${rival}.`, g.score);
      return;
    }
    g.raf = requestAnimationFrame(frame);
  }

  g.raf = requestAnimationFrame(frame);
}
