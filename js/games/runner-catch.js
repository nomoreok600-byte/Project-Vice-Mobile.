import { randomInt } from "../game-utils.js";

export function runnerCatch(root, g, header) {
  const W = 360, H = 500;
  let lane = 1, items = [], last = 0, elapsed = 0, spawn = 0;
  let swipeX = null;

  root.innerHTML = `<div class="game-screen">
    ${header("Runner Catch")}
    <div class="row"><span>Catch green runners</span><span>Red hazards cost a life</span></div>
    <div class="canvas-wrap"><canvas id="runnerCanvas" width="${W}" height="${H}"></canvas></div>
    <div class="controls">
      <button class="direction" id="runnerLeft">←</button>
      <button class="direction" id="runnerRight">→</button>
    </div>
    <p class="note">Move between lanes. Three misses end the run.</p>
  </div>`;

  const canvas = $("runnerCanvas"), ctx = canvas.getContext("2d");
  let lives = 3;

  function move(delta) { lane = Math.max(0, Math.min(2, lane + delta)); }

  $("runnerLeft").addEventListener("click", () => move(-1));
  $("runnerRight").addEventListener("click", () => move(1));

  canvas.addEventListener("pointerdown", event => {
    swipeX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointerup", event => {
    if (swipeX === null) return;
    const dx = event.clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 20) move(dx > 0 ? 1 : -1);
  });

  const key = event => {
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
  };
  window.addEventListener("keydown", key);
  g.addCleanup(() => window.removeEventListener("keydown", key));

  function frame(now) {
    if (g.over) return;
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000));
    last = now;
    elapsed += dt;
    spawn += dt;

    if (spawn > Math.max(.34, .72 - g.score * .008)) {
      spawn = 0;
      items.push({
        lane: randomInt(0,2),
        y: -15,
        hazard: Math.random() < .22,
        speed: 155 + Math.min(130, g.score * 3)
      });
    }

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "#fbfcfa";
    ctx.fillRect(0,0,W,H);

    const laneX = [75,180,285];
    ctx.strokeStyle = "#e5e8e2";
    ctx.setLineDash([6,8]);
    ctx.beginPath(); ctx.moveTo(127,0); ctx.lineTo(127,H); ctx.moveTo(232,0); ctx.lineTo(232,H); ctx.stroke();
    ctx.setLineDash([]);

    for (const item of items) {
      item.y += item.speed * dt;
      ctx.fillStyle = item.hazard ? "#b84f4f" : "#4d8a61";
      ctx.beginPath();
      ctx.arc(laneX[item.lane],item.y,13,0,Math.PI*2);
      ctx.fill();
    }

    ctx.fillStyle = "#4d7059";
    ctx.beginPath();
    ctx.roundRect(laneX[lane]-18,H-65,36,42,10);
    ctx.fill();

    for (let i=items.length-1;i>=0;i--) {
      const item=items[i];
      if(item.y>=H-80) {
        if(item.lane===lane) {
          if(item.hazard) {
            lives--;
            g.vibrate(50);
            if(lives<=0) {
              g.finish("You hit too many hazards.",g.score);
              return;
            }
          } else {
            g.score++;
            $("gameScore").textContent=g.score;
            g.sound("score");
          }
          items.splice(i,1);
        } else if(item.y>H-35) {
          if(!item.hazard) {
            lives--;
            if(lives<=0) {
              g.finish("Too many runners escaped.",g.score);
              return;
            }
          }
          items.splice(i,1);
        }
      }
    }

    if(elapsed>45) {
      g.finish("Excellent run!",g.score);
      return;
    }

    g.raf=requestAnimationFrame(frame);
  }

  g.raf=requestAnimationFrame(frame);
}
