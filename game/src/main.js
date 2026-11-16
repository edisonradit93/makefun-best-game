// Void Survivor - Main Entrypoint & Game Loop

import { GameWorld } from './world.js';
import { GameRenderer } from './render.js';
import { InputHandler } from './input.js';
import { sound } from './audio.js';
import { setupShotScene } from './shots.js';

const canvas = document.getElementById('game-canvas');
const world = new GameWorld();
const renderer = new GameRenderer(canvas);
const input = new InputHandler(canvas);

let gameState = 'title'; // 'title', 'playing', 'paused'
let lastTime = performance.now();

// Check if running in screenshot / shot mode
const urlParams = new URLSearchParams(window.location.search);
const shotParam = urlParams.get('shot');

if (shotParam) {
  gameState = setupShotScene(world, shotParam);
  // Render deterministic shot
  renderer.render(world, input, gameState);
} else {
  // Normal Interactive Game Loop
  function gameLoop(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    if (gameState === 'title') {
      if (input.wasJustPressed('Space') || input.mouse.down) {
        sound.init();
        gameState = 'playing';
        world.reset();
      }
    } else if (gameState === 'playing') {
      if (input.wasJustPressed('Escape')) {
        gameState = 'paused';
      } else if (world.isLevelingUp) {
        if (input.wasJustPressed('Digit1') && world.levelUpOptions[0]) {
          world.selectUpgrade(world.levelUpOptions[0].id);
        } else if (input.wasJustPressed('Digit2') && world.levelUpOptions[1]) {
          world.selectUpgrade(world.levelUpOptions[1].id);
        } else if (input.wasJustPressed('Digit3') && world.levelUpOptions[2]) {
          world.selectUpgrade(world.levelUpOptions[2].id);
        }
      } else if (world.isGameOver || world.isVictory) {
        if (input.wasJustPressed('Space')) {
          world.reset();
          gameState = 'playing';
        }
      } else {
        world.update(dt, input);
      }
    } else if (gameState === 'paused') {
      if (input.wasJustPressed('Escape') || input.wasJustPressed('Space')) {
        gameState = 'playing';
      }
    }

    renderer.render(world, input, gameState);
    input.clearJustPressed();
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}
