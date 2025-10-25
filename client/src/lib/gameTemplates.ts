import { type FileNode } from './fileSystem';

export interface GameTemplate {
  id: string;
  title: string;
  description: string;
  tags: string[];
  files: FileNode[];
}

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'platformer',
    title: 'Platformer',
    description: 'Classic 2D platformer with physics',
    tags: ['2D', 'Physics', 'Arcade'],
    files: [
      {
        name: 'index.html',
        type: 'file',
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Platformer Game</title>
  <link rel="stylesheet" href="src/styles.css">
</head>
<body>
  <canvas id="gameCanvas"></canvas>
  <div id="controls">
    <p>Arrow Keys to Move | Space to Jump</p>
    <p>Score: <span id="score">0</span></p>
  </div>
  <script src="src/game.js"></script>
</body>
</html>`
      },
      {
        name: 'src',
        type: 'folder',
        path: 'src',
        children: [
          {
            name: 'game.js',
            type: 'file',
            path: 'src/game.js',
            content: `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 400;

const player = {
  x: 50,
  y: 200,
  width: 30,
  height: 30,
  velocityX: 0,
  velocityY: 0,
  speed: 5,
  jumpPower: 12,
  onGround: false
};

const platforms = [
  { x: 0, y: 350, width: 800, height: 50 },
  { x: 200, y: 250, width: 150, height: 20 },
  { x: 500, y: 200, width: 150, height: 20 }
];

let score = 0;
const keys = {};

document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

function update() {
  if (keys['ArrowLeft']) player.velocityX = -player.speed;
  else if (keys['ArrowRight']) player.velocityX = player.speed;
  else player.velocityX = 0;

  if (keys['Space'] && player.onGround) {
    player.velocityY = -player.jumpPower;
    player.onGround = false;
  }

  player.velocityY += 0.5; // gravity
  player.x += player.velocityX;
  player.y += player.velocityY;

  player.onGround = false;
  platforms.forEach(platform => {
    if (player.x + player.width > platform.x &&
        player.x < platform.x + platform.width &&
        player.y + player.height > platform.y &&
        player.y < platform.y + platform.height) {
      player.y = platform.y - player.height;
      player.velocityY = 0;
      player.onGround = true;
    }
  });

  score++;
  document.getElementById('score').textContent = Math.floor(score / 60);
}

function draw() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#9b87f5';
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = '#6c5ce7';
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();`
          },
          {
            name: 'styles.css',
            type: 'file',
            path: 'src/styles.css',
            content: `body {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0f0f23;
  font-family: 'Inter', sans-serif;
  color: white;
}

#gameCanvas {
  border: 2px solid #9b87f5;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(155, 135, 245, 0.3);
}

#controls {
  margin-top: 20px;
  text-align: center;
}

#controls p {
  margin: 5px 0;
  color: #9b87f5;
}`
          }
        ]
      }
    ]
  },
  {
    id: 'space-shooter',
    title: 'Space Shooter',
    description: 'Top-down space combat game',
    tags: ['2D', 'Shooter', 'Arcade'],
    files: [
      {
        name: 'index.html',
        type: 'file',
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Space Shooter</title>
  <link rel="stylesheet" href="src/styles.css">
</head>
<body>
  <canvas id="gameCanvas"></canvas>
  <div id="hud">
    <p>Score: <span id="score">0</span> | HP: <span id="hp">100</span></p>
    <p>Mouse to Move | Click to Shoot</p>
  </div>
  <script src="src/game.js"></script>
</body>
</html>`
      },
      {
        name: 'src',
        type: 'folder',
        path: 'src',
        children: [
          {
            name: 'game.js',
            type: 'file',
            path: 'src/game.js',
            content: `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 800;

const player = { x: 300, y: 700, size: 20, hp: 100 };
const bullets = [];
const enemies = [];
let score = 0;
let mouseX = 300, mouseY = 700;

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', () => {
  bullets.push({ x: player.x, y: player.y - 10, size: 5 });
});

function spawnEnemy() {
  enemies.push({
    x: Math.random() * (canvas.width - 30),
    y: -30,
    size: 30,
    speed: 2 + Math.random() * 2
  });
}

setInterval(spawnEnemy, 1000);

function update() {
  player.x = mouseX;
  player.y = mouseY;

  bullets.forEach((b, i) => {
    b.y -= 10;
    if (b.y < 0) bullets.splice(i, 1);
  });

  enemies.forEach((e, i) => {
    e.y += e.speed;
    if (e.y > canvas.height) {
      enemies.splice(i, 1);
      player.hp -= 10;
      document.getElementById('hp').textContent = player.hp;
    }

    bullets.forEach((b, j) => {
      const dist = Math.hypot(e.x - b.x, e.y - b.y);
      if (dist < e.size) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score += 100;
        document.getElementById('score').textContent = score;
      }
    });
  });

  if (player.hp <= 0) {
    alert('Game Over! Score: ' + score);
    location.reload();
  }
}

function draw() {
  ctx.fillStyle = '#000011';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#9b87f5';
  ctx.fillRect(player.x - 10, player.y - 10, player.size, player.size);

  ctx.fillStyle = '#fff';
  bullets.forEach(b => ctx.fillRect(b.x - 2, b.y - 5, 4, 10));

  ctx.fillStyle = '#ff6b6b';
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.size, e.size));
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();`
          },
          {
            name: 'styles.css',
            type: 'file',
            path: 'src/styles.css',
            content: `body {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #000011;
  font-family: 'Courier New', monospace;
  color: #9b87f5;
}

#gameCanvas {
  border: 2px solid #9b87f5;
  border-radius: 8px;
  cursor: crosshair;
  box-shadow: 0 0 30px rgba(155, 135, 245, 0.5);
}

#hud {
  margin-top: 15px;
  text-align: center;
}`
          }
        ]
      }
    ]
  },
  {
    id: 'puzzle',
    title: 'Puzzle Game',
    description: 'Match-3 style puzzle mechanics',
    tags: ['2D', 'Puzzle', 'Casual'],
    files: [
      {
        name: 'index.html',
        type: 'file',
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Puzzle Match</title>
  <link rel="stylesheet" href="src/styles.css">
</head>
<body>
  <div id="game">
    <h1>✨ Puzzle Match ✨</h1>
    <p>Score: <span id="score">0</span></p>
    <div id="grid"></div>
    <button id="resetBtn">New Game</button>
  </div>
  <script src="src/game.js"></script>
</body>
</html>`
      },
      {
        name: 'src',
        type: 'folder',
        path: 'src',
        children: [
          {
            name: 'game.js',
            type: 'file',
            path: 'src/game.js',
            content: `const GRID_SIZE = 8;
const COLORS = ['🔴', '🟡', '🟢', '🔵', '🟣'];
let grid = [];
let score = 0;
let selected = null;

function createGrid() {
  grid = Array(GRID_SIZE).fill(0).map(() =>
    Array(GRID_SIZE).fill(0).map(() =>
      COLORS[Math.floor(Math.random() * COLORS.length)]
    )
  );
}

function renderGrid() {
  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';
  
  grid.forEach((row, i) => {
    row.forEach((cell, j) => {
      const cellEl = document.createElement('div');
      cellEl.className = 'cell';
      cellEl.textContent = cell;
      cellEl.onclick = () => selectCell(i, j);
      if (selected && selected.i === i && selected.j === j) {
        cellEl.classList.add('selected');
      }
      gridEl.appendChild(cellEl);
    });
  });
}

function selectCell(i, j) {
  if (!selected) {
    selected = { i, j };
  } else {
    const di = Math.abs(selected.i - i);
    const dj = Math.abs(selected.j - j);
    
    if ((di === 1 && dj === 0) || (di === 0 && dj === 1)) {
      swap(selected.i, selected.j, i, j);
      checkMatches();
    }
    selected = null;
  }
  renderGrid();
}

function swap(i1, j1, i2, j2) {
  [grid[i1][j1], grid[i2][j2]] = [grid[i2][j2], grid[i1][j1]];
}

function checkMatches() {
  let found = false;
  
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE - 2; j++) {
      if (grid[i][j] === grid[i][j+1] && grid[i][j] === grid[i][j+2]) {
        grid[i][j] = grid[i][j+1] = grid[i][j+2] = null;
        score += 30;
        found = true;
      }
    }
  }
  
  for (let j = 0; j < GRID_SIZE; j++) {
    for (let i = 0; i < GRID_SIZE - 2; i++) {
      if (grid[i][j] === grid[i+1][j] && grid[i][j] === grid[i+2][j]) {
        grid[i][j] = grid[i+1][j] = grid[i+2][j] = null;
        score += 30;
        found = true;
      }
    }
  }
  
  if (found) {
    document.getElementById('score').textContent = score;
    setTimeout(() => {
      fillEmpty();
      checkMatches();
    }, 300);
  }
}

function fillEmpty() {
  for (let j = 0; j < GRID_SIZE; j++) {
    for (let i = GRID_SIZE - 1; i >= 0; i--) {
      if (grid[i][j] === null) {
        for (let k = i; k > 0; k--) {
          grid[k][j] = grid[k-1][j];
        }
        grid[0][j] = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
    }
  }
  renderGrid();
}

document.getElementById('resetBtn').onclick = () => {
  score = 0;
  document.getElementById('score').textContent = score;
  createGrid();
  renderGrid();
};

createGrid();
renderGrid();`
          },
          {
            name: 'styles.css',
            type: 'file',
            path: 'src/styles.css',
            content: `body {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Arial', sans-serif;
}

#game {
  text-align: center;
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

h1 {
  color: #667eea;
  margin: 0 0 10px 0;
}

#grid {
  display: grid;
  grid-template-columns: repeat(8, 50px);
  gap: 5px;
  margin: 20px auto;
  width: fit-content;
}

.cell {
  width: 50px;
  height: 50px;
  background: #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.cell:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.cell.selected {
  background: #ffeb3b;
  transform: scale(1.15);
}

#resetBtn {
  margin-top: 20px;
  padding: 12px 30px;
  font-size: 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

#resetBtn:hover {
  background: #764ba2;
}`
          }
        ]
      }
    ]
  }
];
