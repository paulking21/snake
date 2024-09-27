const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const canvasSize = { width: 800, height: 600 };
canvas.width = canvasSize.width;
canvas.height = canvasSize.height;

let snake = [{ x: 10, y: 10 }];
let food = { type: 'normal' };
const foodTypes = [
  { type: 'apple', points: 1, description: 'Regular food' },
  { type: 'banana', points: 2, description: 'Double points' },
  { type: 'orange', points: 1, description: 'Speed boost' },
  { type: 'mouse', points: 3, description: 'Triple points and grow' }
];
let powerUp = {};
let direction = 'right';
let score = 0;
let highScore = 0;
let highScoreName = '';
let gameOver = false;
let gameMode = 'classic';
let gameSpeed = 100;
let obstacles = [];
let powerUpActive = false;
let powerUpType = '';
let gameStarted = false;

const API_KEY = '$2a$10$aEF3uzq5UJs6adL0gHK3Ju5AICQj278w8SiwHSD14d0cpS98Ws9tu';
const BIN_ID = '66f6ee2facd3cb34a88d369f';

const powerUpTypes = ['speed', 'invincibility', 'magnet'];
const gameModes = {
  classic: { speed: 100, obstacleCount: 0 },
  speed: { speed: 50, obstacleCount: 0 },
  maze: { speed: 100, obstacleCount: 10 }
};

const sounds = {
  eat: new Audio('https://example.com/eat.mp3'),
  powerUp: new Audio('https://example.com/powerup.mp3'),
  gameOver: new Audio('https://example.com/gameover.mp3')
};

function initGame() {
  loadHighScore();
  resetGame();
  updateUI();
  createLegend();
  setupInfoIcon();
  gameLoop();
}

function setupInfoIcon() {
  const infoIcon = document.getElementById('info-icon');
  const legend = document.getElementById('legend');
  infoIcon.addEventListener('click', () => {
    if (legend.style.display === 'none' || legend.style.display === '') {
      legend.style.display = 'block';
    } else {
      legend.style.display = 'none';
    }
  });
}

function createLegend() {
  const legendItems = document.getElementById('legend-items');
  legendItems.innerHTML = '';
  foodTypes.forEach(food => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <canvas class="legend-canvas" width="40" height="40"></canvas>
      <span>${food.type}: ${food.points} point${food.points > 1 ? 's' : ''}</span>
    `;
    legendItems.appendChild(item);
    
    const canvas = item.querySelector('.legend-canvas');
    const ctx = canvas.getContext('2d');
    drawFood(ctx, food.type, 20, 20, 16);
  });
}

function drawFood(ctx, type, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  
  switch (type) {
    case 'apple':
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'darkred';
      ctx.stroke();
      break;
    case 'banana':
      ctx.fillStyle = 'yellow';
      ctx.beginPath();
      ctx.ellipse(0, 0, size / 2, size / 4, Math.PI / 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'orange';
      ctx.stroke();
      break;
    case 'orange':
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'darkorange';
      ctx.stroke();
      break;
    case 'mouse':
      ctx.fillStyle = 'gray';
      ctx.beginPath();
      ctx.ellipse(0, 0, size / 2, size / 3, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'darkgray';
      ctx.stroke();
      // Ears
      ctx.beginPath();
      ctx.ellipse(-size / 4, -size / 3, size / 8, size / 8, 0, 0, 2 * Math.PI);
      ctx.ellipse(size / 4, -size / 3, size / 8, size / 8, 0, 0, 2 * Math.PI);
      ctx.fill();
      break;
  }
  
  ctx.restore();
}

function resetGame() {
  snake = [{ x: 10, y: 10 }];
  direction = 'right';
  score = 0;
  gameOver = false;
  powerUpActive = false;
  gameSpeed = gameModes[gameMode].speed;
  gameStarted = false;
  generateObstacles();
  generateFood();
  generatePowerUp();
}

function generateObstacles() {
  obstacles = [];
  const obstacleCount = gameModes[gameMode].obstacleCount;
  for (let i = 0; i < obstacleCount; i++) {
    obstacles.push({
      x: Math.floor(Math.random() * (canvasSize.width / gridSize)),
      y: Math.floor(Math.random() * (canvasSize.height / gridSize)),
      width: Math.floor(Math.random() * 3) + 1,
      height: Math.floor(Math.random() * 3) + 1
    });
  }
}

function generateFood() {
  do {
    food = {
      x: Math.floor(Math.random() * (canvasSize.width / gridSize)),
      y: Math.floor(Math.random() * (canvasSize.height / gridSize)),
      type: foodTypes[Math.floor(Math.random() * foodTypes.length)]
    };
  } while (isOnSnake(food) || isOnObstacle(food));
}

function generatePowerUp() {
  if (Math.random() < 0.1) {
    do {
      powerUp = {
        x: Math.floor(Math.random() * (canvasSize.width / gridSize)),
        y: Math.floor(Math.random() * (canvasSize.height / gridSize)),
        type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
      };
    } while (isOnSnake(powerUp) || isOnObstacle(powerUp) || (powerUp.x === food.x && powerUp.y === food.y));
  } else {
    powerUp = {};
  }
}

function isOnSnake(position) {
  return snake.some(segment => segment.x === position.x && segment.y === position.y);
}

function isOnObstacle(position) {
  return obstacles.some(obstacle =>
    position.x >= obstacle.x && position.x < obstacle.x + obstacle.width &&
    position.y >= obstacle.y && position.y < obstacle.y + obstacle.height
  );
}

function moveSnake() {
  const head = { ...snake[0] };

  switch (direction) {
    case 'up': head.y--; break;
    case 'down': head.y++; break;
    case 'left': head.x--; break;
    case 'right': head.x++; break;
  }

  if (powerUpActive && powerUpType === 'magnet') {
    const dx = food.x - head.x;
    const dy = food.y - head.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      head.x += Math.sign(dx);
    } else {
      head.y += Math.sign(dy);
    }
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    sounds.eat.play();
    switch (food.type.type) {
      case 'apple':
        score++;
        break;
      case 'banana':
        score += 2;
        break;
      case 'orange':
        score++;
        gameSpeed = Math.max(gameSpeed - 10, 50);
        setTimeout(() => { gameSpeed = gameModes[gameMode].speed; }, 5000);
        break;
      case 'mouse':
        score += 3;
        snake.push({...snake[snake.length - 1]});
        break;
    }
    generateFood();
    generatePowerUp();
  } else {
    snake.pop();
  }

  if (head.x === powerUp.x && head.y === powerUp.y) {
    activatePowerUp(powerUp.type);
    sounds.powerUp.play();
    powerUp = {};
  }
}

function activatePowerUp(type) {
  powerUpActive = true;
  powerUpType = type;
  setTimeout(() => {
    powerUpActive = false;
    powerUpType = '';
  }, 5000);
}

function checkCollision() {
  const head = snake[0];

  if (powerUpActive && powerUpType === 'invincibility') return;

  if (head.x < 0 || head.x >= canvasSize.width / gridSize ||
      head.y < 0 || head.y >= canvasSize.height / gridSize ||
      isOnObstacle(head) ||
      snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver = true;
    sounds.gameOver.play();
    showGameOver();
  }
}

let tongueOut = false;
let tongueTimer = 0;

function drawGame() {
  ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

  // Draw snake
  snake.forEach((segment, index) => {
    const gradient = ctx.createRadialGradient(
      (segment.x + 0.5) * gridSize, (segment.y + 0.5) * gridSize, 0,
      (segment.x + 0.5) * gridSize, (segment.y + 0.5) * gridSize, gridSize / 2
    );
    gradient.addColorStop(0, powerUpActive ? 'yellow' : 'lightgreen');
    gradient.addColorStop(1, powerUpActive ? 'gold' : 'green');
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.arc((segment.x + 0.5) * gridSize, (segment.y + 0.5) * gridSize, gridSize / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Draw eyes and tongue for the head
    if (index === 0) {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc((segment.x + 0.3) * gridSize, (segment.y + 0.3) * gridSize, gridSize / 6, 0, 2 * Math.PI);
      ctx.arc((segment.x + 0.7) * gridSize, (segment.y + 0.3) * gridSize, gridSize / 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc((segment.x + 0.3) * gridSize, (segment.y + 0.3) * gridSize, gridSize / 10, 0, 2 * Math.PI);
      ctx.arc((segment.x + 0.7) * gridSize, (segment.y + 0.3) * gridSize, gridSize / 10, 0, 2 * Math.PI);
      ctx.fill();

      // Draw tongue
      if (tongueOut) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = gridSize / 10;
        ctx.beginPath();
        let tongueLength = gridSize * 0.4;
        let tongueFork = gridSize * 0.2;
        let tongueX = (segment.x + 0.5) * gridSize;
        let tongueY = (segment.y + 0.5) * gridSize;
        
        switch(direction) {
          case 'up':
            ctx.moveTo(tongueX, tongueY - gridSize / 2);
            ctx.lineTo(tongueX, tongueY - gridSize / 2 - tongueLength);
            ctx.lineTo(tongueX - tongueFork, tongueY - gridSize / 2 - tongueLength - tongueFork);
            ctx.moveTo(tongueX, tongueY - gridSize / 2 - tongueLength);
            ctx.lineTo(tongueX + tongueFork, tongueY - gridSize / 2 - tongueLength - tongueFork);
            break;
          case 'down':
            ctx.moveTo(tongueX, tongueY + gridSize / 2);
            ctx.lineTo(tongueX, tongueY + gridSize / 2 + tongueLength);
            ctx.lineTo(tongueX - tongueFork, tongueY + gridSize / 2 + tongueLength + tongueFork);
            ctx.moveTo(tongueX, tongueY + gridSize / 2 + tongueLength);
            ctx.lineTo(tongueX + tongueFork, tongueY + gridSize / 2 + tongueLength + tongueFork);
            break;
          case 'left':
            ctx.moveTo(tongueX - gridSize / 2, tongueY);
            ctx.lineTo(tongueX - gridSize / 2 - tongueLength, tongueY);
            ctx.lineTo(tongueX - gridSize / 2 - tongueLength - tongueFork, tongueY - tongueFork);
            ctx.moveTo(tongueX - gridSize / 2 - tongueLength, tongueY);
            ctx.lineTo(tongueX - gridSize / 2 - tongueLength - tongueFork, tongueY + tongueFork);
            break;
          case 'right':
            ctx.moveTo(tongueX + gridSize / 2, tongueY);
            ctx.lineTo(tongueX + gridSize / 2 + tongueLength, tongueY);
            ctx.lineTo(tongueX + gridSize / 2 + tongueLength + tongueFork, tongueY - tongueFork);
            ctx.moveTo(tongueX + gridSize / 2 + tongueLength, tongueY);
            ctx.lineTo(tongueX + gridSize / 2 + tongueLength + tongueFork, tongueY + tongueFork);
            break;
        }
        ctx.stroke();
      }
    }
  });

  // Update tongue state
  tongueTimer++;
  if (tongueTimer >= 10) {
    tongueOut = !tongueOut;
    tongueTimer = 0;
  }

  // Draw food
  const centerX = (food.x + 0.5) * gridSize;
  const centerY = (food.y + 0.5) * gridSize;
  const size = gridSize * 0.8;

  ctx.lineWidth = 2;

  switch (food.type.type) {
    case 'apple':
      // Apple shape
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size / 2);
      ctx.quadraticCurveTo(centerX + size / 2, centerY - size / 2, centerX + size / 2, centerY);
      ctx.quadraticCurveTo(centerX + size / 2, centerY + size / 2, centerX, centerY + size / 2);
      ctx.quadraticCurveTo(centerX - size / 2, centerY + size / 2, centerX - size / 2, centerY);
      ctx.quadraticCurveTo(centerX - size / 2, centerY - size / 2, centerX, centerY - size / 2);
      ctx.fill();
      ctx.strokeStyle = 'darkred';
      ctx.stroke();
      // Stem
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size / 2);
      ctx.lineTo(centerX + size / 8, centerY - size / 2 - size / 4);
      ctx.strokeStyle = 'brown';
      ctx.stroke();
      break;
    case 'banana':
      // Banana shape
      ctx.fillStyle = 'yellow';
      ctx.beginPath();
      ctx.moveTo(centerX - size / 1.5, centerY);
      ctx.quadraticCurveTo(centerX, centerY - size / 1.5, centerX + size / 1.5, centerY);
      ctx.quadraticCurveTo(centerX, centerY + size / 3, centerX - size / 1.5, centerY);
      ctx.fill();
      ctx.strokeStyle = 'orange';
      ctx.stroke();
      // Add some details to the banana
      ctx.beginPath();
      ctx.moveTo(centerX - size / 2, centerY);
      ctx.quadraticCurveTo(centerX, centerY - size / 4, centerX + size / 2, centerY);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.stroke();
      break;
    case 'orange':
      // Orange shape
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'darkorange';
      ctx.stroke();
      // Leaf
      ctx.fillStyle = 'green';
      ctx.beginPath();
      ctx.ellipse(centerX + size / 4, centerY - size / 2, size / 8, size / 16, Math.PI / 4, 0, 2 * Math.PI);
      ctx.fill();
      break;
    case 'mouse':
      // Mouse body
      ctx.fillStyle = 'gray';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, size / 2, size / 3, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'darkgray';
      ctx.stroke();
      // Ears
      ctx.beginPath();
      ctx.ellipse(centerX - size / 4, centerY - size / 3, size / 8, size / 8, 0, 0, 2 * Math.PI);
      ctx.ellipse(centerX + size / 4, centerY - size / 3, size / 8, size / 8, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      // Eyes
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(centerX - size / 6, centerY - size / 8, size / 16, 0, 2 * Math.PI);
      ctx.arc(centerX + size / 6, centerY - size / 8, size / 16, 0, 2 * Math.PI);
      ctx.fill();
      // Whiskers
      ctx.beginPath();
      ctx.moveTo(centerX - size / 4, centerY);
      ctx.lineTo(centerX - size / 2, centerY - size / 8);
      ctx.moveTo(centerX - size / 4, centerY);
      ctx.lineTo(centerX - size / 2, centerY + size / 8);
      ctx.moveTo(centerX + size / 4, centerY);
      ctx.lineTo(centerX + size / 2, centerY - size / 8);
      ctx.moveTo(centerX + size / 4, centerY);
      ctx.lineTo(centerX + size / 2, centerY + size / 8);
      ctx.strokeStyle = 'black';
      ctx.stroke();
      break;
  }

  // Draw power-up
  if (powerUp.x !== undefined) {
    const powerUpGradient = ctx.createRadialGradient(
      (powerUp.x + 0.5) * gridSize, (powerUp.y + 0.5) * gridSize, 0,
      (powerUp.x + 0.5) * gridSize, (powerUp.y + 0.5) * gridSize, gridSize / 2
    );
    powerUpGradient.addColorStop(0, 'violet');
    powerUpGradient.addColorStop(1, 'purple');
    ctx.fillStyle = powerUpGradient;
    ctx.beginPath();
    ctx.arc((powerUp.x + 0.5) * gridSize, (powerUp.y + 0.5) * gridSize, gridSize / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Draw star shape
    ctx.fillStyle = 'yellow';
    const centerX = (powerUp.x + 0.5) * gridSize;
    const centerY = (powerUp.y + 0.5) * gridSize;
    const spikes = 5;
    const outerRadius = gridSize / 2;
    const innerRadius = gridSize / 4;
    
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + Math.cos(i * Math.PI / spikes) * radius;
      const y = centerY + Math.sin(i * Math.PI / spikes) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Draw obstacles
  ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
  obstacles.forEach(obstacle => {
    ctx.fillRect(obstacle.x * gridSize, obstacle.y * gridSize, obstacle.width * gridSize, obstacle.height * gridSize);
    
    // Add some texture to obstacles
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= obstacle.width; i++) {
      ctx.beginPath();
      ctx.moveTo((obstacle.x + i) * gridSize, obstacle.y * gridSize);
      ctx.lineTo((obstacle.x + i) * gridSize, (obstacle.y + obstacle.height) * gridSize);
      ctx.stroke();
    }
    for (let i = 0; i <= obstacle.height; i++) {
      ctx.beginPath();
      ctx.moveTo(obstacle.x * gridSize, (obstacle.y + i) * gridSize);
      ctx.lineTo((obstacle.x + obstacle.width) * gridSize, (obstacle.y + i) * gridSize);
      ctx.stroke();
    }
  });
}

function updateUI() {
  document.getElementById('score-value').textContent = score;
  document.getElementById('high-score-value').textContent = highScore;
  document.getElementById('game-mode-value').textContent = gameMode;
}

function gameLoop() {
  if (gameOver) {
    showGameOver();
    return;
  }

  if (gameStarted) {
    moveSnake();
    checkCollision();
  }
  drawGame();
  updateUI();

  setTimeout(() => {
    requestAnimationFrame(gameLoop);
  }, gameSpeed);
}

function showGameOver() {
  document.getElementById('game-over').classList.remove('hidden');
  document.getElementById('final-score').textContent = score;
  document.getElementById('game-mode-select-end').value = gameMode;
  
  if (score > highScore) {
    document.getElementById('new-high-score').classList.remove('hidden');
    document.getElementById('player-name').value = ''; // Clear previous input
    document.getElementById('submit-score').onclick = function() {
      const playerName = document.getElementById('player-name').value.trim() || 'Anonymous';
      updateHighScore(playerName);
      document.getElementById('new-high-score').classList.add('hidden');
      document.getElementById('restart-game').disabled = false;
    };
    document.getElementById('restart-game').disabled = true;
  } else {
    document.getElementById('new-high-score').classList.add('hidden');
    // Always update the high score, even if it's not beaten
    updateHighScore(highScoreName);
  }
}

function updateHighScore(name = 'Anonymous') {
  if (score > highScore) {
    highScore = score;
    highScoreName = name;
    const data = { score: highScore, name: highScoreName };

    fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Access-Key': API_KEY
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
      console.log('High score saved:', data);
      document.getElementById('high-score-value').textContent = highScore;
      document.getElementById('high-score-name').textContent = highScoreName;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }
  document.getElementById('restart-game').disabled = false;
}

function loadHighScore() {
  fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    method: 'GET',
    headers: {
      'X-Access-Key': API_KEY
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.record) {
      highScore = data.record.score;
      highScoreName = data.record.name || '';
      document.getElementById('high-score-value').textContent = highScore;
      document.getElementById('high-score-name').textContent = highScoreName;
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

document.addEventListener('keydown', e => {
  if (!gameOver) {
    if (!gameStarted) {
      gameStarted = true;
      switch (e.key) {
        case 'ArrowUp': direction = 'up'; break;
        case 'ArrowDown': direction = 'down'; break;
        case 'ArrowLeft': direction = 'left'; break;
        case 'ArrowRight': direction = 'right'; break;
        default: return; // If it's not an arrow key, don't start the game
      }
    } else {
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'down') direction = 'up'; break;
        case 'ArrowDown': if (direction !== 'up') direction = 'down'; break;
        case 'ArrowLeft': if (direction !== 'right') direction = 'left'; break;
        case 'ArrowRight': if (direction !== 'left') direction = 'right'; break;
      }
    }
  }
});

document.getElementById('start-game').addEventListener('click', () => {
  document.getElementById('menu').classList.add('hidden');
  initGame();
});

document.getElementById('restart-game').addEventListener('click', () => {
  gameMode = document.getElementById('game-mode-select-end').value;
  document.getElementById('game-over').classList.add('hidden');
  initGame();
});

document.getElementById('game-mode-select').addEventListener('change', (e) => {
  gameMode = e.target.value;
});

// Initialize the game
loadHighScore();

document.getElementById('submit-score').addEventListener('click', () => {
  const playerName = document.getElementById('player-name').value.trim();
  if (playerName) {
    updateHighScore(playerName);
    document.getElementById('new-high-score').classList.add('hidden');
  }
});
