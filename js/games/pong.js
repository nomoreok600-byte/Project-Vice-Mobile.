import { clamp } from "../game-utils.js";

export function pong(root, g, header) {
  root.innerHTML = `<div class="game-screen">
    ${header("Pong Solo", 0, 0)}
    <p class="note">Drag on the court to move your paddle. First to 5 wins.</p>
    <div class="canvas-wrap"><canvas id="pongCanvas" width="360" height="500"></canvas></div>
    <div class="controls"><button class="direction" id="pLeft">◀</button><button class="direction" id="pRight">▶</button></div>
  </div>`;

  const canvas = $("pongCanvas"), ctx = canvas.getContext("2d");
  let py = 210, ay = 210, x = 180, y = 250, vx = 3, vy = 2;
  let player = 0, rival = 0, held = 0;

  function move(event) {
    const r = canvas.getBoundingClientRect();
    py = clamp((event.clientY - r.top) * canvas.height / r.height - 34, 0, 432);
  }

  canvas.addEventListener("pointerdown", event => {
    canvas.setPointerCapture(event.pointerId);
    move(event);
  });
  canvas.addEventListener("pointermove", event => {
    if (event.buttons || event.pointerType === "touch") move(event);
  });

  for (const [id, direction] of [["pLeft", -1], ["pRight", 1]]) {
    const button = $(id);
    const down = () => held = direction;
    const up = () => held = 0;
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    g.addCleanup(() => {
      button.removeEventListener("pointerdown", down);
      button.removeEventListener("pointerup", up);
      button.removeEventListener("pointercancel", up);
    });
  }

  function reset(direction) {
    x = 180; y = 250;
    vx = direction * 3;
    vy = (Math.random() - .5) * 4;
  }

  function frame() {
    if (g.over) return;

    ctx.clearRect(0, 0, 360, 500);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 360, 500);
    ctx.strokeStyle = "#ddd";
    ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(180, 0); ctx.lineTo(180, 500); ctx.stroke();
    ctx.setLineDash([]);

    py = clamp(py + held * 5, 0, 432);
    ay = clamp(ay + (y - 34 - ay) * clamp(.42 + g.score * .04, .42, .9), 0, 432);

    ctx.fillStyle = "#4d7059";
    ctx.fillRect(12, py, 9, 68);
    ctx.fillRect(339, ay, 9, 68);
    ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();

    x += vx; y += vy;
    if (y < 8 || y > 492) vy *= -1;

    if (vx < 0 && x < 28 && y > py - 5 && y < py + 73) {
      vx = Math.abs(vx) * 1.04;
      vy += (y - py - 34) * .04;
    }
    if (vx > 0 && x > 332 && y > ay - 5 && y < ay + 73) {
      vx = -Math.abs(vx) * 1.04;
    }

    if (x < 0) {
      rival++;
      $("rivalScore").textContent = rival;
      reset(1);
    } else if (x > 360) {
      player++;
      g.score = player;
      $("gameScore").textContent = player;
      g.sound("score");
      reset(-1);
    }

    if (player >= 5 || rival >= 5) {
      g.finish(player > rival ? "You won the rally!" : "The rival won the rally.", player);
      return;
    }
    g.raf = requestAnimationFrame(frame);
  }

  g.raf = requestAnimationFrame(frame);
}
