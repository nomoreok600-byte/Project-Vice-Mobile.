export function beatTap(root, g, header) {
  let phase = 0, direction = 1, last = 0, misses = 0;

  root.innerHTML = `<div class="game-screen">
    ${header("Beat Tap")}
    <div class="prompt"><div><strong>Tap when the pulse is centered</strong><small>Three misses end the run.</small></div></div>
    <div class="canvas-wrap"><canvas id="beatCanvas" width="360" height="150"></canvas></div>
    <div class="controls"><button class="choice" id="beatButton">TAP BEAT</button></div>
    <p id="beatNote" class="note">Misses: 0 / 3</p>
  </div>`;

  $("beatButton").addEventListener("click", () => {
    if (g.over) return;
    const windowSize = Math.max(.045, .15 - g.score * .002);
    if (Math.abs(phase - .5) < windowSize) {
      g.score++;
      $("gameScore").textContent = g.score;
      g.sound("score");
      g.vibrate(22);
    } else {
      misses++;
      $("beatNote").textContent = `Misses: ${misses} / 3`;
      g.sound("error");
      if (misses >= 3) g.finish("You missed three beats.", g.score);
    }
  });

  const canvas = $("beatCanvas");
  const ctx = canvas.getContext("2d");

  function frame(now) {
    if (g.over) return;
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000));
    last = now;

    const duration = Math.max(.5, 1.2 - g.score * .02);
    phase += direction * dt / duration;
    if (phase >= 1) { phase = 1; direction = -1; }
    if (phase <= 0) { phase = 0; direction = 1; }

    ctx.clearRect(0, 0, 360, 150);
    ctx.strokeStyle = "#dfe3dc";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(24, 75); ctx.lineTo(336, 75); ctx.stroke();
    ctx.fillStyle = "#e7efe8";
    ctx.fillRect(163, 42, 34, 66);
    ctx.fillStyle = "#4d7059";
    ctx.beginPath(); ctx.arc(24 + 312 * phase, 75, 13, 0, Math.PI * 2); ctx.fill();

    g.raf = requestAnimationFrame(frame);
  }

  g.raf = requestAnimationFrame(frame);
}
