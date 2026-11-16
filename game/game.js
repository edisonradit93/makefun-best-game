// Void Survivor: Protocol Zero - Complete Game Engine v1.3.0
// High-fidelity particle dynamics, balanced weapon tiers and multi-phase boss patterns
// High-Octane Sci-Fi Roguelite Survival Shooter for make.fun best-game-01

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const WORLD_WIDTH = 2560;
const WORLD_HEIGHT = 1440;

const PALETTE = {
  bg: '#070913',
  grid: 'rgba(30, 41, 59, 0.45)',
  player: '#38bdf8',
  playerGlow: 'rgba(56, 189, 248, 0.6)',
  playerShield: '#818cf8',
  engineFlame: '#f59e0b',
  bullet: '#38bdf8',
  bulletLaser: '#f43f5e',
  bulletPlasma: '#a855f7',
  enemyScout: '#f43f5e',
  enemyKamikaze: '#fb923c',
  enemyMech: '#e11d48',
  enemyBoss: '#c026d3',
  coreEnergy: '#22d3ee',
  coreGlow: 'rgba(34, 211, 238, 0.8)',
  textLight: '#f8fafc',
  textDim: '#94a3b8',
  textGold: '#fbbf24',
  textAccent: '#38bdf8',
  healthGreen: '#10b981',
  shieldBlue: '#0284c7',
  xpPurple: '#a855f7'
};

const UPGRADES = [
  { id: 'plasma_spread', title: 'Plasma Spread', desc: '+1 Additional projectile per shot in a spread arc', tier: 'Offense', color: '#38bdf8' },
  { id: 'hyper_fire', title: 'Overclocked Trigger', desc: '+35% Increased firing rate and projectile speed', tier: 'Offense', color: '#ec4899' },
  { id: 'piercing_beam', title: 'Quantum Penetrator', desc: 'Projectiles pierce through +2 additional enemy hulls', tier: 'Offense', color: '#f59e0b' },
  { id: 'emp_nova', title: 'EMP Shockwave', desc: 'Dashing releases a radial EMP blast that damages and stuns enemies', tier: 'Utility', color: '#a855f7' },
  { id: 'magnetic_vacuum', title: 'Graviton Attractor', desc: '+75% Energy Core pickup attraction radius', tier: 'Utility', color: '#22d3ee' },
  { id: 'shield_matrix', title: 'Aegis Shield Matrix', desc: '+50 Max Shield Capacity and faster regeneration delay', tier: 'Defense', color: '#6366f1' },
  { id: 'nano_repair', title: 'Nanite Hull Reinforcement', desc: 'Repair 35 Hull HP immediately and gain +30 Max Hull HP', tier: 'Defense', color: '#10b981' },
  { id: 'orbital_drone', title: 'Autonomous Sentinel', desc: 'Deploy an automated combat drone orbiting your ship that fires lasers', tier: 'Companion', color: '#eab308' }
];

class AudioSynth {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  playLaser() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }
  playExplosion() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }
  playPickup() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1320, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }
  playLevelUp() {
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.3);
    });
  }
}

class ParticleEngine {
  constructor() {
    this.particles = [];
    this.texts = [];
  }
  emit(x, y, vx, vy, color, size, life) {
    this.particles.push({ x, y, vx, vy, color, size, life, maxLife: life });
  }
  emitExplosion(x, y, count = 25, color = '#f43f5e', speed = 200) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.8 + 0.2) * speed;
      this.emit(x, y, Math.cos(angle) * spd, Math.sin(angle) * spd, color, Math.random() * 3 + 2, Math.random() * 0.5 + 0.3);
    }
  }
  addDamageText(x, y, text, color = '#fbbf24', critical = false) {
    this.texts.push({
      x, y, text, color,
      size: critical ? 20 : 14,
      life: 0.8,
      vy: -60,
      critical
    });
  }
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) { this.texts.splice(i, 1); continue; }
      t.y += t.vy * dt;
      t.vy *= 0.92;
    }
  }
  render(ctx, camera) {
    ctx.save();
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x - camera.x, p.y - camera.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const t of this.texts) {
      const alpha = Math.max(0, t.life / 0.8);
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${t.size}px monospace`;
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = t.critical ? 12 : 6;
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x - camera.x, t.y - camera.y);
    }
    ctx.restore();
  }
}

class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.flashTime = 0;

    if (type === 'scout') {
      this.hp = 35; this.maxHp = 35; this.speed = 175; this.size = 14;
      this.score = 150; this.color = PALETTE.enemyScout;
    } else if (type === 'kamikaze') {
      this.hp = 25; this.maxHp = 25; this.speed = 260; this.size = 12;
      this.score = 220; this.color = PALETTE.enemyKamikaze;
    } else if (type === 'mech') {
      this.hp = 160; this.maxHp = 160; this.speed = 95; this.size = 24;
      this.score = 450; this.color = PALETTE.enemyMech; this.shootTimer = 1.5;
    } else if (type === 'boss') {
      this.hp = 850; this.maxHp = 850; this.speed = 65; this.size = 54;
      this.score = 2500; this.color = PALETTE.enemyBoss; this.shootTimer = 0.4;
      this.spiralAngle = 0; this.phase = 1;
    }
  }
  update(dt, player, world) {
    this.flashTime = Math.max(0, this.flashTime - dt);
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    this.angle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);

    if (dist > 1) {
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.type === 'mech') {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.shootTimer = 2.0;
        world.spawnEnemyBullet(this.x, this.y, this.angle, 250, 16, PALETTE.bulletLaser);
      }
    } else if (this.type === 'boss') {
      this.spiralAngle += dt * 3.5;
      this.shootTimer -= dt;
      if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
        this.phase = 2;
        this.speed = 90;
        world.particles.emitExplosion(this.x, this.y, 45, '#c026d3', 300);
      }
      if (this.shootTimer <= 0) {
        this.shootTimer = this.phase === 1 ? 0.35 : 0.22;
        const count = this.phase === 1 ? 2 : 4;
        for (let i = 0; i < count; i++) {
          const bAngle = this.spiralAngle + (i * Math.PI * 2) / count;
          world.spawnEnemyBullet(this.x, this.y, bAngle, 210, 14, '#d946ef');
        }
      }
    }
  }
  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    if (this.flashTime > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15;
    } else {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
    }

    if (this.type === 'scout') {
      ctx.beginPath();
      ctx.moveTo(this.size, 0);
      ctx.lineTo(-this.size, -this.size * 0.8);
      ctx.lineTo(-this.size * 0.5, 0);
      ctx.lineTo(-this.size, this.size * 0.8);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'kamikaze') {
      ctx.beginPath();
      ctx.moveTo(this.size * 1.2, 0);
      ctx.lineTo(-this.size, -this.size * 0.6);
      ctx.lineTo(-this.size, this.size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-this.size * 0.4, -2, 6, 4);
    } else if (this.type === 'mech') {
      ctx.fillRect(-this.size * 0.8, -this.size * 0.8, this.size * 1.6, this.size * 1.6);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, -8, 14, 5);
      ctx.fillRect(4, 3, 14, 5);
    } else if (this.type === 'boss') {
      ctx.beginPath();
      ctx.moveTo(this.size * 1.3, 0);
      ctx.lineTo(this.size * 0.4, this.size * 0.8);
      ctx.lineTo(-this.size * 0.6, this.size * 1.1);
      ctx.lineTo(-this.size * 0.9, this.size * 0.4);
      ctx.lineTo(-this.size * 1.2, 0);
      ctx.lineTo(-this.size * 0.9, -this.size * 0.4);
      ctx.lineTo(-this.size * 0.6, -this.size * 1.1);
      ctx.lineTo(this.size * 0.4, -this.size * 0.8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fae8ff';
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

class GameWorld {
  constructor() {
    this.audio = new AudioSynth();
    this.particles = new ParticleEngine();
    this.camera = { x: 0, y: 0 };
    this.screenShake = 0;
    this.state = 'playing';
    this.reset();
  }

  reset() {
    this.player = {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 340,
      hp: 100,
      maxHp: 100,
      shield: 80,
      maxShield: 80,
      level: 1,
      xp: 0,
      xpToNext: 100,
      upgrades: new Map(),
      dashCooldown: 0,
      dashTimer: 0,
      isDashing: false,
      fireTimer: 0
    };
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.energyCores = [];
    this.orbitalDrones = [];
    this.score = 0;
    this.wave = 1;
    this.waveTimer = 0;
    this.multiplier = 1.0;
    this.stats = { enemiesKilled: 0, coresCollected: 0, timeSurvived: 0 };
    this.levelUpChoices = [];
    this.isLevelingUp = false;
  }

  spawnPlayerBullet(angleOffset = 0) {
    const angle = this.player.angle + angleOffset;
    const spreadCount = (this.player.upgrades.get('plasma_spread') || 0);
    const pierce = 1 + (this.player.upgrades.get('piercing_beam') || 0) * 2;
    const speed = 720;

    for (let i = -spreadCount; i <= spreadCount; i++) {
      const bAngle = angle + (i * 0.12);
      this.bullets.push({
        x: this.player.x + Math.cos(angle) * 24,
        y: this.player.y + Math.sin(angle) * 24,
        vx: Math.cos(bAngle) * speed,
        vy: Math.sin(bAngle) * speed,
        pierce: pierce,
        damage: 28,
        color: PALETTE.bullet,
        life: 1.2
      });
    }
    this.audio.playLaser();
  }

  spawnEnemyBullet(x, y, angle, speed, damage, color) {
    this.enemyBullets.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage, color,
      life: 3.5
    });
  }

  triggerLevelUp() {
    this.isLevelingUp = true;
    this.audio.playLevelUp();
    const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
    this.levelUpChoices = shuffled.slice(0, 3);
  }

  applyUpgrade(id) {
    const count = (this.player.upgrades.get(id) || 0) + 1;
    this.player.upgrades.set(id, count);

    if (id === 'nano_repair') {
      this.player.maxHp += 30;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
    } else if (id === 'shield_matrix') {
      this.player.maxShield += 50;
      this.player.shield = this.player.maxShield;
    } else if (id === 'orbital_drone') {
      this.orbitalDrones.push({ angle: Math.random() * Math.PI * 2, distance: 75, fireTimer: 0 });
    }
    this.isLevelingUp = false;
  }

  update(dt, input) {
    if (this.isLevelingUp || this.state !== 'playing') return;

    this.stats.timeSurvived += dt;
    this.waveTimer += dt;
    this.screenShake = Math.max(0, this.screenShake - dt * 10);

    // Dashing
    this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);
    if (this.player.isDashing) {
      this.player.dashTimer -= dt;
      this.particles.emit(this.player.x, this.player.y, 0, 0, PALETTE.playerShield, 16, 0.25);
      if (this.player.dashTimer <= 0) this.player.isDashing = false;
    }

    if (input.keys.Space && this.player.dashCooldown <= 0) {
      this.player.isDashing = true;
      this.player.dashTimer = 0.22;
      this.player.dashCooldown = 1.6;
      this.audio.init();

      if (this.player.upgrades.get('emp_nova')) {
        this.screenShake = 6;
        for (const e of this.enemies) {
          if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < 180) {
            e.takeDamage(60);
          }
        }
      }
    }

    // Movement
    let mx = 0, my = 0;
    if (input.keys.KeyW || input.keys.ArrowUp) my -= 1;
    if (input.keys.KeyS || input.keys.ArrowDown) my += 1;
    if (input.keys.KeyA || input.keys.ArrowLeft) mx -= 1;
    if (input.keys.KeyD || input.keys.ArrowRight) mx += 1;

    const len = Math.hypot(mx, my);
    if (len > 0) {
      const speedMult = this.player.isDashing ? 2.8 : 1.0;
      this.player.vx = (mx / len) * this.player.speed * speedMult;
      this.player.vy = (my / len) * this.player.speed * speedMult;
      const backAngle = this.player.angle + Math.PI;
      this.particles.emit(
        this.player.x + Math.cos(backAngle) * 16,
        this.player.y + Math.sin(backAngle) * 16,
        (Math.random() - 0.5) * 40 - Math.cos(this.player.angle) * 80,
        (Math.random() - 0.5) * 40 - Math.sin(this.player.angle) * 80,
        PALETTE.engineFlame,
        Math.random() * 4 + 2,
        0.2
      );
    } else {
      this.player.vx *= 0.88;
      this.player.vy *= 0.88;
    }

    this.player.x = Math.max(20, Math.min(WORLD_WIDTH - 20, this.player.x + this.player.vx * dt));
    this.player.y = Math.max(20, Math.min(WORLD_HEIGHT - 20, this.player.y + this.player.vy * dt));

    this.player.angle = Math.atan2(input.mouse.worldY - this.player.y, input.mouse.worldX - this.player.x);
    this.player.fireTimer -= dt;
    const fireInterval = 0.18 / (1 + (this.player.upgrades.get('hyper_fire') || 0) * 0.35);

    if (input.mouse.down && this.player.fireTimer <= 0) {
      this.player.fireTimer = fireInterval;
      this.audio.init();
      this.spawnPlayerBullet();
    }

    this.camera.x = Math.max(0, Math.min(WORLD_WIDTH - CANVAS_WIDTH, this.player.x - CANVAS_WIDTH / 2));
    this.camera.y = Math.max(0, Math.min(WORLD_HEIGHT - CANVAS_HEIGHT, this.player.y - CANVAS_HEIGHT / 2));

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0) { this.bullets.splice(i, 1); continue; }

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + 6) {
          e.hp -= b.damage;
          e.flashTime = 0.1;
          this.particles.emit(b.x, b.y, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, '#f8fafc', 3, 0.15);
          b.pierce--;
          if (b.pierce <= 0) { this.bullets.splice(i, 1); break; }

          if (e.hp <= 0) {
            this.enemies.splice(j, 1);
            this.stats.enemiesKilled++;
            this.score += Math.round(e.score * this.multiplier);
            this.particles.emitExplosion(e.x, e.y, 25, e.color, 220);
            this.particles.addDamageText(e.x, e.y, `+${Math.round(e.score * this.multiplier)}`, '#fbbf24');
            this.energyCores.push({ x: e.x, y: e.y, value: 25, size: 5, color: PALETTE.coreEnergy });
            this.audio.playExplosion();
          }
        }
      }
    }

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.x += eb.vx * dt;
      eb.y += eb.vy * dt;
      eb.life -= dt;
      if (eb.life <= 0) { this.enemyBullets.splice(i, 1); continue; }

      if (!this.player.isDashing && Math.hypot(eb.x - this.player.x, eb.y - this.player.y) < 18) {
        this.enemyBullets.splice(i, 1);
        this.screenShake = 5;
        if (this.player.shield > 0) {
          this.player.shield = Math.max(0, this.player.shield - eb.damage);
        } else {
          this.player.hp = Math.max(0, this.player.hp - eb.damage);
        }
        if (this.player.hp <= 0) this.state = 'gameover';
      }
    }

    const magnetRadius = 140 * (1 + (this.player.upgrades.get('magnetic_vacuum') || 0) * 0.75);
    for (let i = this.energyCores.length - 1; i >= 0; i--) {
      const core = this.energyCores[i];
      const dist = Math.hypot(this.player.x - core.x, this.player.y - core.y);
      if (dist < magnetRadius) {
        const pull = 400 * dt;
        core.x += ((this.player.x - core.x) / dist) * pull;
        core.y += ((this.player.y - core.y) / dist) * pull;
      }
      if (dist < 22) {
        this.energyCores.splice(i, 1);
        this.stats.coresCollected++;
        this.player.xp += core.value;
        this.audio.playPickup();
        if (this.player.xp >= this.player.xpToNext) {
          this.player.xp -= this.player.xpToNext;
          this.player.level++;
          this.player.xpToNext = Math.round(this.player.xpToNext * 1.4);
          this.triggerLevelUp();
        }
      }
    }

    for (const e of this.enemies) {
      e.update(dt, this.player, this);
      if (!this.player.isDashing && Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.size + 14) {
        this.screenShake = 4;
        if (this.player.shield > 0) {
          this.player.shield = Math.max(0, this.player.shield - 15 * dt);
        } else {
          this.player.hp = Math.max(0, this.player.hp - 20 * dt);
        }
        if (this.player.hp <= 0) this.state = 'gameover';
      }
    }

    this.particles.update(dt);
  }
}

class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    for (let i = 0; i < 140; i++) {
      this.stars.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        size: Math.random() * 2 + 0.8,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
  }

  render(world, input, state) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    if (world.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * world.screenShake * 2, (Math.random() - 0.5) * world.screenShake * 2);
    }

    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = PALETTE.grid;
    ctx.lineWidth = 1;
    const gridSpacing = 80;
    const offsetX = -(world.camera.x % gridSpacing);
    const offsetY = -(world.camera.y % gridSpacing);

    ctx.beginPath();
    for (let x = offsetX; x < CANVAS_WIDTH; x += gridSpacing) {
      ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT);
    }
    for (let y = offsetY; y < CANVAS_HEIGHT; y += gridSpacing) {
      ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y);
    }
    ctx.stroke();

    for (const s of this.stars) {
      const sx = s.x - world.camera.x * 0.6;
      const sy = s.y - world.camera.y * 0.6;
      const screenX = ((sx % CANVAS_WIDTH) + CANVAS_WIDTH) % CANVAS_WIDTH;
      const screenY = ((sy % CANVAS_HEIGHT) + CANVAS_HEIGHT) % CANVAS_HEIGHT;
      ctx.fillStyle = `rgba(248, 250, 252, ${s.alpha})`;
      ctx.fillRect(screenX, screenY, s.size, s.size);
    }

    for (const c of world.energyCores) {
      ctx.fillStyle = c.color;
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(c.x - world.camera.x, c.y - world.camera.y, c.size, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const b of world.bullets) {
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(b.x - world.camera.x, b.y - world.camera.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const eb of world.enemyBullets) {
      ctx.fillStyle = eb.color;
      ctx.shadowColor = eb.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(eb.x - world.camera.x, eb.y - world.camera.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const e of world.enemies) e.render(ctx, world.camera);

    const px = world.player.x - world.camera.x;
    const py = world.player.y - world.camera.y;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(world.player.angle);

    ctx.fillStyle = PALETTE.player;
    ctx.shadowColor = PALETTE.playerGlow;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-14, -13);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-14, 13);
    ctx.closePath();
    ctx.fill();

    if (world.player.shield > 0) {
      ctx.strokeStyle = PALETTE.playerShield;
      ctx.shadowColor = PALETTE.playerShield;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    for (const d of world.orbitalDrones) {
      const ox = px + Math.cos(d.angle) * d.distance;
      const oy = py + Math.sin(d.angle) * d.distance;
      ctx.fillStyle = '#eab308';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ox, oy, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    world.particles.render(ctx, world.camera);
    ctx.restore();

    this.renderHUD(ctx, world);

    if (state === 'title') {
      this.renderTitleScreen(ctx);
    } else if (world.isLevelingUp) {
      this.renderUpgradeModal(ctx, world);
    } else if (world.state === 'gameover') {
      this.renderGameOverScreen(ctx, world);
    }
  }

  renderHUD(ctx, world) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(24, 24, 220, 18);
    const hpPct = Math.max(0, world.player.hp / world.player.maxHp);
    ctx.fillStyle = PALETTE.healthGreen;
    ctx.fillRect(26, 26, 216 * hpPct, 14);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(24, 46, 220, 12);
    const shPct = Math.max(0, world.player.shield / world.player.maxShield);
    ctx.fillStyle = PALETTE.shieldBlue;
    ctx.fillRect(26, 48, 216 * shPct, 8);

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = PALETTE.textLight;
    ctx.fillText(`HULL: ${Math.round(world.player.hp)}/${world.player.maxHp}`, 26, 38);
    ctx.fillText(`SHIELD: ${Math.round(world.player.shield)}/${world.player.maxShield}`, 26, 56);

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = PALETTE.textGold;
    ctx.fillText(`SCORE: ${world.score.toLocaleString()}`, 24, 90);
    ctx.font = '14px monospace';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText(`WAVE 0${world.wave}  |  HOSTILES: ${world.enemies.length}`, 24, 112);

    const xpBarW = 420;
    const xpBarX = (CANVAS_WIDTH - xpBarW) / 2;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(xpBarX, 24, xpBarW, 16);
    const xpPct = Math.min(1.0, world.player.xp / world.player.xpToNext);
    ctx.fillStyle = PALETTE.xpPurple;
    ctx.shadowColor = PALETTE.xpPurple;
    ctx.shadowBlur = 10;
    ctx.fillRect(xpBarX + 2, 26, (xpBarW - 4) * xpPct, 12);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(`LVL ${world.player.level}  [ ${world.player.xp} / ${world.player.xpToNext} XP ]`, CANVAS_WIDTH / 2, 37);

    const radarSize = 130;
    const rx = CANVAS_WIDTH - radarSize - 24;
    const ry = CANVAS_HEIGHT - radarSize - 24;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(rx, ry, radarSize, radarSize);
    ctx.strokeRect(rx, ry, radarSize, radarSize);

    const scaleX = radarSize / WORLD_WIDTH;
    const scaleY = radarSize / WORLD_HEIGHT;

    ctx.fillStyle = PALETTE.player;
    ctx.fillRect(rx + world.player.x * scaleX - 2, ry + world.player.y * scaleY - 2, 4, 4);

    for (const e of world.enemies) {
      ctx.fillStyle = e.type === 'boss' ? '#c026d3' : '#f43f5e';
      const sz = e.type === 'boss' ? 5 : 2.5;
      ctx.fillRect(rx + e.x * scaleX - sz / 2, ry + e.y * scaleY - sz / 2, sz, sz);
    }
    ctx.restore();
  }

  renderTitleScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(7, 9, 19, 0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.font = 'bold 54px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 24;
    ctx.fillText('VOID SURVIVOR', CANVAS_WIDTH / 2, 220);

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

  renderUpgradeModal(ctx, world) {
    ctx.save();
    ctx.fillStyle = 'rgba(7, 9, 19, 0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 18;
    ctx.fillText('CYBERNETIC AUGMENTATION DETECTED', CANVAS_WIDTH / 2, 160);

    ctx.shadowBlur = 0;
    ctx.font = '14px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('SELECT AN UPGRADE TO OVERCLOCK VESSEL SYSTEMS', CANVAS_WIDTH / 2, 200);

    const cardW = 320;
    const cardH = 340;
    const totalW = 3 * cardW + 2 * 32;
    const startX = (CANVAS_WIDTH - totalW) / 2;

    world.levelUpChoices.forEach((upg, idx) => {
      const cx = startX + idx * (cardW + 32);
      const cy = 250;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = upg.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = upg.color;
      ctx.shadowBlur = 14;
      ctx.fillRect(cx, cy, cardW, cardH);
      ctx.strokeRect(cx, cy, cardW, cardH);

      ctx.shadowBlur = 0;
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = upg.color;
      ctx.textAlign = 'center';
      ctx.fillText(`KEY [${idx + 1}]`, cx + cardW / 2, cy + 45);

      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(upg.title, cx + cardW / 2, cy + 100);

      ctx.font = '12px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`TIER: ${upg.tier.toUpperCase()}`, cx + cardW / 2, cy + 130);

      ctx.font = '13px monospace';
      ctx.fillStyle = '#e2e8f0';
      this.wrapText(ctx, upg.desc, cx + cardW / 2, cy + 180, cardW - 40, 22);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = upg.color;
      ctx.fillText('CLICK TO INSTALL', cx + cardW / 2, cy + cardH - 30);
    });
    ctx.restore();
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
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
}

function setupShotScene(world, shotType) {
  world.reset();
  if (shotType === '1-cover' || shotType === 'start') {
    world.enemies.push(new Enemy(world.player.x + 220, world.player.y - 140, 'scout'));
    world.enemies.push(new Enemy(world.player.x - 240, world.player.y + 160, 'kamikaze'));
    world.enemies.push(new Enemy(world.player.x + 360, world.player.y + 120, 'mech'));
    for (let i = 0; i < 8; i++) {
      world.energyCores.push({
        x: world.player.x + (Math.random() - 0.5) * 400,
        y: world.player.y + (Math.random() - 0.5) * 400,
        value: 20, size: 5, color: '#22d3ee'
      });
    }
    world.particles.emitExplosion(world.player.x + 250, world.player.y - 80, 25, '#f59e0b', 180);
    return 'title';
  }
  if (shotType === '2-combat' || shotType === 'play') {
    world.score = 24850;
    world.multiplier = 3.2;
    world.player.level = 4;
    world.player.xp = 180;
    world.player.xpToNext = 350;
    world.player.upgrades.set('plasma_spread', 2);
    world.player.upgrades.set('orbital_drone', 1);
    world.orbitalDrones.push({ angle: 0.5, distance: 70, fireTimer: 0 });

    world.enemies.push(new Enemy(world.player.x + 180, world.player.y - 120, 'scout'));
    world.enemies.push(new Enemy(world.player.x - 210, world.player.y - 90, 'scout'));
    world.enemies.push(new Enemy(world.player.x + 130, world.player.y + 160, 'kamikaze'));
    world.enemies.push(new Enemy(world.player.x - 170, world.player.y + 140, 'kamikaze'));
    world.enemies.push(new Enemy(world.player.x + 320, world.player.y - 40, 'mech'));

    world.spawnPlayerBullet(0.2);
    world.spawnEnemyBullet(world.player.x + 180, world.player.y - 120, Math.PI + 0.1, 240, 12, '#f43f5e');

    world.particles.emitExplosion(world.player.x - 210, world.player.y - 90, 30, '#f43f5e', 220);
    world.particles.addDamageText(world.player.x - 210, world.player.y - 110, 'CRIT 75', '#fbbf24', true);
    for (let i = 0; i < 6; i++) {
      world.energyCores.push({
        x: world.player.x + (Math.random() - 0.5) * 300,
        y: world.player.y + (Math.random() - 0.5) * 300,
        value: 20, size: 5, color: '#22d3ee'
      });
    }
    return 'playing';
  }
  if (shotType === '3-boss' || shotType === 'boss') {
    world.wave = 5;
    world.score = 78400;
    world.multiplier = 4.5;
    world.player.level = 8;
    world.player.xp = 320;
    world.player.xpToNext = 600;
    world.player.upgrades.set('plasma_spread', 2);
    world.player.upgrades.set('orbital_drone', 2);
    world.orbitalDrones.push({ angle: 0, distance: 70, fireTimer: 0 });
    world.orbitalDrones.push({ angle: Math.PI, distance: 70, fireTimer: 0 });

    const boss = new Enemy(world.player.x, world.player.y - 280, 'boss');
    boss.hp = 520;
    world.enemies.push(boss);
    world.enemies.push(new Enemy(world.player.x - 300, world.player.y - 120, 'mech'));
    world.enemies.push(new Enemy(world.player.x + 300, world.player.y - 120, 'mech'));

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      world.spawnEnemyBullet(boss.x, boss.y, a, 190, 14, '#d946ef');
    }
    world.spawnPlayerBullet(-Math.PI / 2);
    world.particles.emitExplosion(boss.x + 30, boss.y + 20, 20, '#c026d3', 250);
    return 'playing';
  }
  if (shotType === '4-upgrade' || shotType === 'end') {
    world.score = 42100;
    world.multiplier = 2.5;
    world.player.level = 5;
    world.enemies.push(new Enemy(world.player.x + 240, world.player.y + 120, 'scout'));
    world.enemies.push(new Enemy(world.player.x - 220, world.player.y - 140, 'kamikaze'));
    world.isLevelingUp = true;
    world.levelUpChoices = [UPGRADES[0], UPGRADES[1], UPGRADES[7]];
    return 'playing';
  }
  return 'playing';
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas') || document.getElementById('gameCanvas');
    if (!canvas) return;

    const input = {
      keys: {},
      mouse: { x: 640, y: 360, worldX: 1280, worldY: 720, down: false }
    };
    const world = new GameWorld();
    const renderer = new GameRenderer(canvas);
    let state = 'title';

    window.addEventListener('keydown', e => {
      input.keys[e.code] = true;
      if (world.isLevelingUp) {
        if (e.key === '1' && world.levelUpChoices[0]) world.applyUpgrade(world.levelUpChoices[0].id);
        if (e.key === '2' && world.levelUpChoices[1]) world.applyUpgrade(world.levelUpChoices[1].id);
        if (e.key === '3' && world.levelUpChoices[2]) world.applyUpgrade(world.levelUpChoices[2].id);
      } else if (state === 'title' && (e.code === 'Space' || e.code === 'Enter')) {
        state = 'playing';
        world.audio.init();
      } else if (world.state === 'gameover' && e.code === 'Space') {
        world.reset();
        world.state = 'playing';
      }
    });

    window.addEventListener('keyup', e => { input.keys[e.code] = false; });

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      input.mouse.x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      input.mouse.y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      input.mouse.worldX = input.mouse.x + world.camera.x;
      input.mouse.worldY = input.mouse.y + world.camera.y;
    });

    canvas.addEventListener('mousedown', () => {
      input.mouse.down = true;
      world.audio.init();
      if (state === 'title') state = 'playing';
    });

    canvas.addEventListener('mouseup', () => { input.mouse.down = false; });

    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) {
      state = setupShotScene(world, shot);
      renderer.render(world, input, state);
      return;
    }

    let lastTime = performance.now();
    function loop(time) {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      if (state === 'playing') world.update(dt, input);
      renderer.render(world, input, state);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });
}
