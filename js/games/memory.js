import { $ } from "../game-utils.js";

export function memory(root, g, header) {
  let sequence = [], input = 0, round = 1, locked = true;

  root.innerHTML = `<div class="game-screen">
    ${header("Simon Says")}
    <div class="prompt"><div><strong id="memPrompt">Watch the sequence</strong><small>Repeat the lights in order.</small></div></div>
    <div class="pad-grid">
      <button class="pad" data-pad="0" style="background:#dcebe0">●</button>
      <button class="pad" data-pad="1" style="background:#e8e1f0">◆</button>
      <button class="pad" data-pad="2" style="background:#f1e3df">■</button>
      <button class="pad" data-pad="3" style="background:#e4eaf1">▲</button>
    </div>
  </div>`;

  const pads = [...document.querySelectorAll("[data-pad]")];

  function flash(index) {
    pads[index].classList.add("active");
    g.sound("tap");
    g.later(() => pads[index]?.classList.remove("active"), 250);
  }

  function show() {
    if (g.over) return;
    locked = true;
    input = 0;
    sequence.push(Math.floor(Math.random() * 4));
    $("memPrompt").textContent = `Round ${round} · Watch`;

    const delay = Math.max(300, 650 - round * 12);
    sequence.forEach((index, i) => g.later(() => flash(index), 400 + i * delay));

    g.later(() => {
      if (g.over) return;
      locked = false;
      $("memPrompt").textContent = `Round ${round} · Your turn`;
    }, 400 + sequence.length * delay);
  }

  pads.forEach(pad => pad.addEventListener("click", () => {
    if (locked || g.over) return;
    const choice = Number(pad.dataset.pad);
    flash(choice);

    if (choice !== sequence[input]) {
      g.finish("Sequence missed.", g.score);
      return;
    }

    input++;
    if (input === sequence.length) {
      g.score += round;
      $("gameScore").textContent = g.score;
      round++;
      g.sound("score");
      g.later(show, 450);
    }
  }));

  show();
}
