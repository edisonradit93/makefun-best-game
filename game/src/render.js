// Void Survivor - High Fidelity Sci-Fi Canvas Renderer

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  PALETTE
} from './config.js';

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = this.generateStars(150);
  }

  generateStars(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        size: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.7 + 0.3,
        parallax: Math.random() * 0.4 + 0.1
      });
    }
    return stars;
  }

  render(world, input, state) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply Screen Shake
    ctx.save();
    if (world.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * world.screenShake * 2;
      const shakeY = (Math.random() - 0.5) * world.screenShake * 2;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Parallax Starfield & Grid
    this.renderBackground(ctx, world.camera);

    // 2. World Elements
    this.renderEnergyCores(ctx, world);
    this.renderProjectiles(ctx, world);
    this.renderOrbitalDrones(ctx, world);
    this.renderEnemies(ctx, world);
    this.renderPlayer(ctx, world);

    // 3. Particles
    world.particles.render(ctx, world.camera);

    ctx.restore();

    // 4. Overlays & HUD
    this.renderHUD(ctx, world, input);

    if (state === 'title') {
      this.renderTitleScreen(ctx);
    } else if (world.isLevelingUp) {
      this.renderLevelUpModal(ctx, world);
    } else if (world.isGameOver) {
      this.renderGameOverScreen(ctx, world);
    } else if (world.isVictory) {
      this.renderVictoryScreen(ctx, world);
    }
  }

  renderBackground(ctx, camera) {
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      const sx = ((star.x - camera.x * star.parallax) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH;
      const sy = ((star.y - camera.y * star.parallax) % CANVAS_HEIGHT + CANVAS_HEIGHT) % CANVAS_HEIGHT;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = star.alpha;
      ctx.fillRect(sx, sy, star.size, star.size);
    }
    ctx.globalAlpha = 1.0;

    // Grid lines
    const gridSize = 100;
    const startX = -camera.x % gridSize;
    const startY = -camera.y % gridSize;
    ctx.strokeStyle = PALETTE.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x < CANVAS_WIDTH; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
    }
    for (let y = startY; y < CANVAS_HEIGHT; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
    }
    ctx.stroke();

    // World Boundary Ring
    const bx = -camera.x;
    const by = -camera.y;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(bx, by, WORLD_WIDTH, WORLD_HEIGHT);
  }

  renderPlayer(ctx, world) {
    const p = world.player;
    const sx = p.x - world.camera.x;
    const sy = p.y - world.camera.y;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(p.angle);

    // Thruster Flames
    const isMoving = Math.hypot(p.vx, p.vy) > 10;
    if (isMoving || p.isDashing) {
      const flameLen = p.isDashing ? 32 : 18 + Math.random() * 8;
      ctx.fillStyle = p.isDashing ? '#38bdf8' : PALETTE.engineFlame;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(-p.size * 0.9, -6);
      ctx.lineTo(-p.size * 0.9 - flameLen, 0);
      ctx.lineTo(-p.size * 0.9, 6);
      ctx.closePath();
      ctx.fill();
    }

    // Ship Hull Geometry
    ctx.fillStyle = PALETTE.player;
    ctx.shadowColor = PALETTE.playerGlow;
    ctx.shadowBlur = p.isDashing ? 25 : 12;
    ctx.beginPath();
    ctx.moveTo(p.size * 1.3, 0);
    ctx.lineTo(-p.size * 0.8, p.size * 0.85);
    ctx.lineTo(-p.size * 0.4, 0);
    ctx.lineTo(-p.size * 0.8, -p.size * 0.85);
    ctx.closePath();
    ctx.fill();

    // Cockpit Canopy
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(p.size * 0.6, 0);
    ctx.lineTo(-p.size * 0.2, p.size * 0.35);
    ctx.lineTo(-p.size * 0.2, -p.size * 0.35);
    ctx.closePath();
    ctx.fill();

    // Shield Bubble
    if (p.shield > 0) {
      ctx.strokeStyle = PALETTE.playerShield;
      ctx.shadowColor = PALETTE.playerShield;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4 + (p.shield / p.maxShield) * 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }

  renderOrbitalDrones(ctx, world) {
    for (const drone of world.orbitalDrones) {
      const dx = world.player.x + Math.cos(drone.angle) * drone.distance - world.camera.x;
      const dy = world.player.y + Math.sin(drone.angle) * drone.distance - world.camera.y;

      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(drone.angle + Math.PI / 2);
      ctx.fillStyle = '#eab308';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, 5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, -5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  renderProjectiles(ctx, world) {
    // Player Bullets
    for (const b of world.bullets) {
      const sx = b.x - world.camera.x;
      const sy = b.y - world.camera.y;
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sx, sy, b.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Enemy Bullets
    for (const eb of world.enemyBullets) {
      const sx = eb.x - world.camera.x;
      const sy = eb.y - world.camera.y;
      ctx.save();
      ctx.fillStyle = eb.color;
      ctx.shadowColor = eb.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sx, sy, eb.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderEnemies(ctx, world) {
    for (const e of world.enemies) {
      e.render(ctx, world.camera);
    }
  }

  renderEnergyCores(ctx, world) {
    for (const c of world.energyCores) {
      const sx = c.x - world.camera.x;
      const sy = c.y - world.camera.y;
      ctx.save();
      ctx.fillStyle = c.color;
      ctx.shadowColor = PALETTE.coreGlow;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sx, sy, c.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderHUD(ctx, world, input) {
    const p = world.player;

    // 1. Health & Shield Bars (Top Left)
    ctx.save();
    const barX = 25;
    const barY = 25;
    const barW = 220;
    const barH = 12;

    // Shield Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = PALETTE.shieldBlue;
    ctx.shadowColor = PALETTE.shieldBlue;
    ctx.shadowBlur = 8;
    ctx.fillRect(barX, barY, (p.shield / p.maxShield) * barW, barH);

    // Hull Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(barX, barY + barH + 6, barW, barH);
    ctx.fillStyle = p.hull > 30 ? PALETTE.healthGreen : '#ef4444';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.fillRect(barX, barY + barH + 6, (p.hull / p.maxHull) * barW, barH);

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SHIELD: ${Math.round(p.shield)} / ${p.maxShield}`, barX + 6, barY + 10);
    ctx.fillText(`HULL:   ${Math.round(p.hull)} / ${p.maxHull}`, barX + 6, barY + barH + 16);

    // Dash Indicator
    const dashReady = p.dashCooldown <= 0;
    ctx.fillStyle = dashReady ? '#38bdf8' : '#64748b';
    ctx.fillText(`DASH [SPACE]: ${dashReady ? 'READY' : (p.dashCooldown).toFixed(1) + 's'}`, barX, barY + barH * 2 + 24);

    // 2. XP Progression Bar (Bottom Screen)
    const xpY = CANVAS_HEIGHT - 14;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(0, xpY, CANVAS_WIDTH, 14);
    ctx.fillStyle = PALETTE.xpPurple;
    ctx.shadowColor = PALETTE.xpPurple;
    ctx.shadowBlur = 10;
    ctx.fillRect(0, xpY, (p.xp / p.xpToNext) * CANVAS_WIDTH, 14);

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${p.level} — XP: ${p.xp} / ${p.xpToNext}`, CANVAS_WIDTH / 2, xpY + 11);

    // 3. Top Center: Wave & Boss Timer
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = PALETTE.textAccent;
    ctx.fillText(`WAVE ${world.wave}`, CANVAS_WIDTH / 2, 35);
    ctx.font = '12px monospace';
    ctx.fillStyle = PALETTE.textDim;
    if (world.bossSpawned) {
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('WARNING: VOID DREADNOUGHT CLASS THREAT DETECTED', CANVAS_WIDTH / 2, 54);
    } else {
      ctx.fillText(`NEXT WAVE IN: ${Math.ceil(world.waveTime)}s`, CANVAS_WIDTH / 2, 54);
    }

    // 4. Top Right: Score & Multiplier
    ctx.textAlign = 'right';
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = PALETTE.textLight;
    ctx.fillText(`SCORE: ${world.score.toLocaleString()}`, CANVAS_WIDTH - 25, 40);
    if (world.multiplier > 1) {
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = PALETTE.textGold;
      ctx.fillText(`${world.multiplier.toFixed(1)}x MULTIPLIER`, CANVAS_WIDTH - 25, 60);
    }

    // 5. Radar Mini-Map (Top Right, under score)
    this.renderRadar(ctx, world, CANVAS_WIDTH - 130, 80, 105, 60);

    // 6. Crosshair at Mouse
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(input.mouse.x, input.mouse.y, 8, 0, Math.PI * 2);
    ctx.moveTo(input.mouse.x - 12, input.mouse.y);
    ctx.lineTo(input.mouse.x + 12, input.mouse.y);
    ctx.moveTo(input.mouse.x, input.mouse.y - 12);
    ctx.lineTo(input.mouse.x, input.mouse.y + 12);
    ctx.stroke();

    ctx.restore();
  }

  renderRadar(ctx, world, rx, ry, rw, rh) {
    ctx.save();
    ctx.fillStyle = 'rgba(7, 10, 20, 0.75)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx, ry, rw, rh);

    const scaleX = rw / WORLD_WIDTH;
    const scaleY = rh / WORLD_HEIGHT;

    // Player blip
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(rx + world.player.x * scaleX - 1.5, ry + world.player.y * scaleY - 1.5, 3, 3);

    // Enemy blips
    ctx.fillStyle = '#ef4444';
    for (const e of world.enemies) {
      ctx.fillRect(rx + e.x * scaleX - 1, ry + e.y * scaleY - 1, 2, 2);
    }

    ctx.restore();
  }

  renderLevelUpModal(ctx, world) {
    ctx.save();
    ctx.fillStyle = 'rgba(3, 7, 18, 0.82)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = PALETTE.textAccent;
    ctx.shadowColor = PALETTE.textAccent;
    ctx.shadowBlur = 15;
    ctx.fillText('CYBERNETIC SYSTEM AUGMENTATION', CANVAS_WIDTH / 2, 160);

    ctx.font = '14px monospace';
    ctx.fillStyle = PALETTE.textDim;
    ctx.shadowBlur = 0;
    ctx.fillText('SELECT ONE ENHANCEMENT PROTOCOL [PRESS 1, 2, OR 3]', CANVAS_WIDTH / 2, 195);

    const cardW = 280;
    const cardH = 240;
    const spacing = 35;
    const totalW = world.levelUpOptions.length * cardW + (world.levelUpOptions.length - 1) * spacing;
    const startX = (CANVAS_WIDTH - totalW) / 2;

    world.levelUpOptions.forEach((opt, idx) => {
      const cx = startX + idx * (cardW + spacing);
      const cy = 240;

      // Card Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = opt.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = opt.color;
      ctx.shadowBlur = 12;
      ctx.fillRect(cx, cy, cardW, cardH);
      ctx.strokeRect(cx, cy, cardW, cardH);

      // Card Header
      ctx.shadowBlur = 0;
      ctx.fillStyle = opt.color;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`[ PROTOCOL 0${idx + 1} ]`, cx + cardW / 2, cy + 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(opt.title, cx + cardW / 2, cy + 65);

      ctx.font = '11px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`CLASSIFICATION: ${opt.tier.toUpperCase()}`, cx + cardW / 2, cy + 90);

      // Description text wrapping
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px monospace';
      const words = opt.desc.split(' ');
      let line = '';
      let textY = cy + 130;
      for (const w of words) {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > cardW - 30) {
          ctx.fillText(line, cx + cardW / 2, textY);
          line = w + ' ';
          textY += 20;
        } else {
          line = test;
        }
      }
      ctx.fillText(line, cx + cardW / 2, textY);

      // Key prompt
      ctx.fillStyle = opt.color;
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`PRESS [${idx + 1}] TO INSTALL`, cx + cardW / 2, cy + cardH - 25);
    });

    ctx.restore();
  }

  renderTitleScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(3, 7, 18, 0.78)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.font = 'bold 50px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 25;
    ctx.fillText('VOID SURVIVOR', CANVAS_WIDTH / 2, 230);

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 15;
    ctx.fillText('PROTOCOL : ZERO', CANVAS_WIDTH / 2, 275);

    ctx.shadowBlur = 0;
    ctx.font = '14px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('A High-Octane Sci-Fi Roguelite Survival Shooter for make.fun', CANVAS_WIDTH / 2, 320);

    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.fillRect(CANVAS_WIDTH / 2 - 220, 360, 440, 150);
    ctx.strokeRect(CANVAS_WIDTH / 2 - 220, 360, 440, 150);

    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('TACTICAL FLIGHT CONTROLS', CANVAS_WIDTH / 2, 390);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('[W, A, S, D] — Vector Thruster Movement', CANVAS_WIDTH / 2, 420);
    ctx.fillText('[MOUSE AIM & CLICK] — Plasma Cannons', CANVAS_WIDTH / 2, 445);
    ctx.fillText('[SPACEBAR] — Tactical Warp Dash (Invulnerable)', CANVAS_WIDTH / 2, 470);
    ctx.fillText('[1, 2, 3] — Select Cybernetic Augmentation', CANVAS_WIDTH / 2, 495);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 12;
    ctx.fillText('CLICK ANYWHERE OR PRESS SPACE TO INITIATE', CANVAS_WIDTH / 2, 570);

    ctx.restore();
  }

  renderGameOverScreen(ctx, world) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.font = 'bold 44px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 20;
    ctx.fillText('HULL INTEGRITY COMPROMISED', CANVAS_WIDTH / 2, 220);

    ctx.shadowBlur = 0;
    ctx.font = '16px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('MISSION TELEMETRY ARCHIVE', CANVAS_WIDTH / 2, 260);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`FINAL SCORE: ${world.score.toLocaleString()}`, CANVAS_WIDTH / 2, 310);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Enemies Eliminated: ${world.stats.enemiesKilled}`, CANVAS_WIDTH / 2, 350);
    ctx.fillText(`Energy Cores Harvested: ${world.stats.coresCollected}`, CANVAS_WIDTH / 2, 375);
    ctx.fillText(`Waves Survived: ${world.wave}`, CANVAS_WIDTH / 2, 400);
    ctx.fillText(`Time Survived: ${Math.round(world.stats.timeSurvived)}s`, CANVAS_WIDTH / 2, 425);

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.fillText('PRESS SPACEBAR TO REBOOT PROTOCOL', CANVAS_WIDTH / 2, 490);

    ctx.restore();
  }

  renderVictoryScreen(ctx, world) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.font = 'bold 44px monospace';
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 20;
    ctx.fillText('VOID DREADNOUGHT DESTROYED', CANVAS_WIDTH / 2, 220);

    ctx.shadowBlur = 0;
    ctx.font = '16px monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('SECTOR DEFENSE VICTORY ACHIEVED', CANVAS_WIDTH / 2, 260);

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`FINAL SCORE: ${world.score.toLocaleString()}`, CANVAS_WIDTH / 2, 310);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Total Hostiles Terminated: ${world.stats.enemiesKilled}`, CANVAS_WIDTH / 2, 350);
    ctx.fillText(`Energy Cores Secured: ${world.stats.coresCollected}`, CANVAS_WIDTH / 2, 375);
    ctx.fillText(`Time Elapsed: ${Math.round(world.stats.timeSurvived)}s`, CANVAS_WIDTH / 2, 400);

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.fillText('PRESS SPACEBAR TO ENGAGE NEW MISSION', CANVAS_WIDTH / 2, 490);

    ctx.restore();
  }
}
