import { clamp, randomInt } from "../game-utils.js";

export function coinCatch(root, g, header) {
  const W = 360, H = 500;
  let basket = W / 2, objects = [], last = 0, elapsed = 0, spawn = 0;

  root.innerHTML = `<div class="game-screen">
    ${header("Coin Catch")}
    <p class="note">Drag across the playfield. Catch gold; avoid red hazards.</p>
    <div class="canvas-wrap"><canvas id="ccCanvas" width="${W}" height="${H}"></canvas></div>
    <p class="note">Survive for 30 seconds.</p>
  </div>`;

  const canvas = $("ccCanvas");
  const ctx = canvas.getContext("2d");

  function move(event) {
    const rect = canvas.getBoundingClientRect();
    basket = clamp((event.clientX - rect.left) * W / rect.width, 25, W - 25);
  }

  canvas.addEventListener("pointerdown", event => {
    canvas.setPointerCapture(event.pointerId);
    move(event);
  });
  canvas.addEventListener("pointermove", event => {
    if (event.buttons || event.pointerType === "touch") move(event);
  });

  function frame(now) {
    if (g.over) return;
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000));
    last = now;
    elapsed += dt;
    spawn += dt;

    if (spawn > .58) {
      spawn = 0;
      objects.push({
        x: randomInt(15, W - 15),
        y: -12,
        bad: Math.random() < .23,
        speed: 150 + Math.min(150, g.score * 4)
      });
    }

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#fbfcfa";
    ctx.fillRect(0, 0, W, H);

    for (const item of objects) {
      item.y += item.speed * dt;
      ctx.fillStyle = item.bad ? "#b84f4f" : "#bc9141";
      ctx.beginPath();
      ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#4d7059";
    ctx.fillRect(basket - 28, H - 38, 56, 13);

    for (let i = objects.length - 1; i >= 0; i--) {
      const item = objects[i];
      if (item.y > H - 52 && Math.abs(item.x - basket) < 38) {
        if (item.bad) {
          g.finish("You caught a hazard.", g.score);
          return;
        }
        g.score++;
        $("gameScore").textContent = g.score;
        g.sound("score");
        objects.splice(i, 1);
      } else if (item.y > H + 10) {
        objects.splice(i, 1);
      }
    }

    if (elapsed >= 30) {
      g.finish("Round complete!", g.score);
      return;
    }
    g.raf = requestAnimationFrame(frame);
  }

  g.raf = requestAnimationFrame(frame);
}
