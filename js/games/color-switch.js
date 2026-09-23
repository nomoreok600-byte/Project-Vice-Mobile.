export function colorSwitch(root, g, header) {
  const colors = [
    ["Coral", "#ca7167"], ["Sage", "#65836d"],
    ["Blue", "#6782a4"], ["Gold", "#c09b51"]
  ];
  let target = 0;

  root.innerHTML = `<div class="game-screen">
    ${header("Color Switch")}
    <div class="prompt"><div><strong id="csPrompt"></strong><small>Tap a matching tile.</small></div></div>
    <div class="tiles" id="csBoard"></div>
  </div>`;

  const board = $("csBoard");

  function round() {
    board.replaceChildren();
    target = Math.floor(Math.random() * colors.length);
    $("csPrompt").textContent = `Find ${colors[target][0]}`;

    const choices = Array.from({ length: 9 }, () => Math.floor(Math.random() * colors.length));
    choices[Math.floor(Math.random() * 9)] = target;

    choices.forEach(index => {
      const button = document.createElement("button");
      button.className = "tile";
      button.dataset.color = index;
      button.style.background = colors[index][1];
      button.setAttribute("aria-label", colors[index][0]);
      board.appendChild(button);
    });
  }

  board.addEventListener("click", event => {
    const button = event.target.closest("[data-color]");
    if (!button || g.over) return;
    if (Number(button.dataset.color) !== target) {
      g.finish("Wrong color.", g.score);
      return;
    }
    g.score++;
    $("gameScore").textContent = g.score;
    g.sound("score");
    round();
  });

  round();
}
