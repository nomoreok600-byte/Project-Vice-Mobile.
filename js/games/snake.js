import { randomInt } from "../game-utils.js";

export function snake(root, g, header) {
  const size = 18, canvasSize = 360, cell = canvasSize / size;
  let body = [{x:8,y:9},{x:7,y:9},{x:6,y:9}];
  let direction = {x:1,y:0}, nextDirection = {x:1,y:0};
  let food = {x:13,y:8}, obstacles = [];
  let last = 0, accumulator = 0, paused = false, swipe = null;

  root.innerHTML = `<div class="game-screen">
    ${header("Classic Snake")}
    <div class="row"><span id="snakeLevel">Level 1</span><button id="snakePause" class="small-button">Pause</button></div>
    <p class="note">Use arrow buttons, keyboard arrows, or swipe the board.</p>
    <div class="canvas-wrap"><canvas id="snakeCanvas" width="${canvasSize}" height="${canvasSize}"></canvas></div>
    <div class="controls">
      <button class="direction" data-dir="up">↑</button>
      <button class="direction" data-dir="left">←</button>
      <button class="direction" data-dir="down">↓</button>
      <button class="direction" data-dir="right">→</button>
    </div>
  </div>`;

  const canvas = $("snakeCanvas");
  const ctx = canvas.getContext("2d");

  function setDirection(x, y) {
    if (x === -direction.x && y === -direction.y) return;
    nextDirection = {x, y};
  }

  function keyboard(event) {
    const keys = {
      ArrowUp:[0,-1], ArrowDown:[0,1],
      ArrowLeft:[-1,0], ArrowRight:[1,0]
    };
    if (keys[event.key]) {
      event.preventDefault();
      setDirection(...keys[event.key]);
    }
  }

  window.addEventListener("keydown", keyboard);
  g.addCleanup(() => window.removeEventListener("keydown", keyboard));

  document.querySelectorAll("[data-dir]").forEach(button => {
    button.addEventListener("click", () => {
      const d = button.dataset.dir;
      setDirection(
        d === "left" ? -1 : d === "right" ? 1 : 0,
        d === "up" ? -1 : d === "down" ? 1 : 0
      );
    });
  });

  $("snakePause").addEventListener("click", () => {
    paused = !paused;
    $("snakePause").textContent = paused ? "Resume" : "Pause";
  });

  canvas.addEventListener("pointerdown", event => {
    swipe = {x:event.clientX, y:event.clientY};
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointerup", event => {
    if (!swipe) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    swipe = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) setDirection(dx > 0 ? 1 : -1, 0);
    else setDirection(0, dy > 0 ? 1 : -1);
  });

  function placeFood() {
    let attempts = 0;
    do {
      food = {x:randomInt(0,size-1), y:randomInt(0,size-1)};
      attempts++;
    } while (
      attempts < 400 &&
      (body.some(p => p.x === food.x && p.y === food.y) ||
       obstacles.some(p => p.x === food.x && p.y === food.y))
    );
  }

  function frame(now) {
    if (g.over) return;
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000));
    last = now;

    if (!paused) accumulator += dt;
    const step = Math.max(.07, .15 - g.score * .002);

    while (!paused && accumulator >= step) {
      accumulator -= step;
      direction = nextDirection;
      const head = {x:body[0].x + direction.x, y:body[0].y + direction.y};
      const eating = head.x === food.x && head.y === food.y;
      const checkedBody = eating ? body : body.slice(0, -1);

      const collision =
        head.x < 0 || head.x >= size || head.y < 0 || head.y >= size ||
        checkedBody.some(p => p.x === head.x && p.y === head.y) ||
        obstacles.some(p => p.x === head.x && p.y === head.y);

      if (collision) {
        g.finish("Snake hit an obstacle.", g.score);
        return;
      }

      body.unshift(head);

      if (eating) {
        g.score++;
        $("gameScore").textContent = g.score;
        $("snakeLevel").textContent = `Level ${1 + Math.floor(g.score / 5)}`;
        g.sound("score");

        // Add a block obstacle every five foods.
        if (g.score % 5 === 0 && g.score < 40) {
          obstacles.push({x:randomInt(2,size-3), y:randomInt(2,size-3)});
        }

        placeFood();
      } else {
        body.pop();
      }
    }

    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = "#fbfcfa";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.fillStyle = "#bc9141";
    ctx.beginPath();
    ctx.arc(food.x * cell + cell/2, food.y * cell + cell/2, cell*.32, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = "#b7b9b1";
    obstacles.forEach(p => ctx.fillRect(p.x*cell+2,p.y*cell+2,cell-4,cell-4));

    body.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? "#4d7059" : "#9bad9e";
      ctx.fillRect(p.x*cell+2,p.y*cell+2,cell-4,cell-4);
    });

    g.raf = requestAnimationFrame(frame);
  }

  g.raf = requestAnimationFrame(frame);
}
