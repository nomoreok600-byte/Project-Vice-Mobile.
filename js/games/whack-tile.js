import { randomInt } from "../game-utils.js";

export function whackTile(root, g, header) {
  let target = 0, danger = -1, time = 25, last = 0, elapsed = 0;

  root.innerHTML = `<div class="game-screen">
    ${header("Whack-a-Tile")}
    <div class="row"><span>Time</span><b id="whTime">25s</b></div>
    <div class="track"><div id="whTimer" class="fill"></div></div>
    <div class="prompt"><div><strong>Tap the target</strong><small>Avoid the red danger tile.</small></div></div>
    <div class="tiles" id="whBoard"></div>
    <p id="whLives" class="note">Lives: ♥ ♥ ♥</p>
  </div>`;

  const board = $("whBoard");
  let lives = 3;

  function round() {
    board.replaceChildren();
    target = randomInt(0,8);
    danger = Math.random() < .55 ? randomInt(0,8) : -1;
    if (danger === target) danger = (danger + 1) % 9;

    for (let i=0;i<9;i++) {
      const button=document.createElement("button");
      button.className="tile";
      button.dataset.i=i;

      if(i===target) {
        button.classList.add("target");
        button.textContent="●";
        button.setAttribute("aria-label","Target");
      } else if(i===danger) {
        button.classList.add("bad");
        button.textContent="!";
        button.setAttribute("aria-label","Danger");
      }

      board.appendChild(button);
    }
  }

  board.addEventListener("click",event=>{
    const button=event.target.closest("[data-i]");
    if(!button||g.over)return;
    const index=Number(button.dataset.i);

    if(index===danger) {
      lives--;
      $("whLives").textContent="Lives: "+"♥ ".repeat(lives)+"♡ ".repeat(3-lives);
      g.sound("error");
      g.vibrate(45);
      if(lives<=0) {
        g.finish("You hit too many danger tiles.",g.score);
        return;
      }
      round();
      return;
    }

    if(index!==target) {
      lives--;
      $("whLives").textContent="Lives: "+"♥ ".repeat(lives)+"♡ ".repeat(3-lives);
      if(lives<=0) {
        g.finish("Too many missed taps.",g.score);
        return;
      }
      round();
      return;
    }

    g.score++;
    $("gameScore").textContent=g.score;
    g.sound("score");
    g.vibrate(15);
    round();
  });

  round();

  function frame(now) {
    if(g.over)return;
    const dt=Math.min(.05,Math.max(0,(now-last)/1000));
    last=now;
    elapsed+=dt;
    time-=dt;

    $("whTime").textContent=`${Math.max(0,time).toFixed(1)}s`;
    $("whTimer").style.transform=`scaleX(${Math.max(0,time/25)})`;

    if(time<=0) {
      g.finish(`Round complete after ${Math.floor(elapsed)} seconds.`,g.score);
      return;
    }
    g.raf=requestAnimationFrame(frame);
  }

  g.raf=requestAnimationFrame(frame);
}
