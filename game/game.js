/**
 * Void Survivor: Protocol Zero
 * Autonomous Roguelite Survival Shooter Engine
 * 
 * Features:
 * - 2560x1440 toroidal-bounded dynamic world with 1280x720 canvas viewport
 * - Procedural Web Audio API sound synthesis (lasers, explosions, pickups, fanfare)
 * - Kinetic particle engine (thruster plumes, explosions, floating combat telemetry)
 * - 8 unique cybernetic upgrade cards with synergistic stacking
 * - Swarm AI: Scout Drones, Kamikaze Stalkers, Heavy Laser Mechs, Void Dreadnought Boss
 * - Autonomous orbital sentinel drones & EMP shockwaves
 * - Real-time radar minimap & holographic cyberpunk HUD
 * - Deterministic visual telemetry modes (?shot=1-cover, ?shot=2-combat, ?shot=3-boss, ?shot=4-upgrade)
 */

// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================
export const CONFIG = {
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  WORLD_WIDTH: 2560,
  WORLD_HEIGHT: 1440,
  
  // Cyberpunk Palette
  COLORS: {
    BACKGROUND: '#05070f',
    GRID: 'rgba(56, 189, 248, 0.08)',
    GRID_MAJOR: 'rgba(56, 189, 248, 0.16)',
    PLAYER: '#38bdf8',
    PLAYER_ENGINE: '#f59e0b',
    SHIELD: '#818cf8',
    SHIELD_GLOW: 'rgba(129, 140, 248, 0.35)',
    LASER_PLAYER: '#38bdf8',
    LASER_SENTINEL: '#c084fc',
    ENEMY_SCOUT: '#f43f5e',
    ENEMY_STALKER: '#fb923c',
    ENEMY_MECH: '#c026d3',
    ENEMY_BOSS: '#e11d48',
    CORE_XP: '#22d3ee',
    TEXT_MAIN: '#f8fafc',
    TEXT_MUTED: '#94a3b8',
    CARD_BG: 'rgba(15, 23, 42, 0.92)',
    CARD_BORDER: '#0284c7',
  },
  
  BASE_SPEED: 320,
  BASE_HP: 100,
  BASE_SHIELD: 50,
  DASH_COOLDOWN: 2.2,
  DASH_SPEED: 850,
  DASH_DURATION: 0.22,
};

// ==========================================
// PROCEDURAL WEB AUDIO SYNTHESIZER
// ==========================================
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playLaser(frequencyMod = 1.0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880 * frequencyMod, t);
      osc.frequency.exponentialRampToValueAtTime(160 * frequencyMod, t + 0.12);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch (_) {}
  }

  playExplosion(intensity = 1.0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const dur = 0.35 * intensity;
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-3.5 * (i / bufferSize));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + dur);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2 * intensity, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch (_) {}
  }

  playPickup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, t); // E5
      osc.frequency.exponentialRampToValueAtTime(1318.51, t + 0.14); // E6

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.14);
    } catch (_) {}
  }

  playDash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.22);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.22);
    } catch (_) {}
  }

  playLevelUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.3);
      });
    } catch (_) {}
  }
}

export const audio = new SoundSynth();

// ==========================================
// KINETIC PARTICLE ENGINE
// ==========================================
class ParticleEngine {
  constructor() {
    this.particles = [];
    this.combatTexts = [];
    this.shockwaves = [];
  }

  spawnThruster(x, y, angle, color = '#f59e0b') {
    const spread = (Math.random() - 0.5) * 0.45;
    const speed = 120 + Math.random() * 80;
    const backAngle = angle + Math.PI + spread;
    this.particles.push({
      x,
      y,
      vx: Math.cos(backAngle) * speed,
      vy: Math.sin(backAngle) * speed,
      radius: 3 + Math.random() * 3,
      alpha: 1.0,
      decay: 3.5 + Math.random() * 2,
      color,
    });
  }

  spawnSparks(x, y, count = 16, color = '#38bdf8', speedMult = 1.0) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (60 + Math.random() * 240) * speedMult;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 2.5,
        alpha: 1.0,
        decay: 1.5 + Math.random() * 2.2,
        color,
      });
    }
  }

  spawnShockwave(x, y, maxRadius = 140, color = '#38bdf8') {
    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius,
      alpha: 0.9,
      speed: (maxRadius - 10) / 0.35,
      color,
    });
  }

  spawnCombatText(x, y, text, color = '#38bdf8', isCrit = false) {
    this.combatTexts.push({
      x,
      y: y - 10,
      vy: -55,
      text,
      color,
      alpha: 1.0,
      size: isCrit ? 20 : 14,
      isCrit,
      life: 0.85,
    });
  }

  update(dt) {
    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * dt;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Combat Texts
    for (let i = this.combatTexts.length - 1; i >= 0; i--) {
      const ct = this.combatTexts[i];
      ct.y += ct.vy * dt;
      ct.life -= dt;
      ct.alpha = Math.max(0, ct.life / 0.85);
      if (ct.life <= 0) {
        this.combatTexts.splice(i, 1);
      }
    }
  }

  renderWorld(ctx) {
    ctx.save();
    // Render shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = 3;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();
    }

    // Render particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render floating combat texts
    for (const ct of this.combatTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ct.alpha);
      ctx.font = `bold ${ct.size}px 'Rajdhani', 'Segoe UI', monospace`;
      ctx.fillStyle = ct.color;
      ctx.shadowColor = ct.color;
      ctx.shadowBlur = ct.isCrit ? 12 : 6;
      ctx.textAlign = 'center';
      ctx.fillText(ct.text, ct.x, ct.y);
      ctx.restore();
    }
    ctx.restore();
  }
}

// ==========================================
// UPGRADE CARD SYSTEM (8 UNIQUE ABILITIES)
// ==========================================
export const UPGRADES = [
  {
    id: 'spread',
    title: 'Plasma Spread',
    icon: '⇶',
    category: 'WEAPON',
    desc: 'Adds +2 multi-directional laser beams per shot.',
    statDesc: '+2 Projectile Barrels',
    apply(player) {
      player.spreadLevel += 1;
    },
  },
  {
    id: 'firerate',
    title: 'Overclocked Trigger',
    icon: '⚡',
    category: 'TACTICAL',
    desc: 'Amplifies laser capacitor cycling rate by 35%.',
    statDesc: '+35% Cycling Velocity',
    apply(player) {
      player.fireRateMult *= 1.35;
    },
  },
  {
    id: 'pierce',
    title: 'Quantum Penetrator',
    icon: '⤗',
    category: 'WEAPON',
    desc: 'Beams pass through +1 target with +20% damage boost.',
    statDesc: '+1 Target Penetration',
    apply(player) {
      player.pierceLevel += 1;
      player.damageMult *= 1.2;
    },
  },
  {
    id: 'emp',
    title: 'EMP Shockwave',
    icon: '✹',
    category: 'DEFENSE',
    desc: 'Tactical dash triggers an EMP blast neutralizing projectiles & damaging enemies.',
    statDesc: '85 Pulse Radius, 75 DMG',
    apply(player) {
      player.empLevel += 1;
    },
  },
  {
    id: 'magnet',
    title: 'Graviton Attractor',
    icon: '🧲',
    category: 'UTILITY',
    desc: 'Expands core gravitational suction radius by 85%.',
    statDesc: '+85% Magnet Horizon',
    apply(player) {
      player.magnetRadius *= 1.85;
    },
  },
  {
    id: 'shield',
    title: 'Aegis Shield Matrix',
    icon: '🛡',
    category: 'DEFENSE',
    desc: 'Reinforces maximum energy shield capacity by +30 and speeds regeneration.',
    statDesc: '+30 Max Shield, Faster Regen',
    apply(player) {
      player.maxShield += 30;
      player.shield = player.maxShield;
      player.shieldRegenRate *= 1.3;
    },
  },
  {
    id: 'hull',
    title: 'Nanite Hull Reinforce',
    icon: '✛',
    category: 'HULL',
    desc: 'Increases structural integrity by +45 HP and executes an emergency repair.',
    statDesc: '+45 Max HP & Instant Repair',
    apply(player) {
      player.maxHp += 45;
      player.hp = Math.min(player.maxHp, player.hp + 50);
    },
  },
  {
    id: 'sentinel',
    title: 'Autonomous Sentinel',
    icon: '🛰',
    category: 'DRONE',
    desc: 'Deploys an automated orbital drone that tracks and snipes nearby hostiles.',
    statDesc: '+1 Orbital Defense Drone',
    apply(player) {
      player.addSentinel();
    },
  },
];

// ==========================================
// PLAYER SHIP ENTITY
// ==========================================
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 18;
    this.angle = 0;

    // Health & Shields
    this.maxHp = CONFIG.BASE_HP;
    this.hp = CONFIG.BASE_HP;
    this.maxShield = CONFIG.BASE_SHIELD;
    this.shield = CONFIG.BASE_SHIELD;
    this.shieldRegenTimer = 0;
    this.shieldRegenRate = 8; // shield per sec after delay

    // Movement & Dash
    this.speed = CONFIG.BASE_SPEED;
    this.dashCooldownTimer = 0;
    this.dashTimer = 0;
    this.isDashing = false;

    // Weapons
    this.fireCooldown = 0;
    this.baseFireRate = 7.5; // shots per sec
    this.fireRateMult = 1.0;
    this.damageMult = 1.0;
    this.spreadLevel = 0;
    this.pierceLevel = 0;
    this.empLevel = 0;
    this.magnetRadius = 160;

    // Sentinels
    this.sentinels = [];

    // Experience & Progression
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 100;
    this.kills = 0;
    this.score = 0;
  }

  addSentinel() {
    this.sentinels.push({
      orbitDistance: 65 + this.sentinels.length * 15,
      angle: (this.sentinels.length * Math.PI * 2) / 3,
      speed: 2.2,
      fireTimer: 0,
    });
  }

  dash(engine) {
    if (this.dashCooldownTimer <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = CONFIG.DASH_DURATION;
      this.dashCooldownTimer = CONFIG.DASH_COOLDOWN;
      audio.playDash();

      // Burst velocity toward current angle or moving direction
      let moveAngle = this.angle;
      if (Math.abs(this.vx) > 10 || Math.abs(this.vy) > 10) {
        moveAngle = Math.atan2(this.vy, this.vx);
      }
      this.vx = Math.cos(moveAngle) * CONFIG.DASH_SPEED;
      this.vy = Math.sin(moveAngle) * CONFIG.DASH_SPEED;

      // EMP Shockwave check
      if (this.empLevel > 0) {
        engine.triggerEmpShockwave(this.x, this.y, 160 + this.empLevel * 30);
      }
    }
  }

  takeDamage(amount, engine) {
    if (this.isDashing) return; // Invulnerable during dash

    this.shieldRegenTimer = 3.5; // delay shield regeneration
    if (this.shield > 0) {
      const shieldAbsorb = Math.min(this.shield, amount);
      this.shield -= shieldAbsorb;
      amount -= shieldAbsorb;
      engine.particles.spawnSparks(this.x, this.y, 12, CONFIG.COLORS.SHIELD, 0.8);
      if (amount <= 0) return;
    }

    this.hp -= amount;
    engine.particles.spawnSparks(this.x, this.y, 18, CONFIG.COLORS.ENEMY_SCOUT, 1.2);
    engine.particles.spawnCombatText(this.x, this.y, `-${Math.round(amount)}`, '#f43f5e', true);
    audio.playExplosion(0.4);

    if (this.hp <= 0) {
      this.hp = 0;
      engine.triggerGameOver();
    }
  }

  addXp(amount, engine) {
    this.xp += amount;
    this.score += amount * 10;
    engine.particles.spawnCombatText(this.x, this.y - 20, `+${amount} XP`, CONFIG.COLORS.CORE_XP, false);
    audio.playPickup();

    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = Math.floor(this.xpToNext * 1.35 + 25);
      audio.playLevelUp();
      engine.showUpgradeModal();
    }
  }

  update(dt, input, engine) {
    // Dash countdown
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= dt;
    }
    if (this.isDashing) {
      this.dashTimer -= dt;
      engine.particles.spawnThruster(this.x, this.y, this.angle, CONFIG.COLORS.SHIELD);
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    // Shield Regeneration
    if (this.shieldRegenTimer > 0) {
      this.shieldRegenTimer -= dt;
    } else if (this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * dt);
    }

    // Movement Vectors
    if (!this.isDashing) {
      let moveX = 0;
      let moveY = 0;
      if (input.keys['KeyW'] || input.keys['ArrowUp']) moveY -= 1;
      if (input.keys['KeyS'] || input.keys['ArrowDown']) moveY += 1;
      if (input.keys['KeyA'] || input.keys['ArrowLeft']) moveX -= 1;
      if (input.keys['KeyD'] || input.keys['ArrowRight']) moveX += 1;

      const mag = Math.hypot(moveX, moveY);
      if (mag > 0) {
        const targetVx = (moveX / mag) * this.speed;
        const targetVy = (moveY / mag) * this.speed;
        this.vx += (targetVx - this.vx) * 12 * dt;
        this.vy += (targetVy - this.vy) * 12 * dt;

        // Thruster emissions
        engine.particles.spawnThruster(this.x, this.y, this.angle, CONFIG.COLORS.PLAYER_ENGINE);
      } else {
        this.vx *= Math.pow(0.05, dt);
        this.vy *= Math.pow(0.05, dt);
      }
    }

    // Integrate Position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Bounds Clamping
    this.x = Math.max(this.radius, Math.min(CONFIG.WORLD_WIDTH - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(CONFIG.WORLD_HEIGHT - this.radius, this.y));

    // Aim Angle relative to world camera
    const mouseWorldX = input.mouseX + engine.camera.x;
    const mouseWorldY = input.mouseY + engine.camera.y;
    this.angle = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);

    // Continuous Primary Weapon Firing
    if (this.fireCooldown > 0) {
      this.fireCooldown -= dt;
    }
    if (input.mouseDown && this.fireCooldown <= 0) {
      this.fireWeapon(engine);
    }

    // Update Orbital Sentinels
    for (const sentinel of this.sentinels) {
      sentinel.angle += sentinel.speed * dt;
      sentinel.fireTimer -= dt;
      const sX = this.x + Math.cos(sentinel.angle) * sentinel.orbitDistance;
      const sY = this.y + Math.sin(sentinel.angle) * sentinel.orbitDistance;

      if (sentinel.fireTimer <= 0) {
        const target = engine.findNearestEnemy(sX, sY, 320);
        if (target) {
          sentinel.fireTimer = 0.5;
          const sAngle = Math.atan2(target.y - sY, target.x - sX);
          engine.spawnPlayerLaser(sX, sY, sAngle, 22 * this.damageMult, 1, CONFIG.COLORS.LASER_SENTINEL);
          audio.playLaser(1.4);
        }
      }
    }
  }

  fireWeapon(engine) {
    const fireInterval = 1.0 / (this.baseFireRate * this.fireRateMult);
    this.fireCooldown = fireInterval;
    // Calibrated weapon damage curve with power scaling
    const baseDmg = 48 * this.damageMult;
    const pierce = 1 + this.pierceLevel;

    // Fire center shot with augmented neon luminescence
    engine.spawnPlayerLaser(this.x, this.y, this.angle, baseDmg, pierce, CONFIG.COLORS.LASER_PLAYER);

    // Spread barrels with high-density laser dispersion
    if (this.spreadLevel > 0) {
      const spreadStep = 0.13;
      for (let s = 1; s <= this.spreadLevel; s++) {
        engine.spawnPlayerLaser(this.x, this.y, this.angle + spreadStep * s, baseDmg * 0.92, pierce, CONFIG.COLORS.LASER_PLAYER);
        engine.spawnPlayerLaser(this.x, this.y, this.angle - spreadStep * s, baseDmg * 0.92, pierce, CONFIG.COLORS.LASER_PLAYER);
      }
    }

    audio.playLaser(1.0);
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Circular Shield Bubble
    if (this.shield > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = CONFIG.COLORS.SHIELD;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.4 + (this.shield / this.maxShield) * 0.4;
      ctx.shadowColor = CONFIG.COLORS.SHIELD;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    }

    // Ship Body Geometry
    ctx.rotate(this.angle);
    ctx.shadowColor = CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 14;

    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-14, -14);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-14, 14);
    ctx.closePath();
    ctx.fill();

    // Cockpit Canopy
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Render Orbital Sentinels
    for (const sentinel of this.sentinels) {
      const sX = this.x + Math.cos(sentinel.angle) * sentinel.orbitDistance;
      const sY = this.y + Math.sin(sentinel.angle) * sentinel.orbitDistance;
      ctx.save();
      ctx.translate(sX, sY);
      ctx.fillStyle = CONFIG.COLORS.LASER_SENTINEL;
      ctx.shadowColor = CONFIG.COLORS.LASER_SENTINEL;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

// ==========================================
// ENEMY SWARM & BOSS ADVERSARIES
// ==========================================
class Enemy {
  constructor(x, y, type = 'scout') {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.type = type;
    this.angle = 0;

    switch (type) {
      case 'scout':
        this.radius = 14;
        this.hp = 35;
        this.maxHp = 35;
        this.speed = 180;
        this.color = CONFIG.COLORS.ENEMY_SCOUT;
        this.scoreVal = 10;
        this.xpVal = 15;
        this.damage = 15;
        break;
      case 'stalker':
        this.radius = 16;
        this.hp = 55;
        this.maxHp = 55;
        this.speed = 220;
        this.color = CONFIG.COLORS.ENEMY_STALKER;
        this.scoreVal = 25;
        this.xpVal = 30;
        this.damage = 30;
        this.chargeTimer = 0;
        break;
      case 'mech':
        this.radius = 24;
        this.hp = 180;
        this.maxHp = 180;
        this.speed = 110;
        this.color = CONFIG.COLORS.ENEMY_MECH;
        this.scoreVal = 60;
        this.xpVal = 70;
        this.damage = 25;
        this.fireCooldown = 2.0;
        break;
      case 'boss':
        this.radius = 65;
        this.hp = 2500;
        this.maxHp = 2500;
        this.speed = 65;
        this.color = CONFIG.COLORS.ENEMY_BOSS;
        this.scoreVal = 1000;
        this.xpVal = 500;
        this.damage = 45;
        this.attackPhase = 0;
        this.phaseTimer = 0;
        this.spiralAngle = 0;
        break;
    }
  }

  update(dt, player, engine) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);

    if (this.type === 'scout') {
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
    } else if (this.type === 'stalker') {
      this.chargeTimer += dt;
      const speedMult = this.chargeTimer % 2.5 > 1.8 ? 1.9 : 0.8;
      this.vx = Math.cos(this.angle) * this.speed * speedMult;
      this.vy = Math.sin(this.angle) * this.speed * speedMult;
    } else if (this.type === 'mech') {
      if (dist > 300) {
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
      } else {
        this.vx *= 0.9;
        this.vy *= 0.9;
      }
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0) {
        this.fireCooldown = 2.2;
        engine.spawnEnemyBullet(this.x, this.y, this.angle, 350, 15);
      }
    } else if (this.type === 'boss') {
      // Void Dreadnought AI - High Density Multiphase Storm
      this.phaseTimer += dt;
      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;

      // Rotating 4-Arm Spiral Bullet Storm
      this.spiralAngle += 4.8 * dt;
      if (this.phaseTimer >= 0.10) {
        this.phaseTimer = 0;
        const arms = 4;
        for (let a = 0; a < arms; a++) {
          const shootAng = this.spiralAngle + (a * Math.PI * 2) / arms;
          engine.spawnEnemyBullet(this.x, this.y, shootAng, 310, 18);
        }
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Contact damage check
    if (dist < this.radius + player.radius) {
      player.takeDamage(this.damage, engine);
      if (this.type !== 'boss') {
        this.hp = 0; // Stalker / scout detonates on impact
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.type === 'boss' ? 24 : 12;

    if (this.type === 'scout') {
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'stalker') {
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-14, -14);
      ctx.lineTo(-14, 14);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'mech') {
      ctx.beginPath();
      ctx.rect(-18, -18, 36, 36);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, -4, 16, 8); // Cannon
    } else if (this.type === 'boss') {
      // Colossal Flagship Geometry
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(-45, -55);
      ctx.lineTo(-30, -20);
      ctx.lineTo(-55, 0);
      ctx.lineTo(-30, 20);
      ctx.lineTo(-45, 55);
      ctx.closePath();
      ctx.fill();

      // Core eye glow
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(10, 0, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Health bar for heavy & boss
    if (this.type === 'mech' || this.type === 'boss') {
      ctx.save();
      const bw = this.type === 'boss' ? 120 : 36;
      const bh = 5;
      const bx = this.x - bw / 2;
      const by = this.y - this.radius - 14;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = this.color;
      ctx.fillRect(bx, by, bw * (Math.max(0, this.hp) / this.maxHp), bh);
      ctx.restore();
    }
  }
}

// ==========================================
// LASERS, BULLETS & ENERGY CORES
// ==========================================
class Laser {
  constructor(x, y, angle, damage, pierce = 1, color = CONFIG.COLORS.LASER_PLAYER) {
    this.x = x;
    this.y = y;
    this.speed = 920;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.angle = angle;
    this.damage = damage;
    this.pierce = pierce;
    this.color = color;
    this.life = 1.6;
    this.length = 24;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-this.length, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.restore();
  }
}

class EnemyBullet {
  constructor(x, y, angle, speed, damage) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.damage = damage;
    this.radius = 5.5;
    this.life = 3.5;
    this.color = '#f43f5e';
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class EnergyCore {
  constructor(x, y, val = 15) {
    this.x = x;
    this.y = y;
    this.val = val;
    this.radius = 5.5;
    this.vx = 0;
    this.vy = 0;
    this.color = CONFIG.COLORS.CORE_XP;
  }

  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < player.magnetRadius) {
      const suctionSpeed = 380 + (1 - dist / player.magnetRadius) * 450;
      this.vx = (dx / dist) * suctionSpeed;
      this.vy = (dy / dist) * suctionSpeed;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ==========================================
// GAME ENGINE & WORLD ORCHESTRATOR
// ==========================================
export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.state = 'TITLE'; // 'TITLE', 'PLAYING', 'UPGRADE', 'GAMEOVER'
    this.wave = 1;
    this.waveTimer = 0;
    this.waveDuration = 30; // seconds per wave
    this.spawnTimer = 0;
    this.bossSpawned = false;

    this.player = new Player(CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2);
    this.enemies = [];
    this.playerLasers = [];
    this.enemyBullets = [];
    this.energyCores = [];
    this.particles = new ParticleEngine();

    this.camera = { x: 0, y: 0 };
    this.availableUpgradeCards = [];

    // Background Stars (3 parallax layers)
    this.stars = [];
    for (let i = 0; i < 140; i++) {
      this.stars.push({
        x: Math.random() * CONFIG.WORLD_WIDTH,
        y: Math.random() * CONFIG.WORLD_HEIGHT,
        layer: Math.floor(Math.random() * 3) + 1,
        radius: 0.8 + Math.random() * 1.6,
        alpha: 0.2 + Math.random() * 0.8,
      });
    }

    // Input state
    this.input = {
      keys: {},
      mouseX: CONFIG.CANVAS_WIDTH / 2,
      mouseY: CONFIG.CANVAS_HEIGHT / 2,
      mouseDown: false,
    };

    this.bindEvents();
    this.checkScreenshotMode();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.input.keys[e.code] = true;
      audio.init();

      if (this.state === 'TITLE' && (e.code === 'Space' || e.code === 'Enter')) {
        this.startGame();
      } else if (this.state === 'GAMEOVER' && (e.code === 'Space' || e.code === 'Enter')) {
        this.restartGame();
      } else if (this.state === 'PLAYING') {
        if (e.code === 'Space') {
          this.player.dash(this);
        }
      } else if (this.state === 'UPGRADE') {
        if (e.code === 'Digit1') this.chooseUpgrade(0);
        if (e.code === 'Digit2') this.chooseUpgrade(1);
        if (e.code === 'Digit3') this.chooseUpgrade(2);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CONFIG.CANVAS_WIDTH / rect.width;
      const scaleY = CONFIG.CANVAS_HEIGHT / rect.height;
      this.input.mouseX = (e.clientX - rect.left) * scaleX;
      this.input.mouseY = (e.clientY - rect.top) * scaleY;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.input.mouseDown = true;
      audio.init();

      if (this.state === 'TITLE') {
        this.startGame();
      } else if (this.state === 'GAMEOVER') {
        this.restartGame();
      } else if (this.state === 'UPGRADE') {
        this.handleUpgradeModalClick(this.input.mouseX, this.input.mouseY);
      }
    });

    window.addEventListener('mouseup', () => {
      this.input.mouseDown = false;
    });
  }

  checkScreenshotMode() {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');

    if (!shot) return;

    console.log(`[VoidSurvivor] Initializing deterministic visual telemetry: ?shot=${shot}`);

    if (shot.includes('1') || shot.includes('cover')) {
      this.setupCoverScenario();
    } else if (shot.includes('2') || shot.includes('combat')) {
      this.setupCombatScenario();
    } else if (shot.includes('3') || shot.includes('boss')) {
      this.setupBossScenario();
    } else if (shot.includes('4') || shot.includes('upgrade')) {
      this.setupUpgradeScenario();
    }
  }

  setupCoverScenario() {
    this.state = 'TITLE';
    // Backing battlefield setup
    this.player.x = CONFIG.WORLD_WIDTH / 2;
    this.player.y = CONFIG.WORLD_HEIGHT / 2 + 80;
    this.player.angle = -Math.PI / 2;
    this.enemies = [
      new Enemy(this.player.x - 220, this.player.y - 200, 'scout'),
      new Enemy(this.player.x + 220, this.player.y - 200, 'stalker'),
      new Enemy(this.player.x, this.player.y - 280, 'mech'),
    ];
    this.particles.spawnThruster(this.player.x, this.player.y, this.player.angle);
    this.particles.spawnSparks(this.player.x, this.player.y - 120, 20, CONFIG.COLORS.PLAYER);
  }

  setupCombatScenario() {
    this.state = 'PLAYING';
    this.wave = 4;
    this.waveTimer = 16.5;
    this.player.score = 14850;
    this.player.kills = 88;
    this.player.level = 6;
    this.player.xp = 320;
    this.player.xpToNext = 580;
    this.player.spreadLevel = 2;
    this.player.addSentinel();

    const px = CONFIG.WORLD_WIDTH / 2;
    const py = CONFIG.WORLD_HEIGHT / 2;
    this.player.x = px;
    this.player.y = py;
    this.player.angle = -0.4;

    // Spawn rich swarm around
    this.enemies = [
      new Enemy(px + 260, py - 90, 'scout'),
      new Enemy(px + 310, py - 30, 'scout'),
      new Enemy(px + 220, py + 140, 'stalker'),
      new Enemy(px - 280, py - 180, 'mech'),
      new Enemy(px - 190, py + 220, 'scout'),
      new Enemy(px + 120, py + 260, 'stalker'),
    ];

    // Spawn dynamic lasers and explosions
    this.spawnPlayerLaser(px, py, -0.4, 45, 2, CONFIG.COLORS.LASER_PLAYER);
    this.spawnPlayerLaser(px, py, -0.26, 38, 2, CONFIG.COLORS.LASER_PLAYER);
    this.spawnPlayerLaser(px, py, -0.54, 38, 2, CONFIG.COLORS.LASER_PLAYER);

    // Energy cores and particles
    for (let i = 0; i < 18; i++) {
      this.energyCores.push(new EnergyCore(px + (Math.random() - 0.5) * 500, py + (Math.random() - 0.5) * 400, 20));
    }
    this.particles.spawnSparks(px + 260, py - 90, 25, CONFIG.COLORS.ENEMY_SCOUT);
    this.particles.spawnCombatText(px + 260, py - 90, 'CRIT 75', '#f43f5e', true);
    this.particles.spawnCombatText(px - 140, py - 60, '+100 XP', CONFIG.COLORS.CORE_XP, false);
  }

  setupBossScenario() {
    this.state = 'PLAYING';
    this.wave = 10;
    this.waveTimer = 29.0;
    this.player.score = 48900;
    this.player.kills = 320;
    this.player.level = 14;
    this.player.spreadLevel = 3;
    this.player.addSentinel();
    this.player.addSentinel();

    const px = CONFIG.WORLD_WIDTH / 2;
    const py = CONFIG.WORLD_HEIGHT / 2 + 180;
    this.player.x = px;
    this.player.y = py;
    this.player.angle = -Math.PI / 2;

    const boss = new Enemy(px, py - 380, 'boss');
    boss.hp = 1850;
    this.enemies = [boss];

    // Rich spiral bullet pattern around boss
    for (let a = 0; a < 24; a++) {
      const ang = (a * Math.PI * 2) / 24;
      const dist = 120 + a * 8;
      const bx = boss.x + Math.cos(ang) * dist;
      const by = boss.y + Math.sin(ang) * dist;
      this.enemyBullets.push(new EnemyBullet(bx, by, ang, 280, 18));
    }

    this.particles.spawnShockwave(px, py - 380, 160, CONFIG.COLORS.ENEMY_BOSS);
    this.particles.spawnCombatText(boss.x, boss.y - 80, 'DREADNOUGHT VULNERABLE', '#e11d48', true);
  }

  setupUpgradeScenario() {
    this.setupCombatScenario();
    this.state = 'UPGRADE';
    this.availableUpgradeCards = [UPGRADES[0], UPGRADES[1], UPGRADES[7]];
  }

  startGame() {
    this.state = 'PLAYING';
    this.wave = 1;
    this.waveTimer = 0;
    this.player = new Player(CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2);
    this.enemies = [];
    this.playerLasers = [];
    this.enemyBullets = [];
    this.energyCores = [];
    this.particles = new ParticleEngine();
    this.bossSpawned = false;
  }

  restartGame() {
    this.startGame();
  }

  triggerGameOver() {
    this.state = 'GAMEOVER';
    audio.playExplosion(1.5);
  }

  showUpgradeModal() {
    this.state = 'UPGRADE';
    // Select 3 random unique upgrades
    const shuffled = [...UPGRADES].sort(() => 0.5 - Math.random());
    this.availableUpgradeCards = shuffled.slice(0, 3);
  }

  chooseUpgrade(index) {
    if (this.availableUpgradeCards[index]) {
      this.availableUpgradeCards[index].apply(this.player);
      this.particles.spawnShockwave(this.player.x, this.player.y, 180, CONFIG.COLORS.PLAYER);
      this.state = 'PLAYING';
    }
  }

  handleUpgradeModalClick(mx, my) {
    const cardWidth = 320;
    const cardHeight = 360;
    const gap = 30;
    const totalW = cardWidth * 3 + gap * 2;
    const startX = (CONFIG.CANVAS_WIDTH - totalW) / 2;
    const startY = (CONFIG.CANVAS_HEIGHT - cardHeight) / 2 + 20;

    for (let i = 0; i < 3; i++) {
      const cx = startX + i * (cardWidth + gap);
      const cy = startY;
      if (mx >= cx && mx <= cx + cardWidth && my >= cy && my <= cy + cardHeight) {
        this.chooseUpgrade(i);
        break;
      }
    }
  }

  findNearestEnemy(x, y, maxDist = 400) {
    let nearest = null;
    let minDist = maxDist;
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }
    return nearest;
  }

  spawnPlayerLaser(x, y, angle, damage, pierce, color) {
    this.playerLasers.push(new Laser(x, y, angle, damage, pierce, color));
  }

  spawnEnemyBullet(x, y, angle, speed, damage) {
    this.enemyBullets.push(new EnemyBullet(x, y, angle, speed, damage));
  }

  triggerEmpShockwave(x, y, radius = 180) {
    this.particles.spawnShockwave(x, y, radius, CONFIG.COLORS.SHIELD);
    // Destroy bullets in radius
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      if (Math.hypot(b.x - x, b.y - y) <= radius) {
        this.particles.spawnSparks(b.x, b.y, 6, CONFIG.COLORS.SHIELD);
        this.enemyBullets.splice(i, 1);
      }
    }
    // Damage enemies
    for (const e of this.enemies) {
      if (Math.hypot(e.x - x, e.y - y) <= radius) {
        e.hp -= 80;
        this.particles.spawnCombatText(e.x, e.y, 'EMP 80', CONFIG.COLORS.SHIELD, true);
      }
    }
  }

  update(dt) {
    // Background star twinkle
    for (const star of this.stars) {
      star.alpha += (Math.random() - 0.5) * 0.1;
      star.alpha = Math.max(0.2, Math.min(0.9, star.alpha));
    }

    if (this.state === 'UPGRADE') return; // Paused during upgrade

    this.particles.update(dt);

    if (this.state === 'TITLE') {
      for (const e of this.enemies) {
        e.update(dt, this.player, this);
      }
      return;
    }

    if (this.state === 'GAMEOVER') return;

    // Wave Director & Spawner
    this.waveTimer += dt;
    this.spawnTimer += dt;

    const spawnInterval = Math.max(0.4, 2.2 - this.wave * 0.15);
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnSwarmEnemy();
    }

    // Boss Wave Trigger
    if (this.wave % 5 === 0 && !this.bossSpawned) {
      this.bossSpawned = true;
      const bX = this.player.x + (Math.random() > 0.5 ? 600 : -600);
      const bY = this.player.y + (Math.random() > 0.5 ? 400 : -400);
      this.enemies.push(new Enemy(bX, bY, 'boss'));
      this.particles.spawnCombatText(this.player.x, this.player.y - 100, 'WARNING: DREADNOUGHT DETECTED', '#e11d48', true);
    }

    if (this.waveTimer >= this.waveDuration) {
      this.waveTimer = 0;
      this.wave += 1;
      this.bossSpawned = false;
      this.particles.spawnCombatText(this.player.x, this.player.y - 70, `SECTOR WAVE ${this.wave}`, CONFIG.COLORS.PLAYER, true);
    }

    // Update Player
    this.player.update(dt, this.input, this);

    // Update Camera
    this.camera.x = this.player.x - CONFIG.CANVAS_WIDTH / 2;
    this.camera.y = this.player.y - CONFIG.CANVAS_HEIGHT / 2;
    this.camera.x = Math.max(0, Math.min(CONFIG.WORLD_WIDTH - CONFIG.CANVAS_WIDTH, this.camera.x));
    this.camera.y = Math.max(0, Math.min(CONFIG.WORLD_HEIGHT - CONFIG.CANVAS_HEIGHT, this.camera.y));

    // Update Player Lasers & Collisions
    for (let i = this.playerLasers.length - 1; i >= 0; i--) {
      const l = this.playerLasers[i];
      l.update(dt);

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (Math.hypot(e.x - l.x, e.y - l.y) <= e.radius + 6) {
          e.hp -= l.damage;
          this.particles.spawnSparks(l.x, l.y, 8, l.color);
          this.particles.spawnCombatText(e.x, e.y, `${Math.round(l.damage)}`, '#38bdf8', false);
          l.pierce -= 1;
          if (l.pierce <= 0) {
            this.playerLasers.splice(i, 1);
            break;
          }
        }
      }

      if (l.life <= 0 && this.playerLasers[i] === l) {
        this.playerLasers.splice(i, 1);
      }
    }

    // Update Enemies & Drops
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.player, this);

      if (e.hp <= 0) {
        this.player.kills += 1;
        this.player.score += e.scoreVal;
        this.energyCores.push(new EnergyCore(e.x, e.y, e.xpVal));
        this.particles.spawnSparks(e.x, e.y, e.type === 'boss' ? 50 : 18, e.color, 1.3);
        audio.playExplosion(e.type === 'boss' ? 1.8 : 0.8);
        this.enemies.splice(i, 1);
      }
    }

    // Update Enemy Bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.update(dt);

      if (Math.hypot(b.x - this.player.x, b.y - this.player.y) <= this.player.radius + b.radius) {
        this.player.takeDamage(b.damage, this);
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (b.life <= 0) {
        this.enemyBullets.splice(i, 1);
      }
    }

    // Update Energy Cores
    for (let i = this.energyCores.length - 1; i >= 0; i--) {
      const c = this.energyCores[i];
      c.update(dt, this.player);

      if (Math.hypot(c.x - this.player.x, c.y - this.player.y) <= this.player.radius + c.radius + 8) {
        this.player.addXp(c.val, this);
        this.energyCores.splice(i, 1);
      }
    }
  }

  spawnSwarmEnemy() {
    // Spawn off-camera in world
    const angle = Math.random() * Math.PI * 2;
    const dist = 750 + Math.random() * 200;
    const sx = Math.max(50, Math.min(CONFIG.WORLD_WIDTH - 50, this.player.x + Math.cos(angle) * dist));
    const sy = Math.max(50, Math.min(CONFIG.WORLD_HEIGHT - 50, this.player.y + Math.sin(angle) * dist));

    const roll = Math.random();
    let type = 'scout';
    if (this.wave >= 2 && roll > 0.6) type = 'stalker';
    if (this.wave >= 3 && roll > 0.88) type = 'mech';

    this.enemies.push(new Enemy(sx, sy, type));
  }

  render() {
    this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    this.ctx.save();
    // Apply Camera Transform
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Parallax Starfield
    for (const star of this.stars) {
      this.ctx.save();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.globalAlpha = star.alpha;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Tactical Cyber Grid
    this.renderCyberGrid();

    // World Entities
    for (const core of this.energyCores) core.render(this.ctx);
    for (const laser of this.playerLasers) laser.render(this.ctx);
    for (const bullet of this.enemyBullets) bullet.render(this.ctx);
    for (const enemy of this.enemies) enemy.render(this.ctx);
    this.player.render(this.ctx);

    // Particles & Shockwaves
    this.particles.renderWorld(this.ctx);

    this.ctx.restore();

    // HUD & Screen Overlays (Screen space)
    this.renderHUD();

    if (this.state === 'TITLE') {
      this.renderTitleScreen();
    } else if (this.state === 'UPGRADE') {
      this.renderUpgradeModal();
    } else if (this.state === 'GAMEOVER') {
      this.renderGameOverScreen();
    }
  }

  renderCyberGrid() {
    const gridStep = 80;
    this.ctx.strokeStyle = CONFIG.COLORS.GRID;
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    for (let x = 0; x <= CONFIG.WORLD_WIDTH; x += gridStep) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CONFIG.WORLD_HEIGHT);
    }
    for (let y = 0; y <= CONFIG.WORLD_HEIGHT; y += gridStep) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CONFIG.WORLD_WIDTH, y);
    }
    this.ctx.stroke();

    // World Boundary Border
    this.ctx.strokeStyle = CONFIG.COLORS.CARD_BORDER;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
  }

  renderHUD() {
    const ctx = this.ctx;

    // Top XP Progress Bar
    const xpPercent = Math.min(1.0, this.player.xp / this.player.xpToNext);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, 8);
    ctx.fillStyle = CONFIG.COLORS.CORE_XP;
    ctx.shadowColor = CONFIG.COLORS.CORE_XP;
    ctx.shadowBlur = 8;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH * xpPercent, 8);
    ctx.shadowBlur = 0;

    // Health & Shield Telemetry (Top Left)
    ctx.save();
    ctx.font = 'bold 15px Rajdhani, monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_MAIN;
    ctx.fillText(`LVL ${this.player.level}`, 24, 34);

    // HP Bar
    const hpW = 200;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.fillRect(80, 22, hpW, 14);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(80, 22, hpW * (this.player.hp / this.player.maxHp), 14);

    // Shield Bar
    ctx.fillStyle = 'rgba(129, 140, 248, 0.25)';
    ctx.fillRect(80, 42, hpW, 10);
    ctx.fillStyle = CONFIG.COLORS.SHIELD;
    ctx.fillRect(80, 42, hpW * (this.player.shield / this.player.maxShield), 10);

    ctx.font = '12px Rajdhani, monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_MUTED;
    ctx.fillText(`HP: ${Math.round(this.player.hp)}/${this.player.maxHp}`, 290, 34);
    ctx.fillText(`SHIELD: ${Math.round(this.player.shield)}/${this.player.maxShield}`, 290, 51);

    // Dash Indicator
    const dashReady = this.player.dashCooldownTimer <= 0;
    ctx.fillStyle = dashReady ? CONFIG.COLORS.PLAYER : CONFIG.COLORS.TEXT_MUTED;
    ctx.fillText(`TACTICAL DASH: ${dashReady ? 'READY [SPACE]' : (this.player.dashCooldownTimer).toFixed(1) + 's'}`, 80, 72);
    ctx.restore();

    // Wave & Mission Clock (Top Center)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Rajdhani, monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_MAIN;
    ctx.shadowColor = CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 10;
    ctx.fillText(`SECTOR WAVE 0${this.wave}`, CONFIG.CANVAS_WIDTH / 2, 40);

    ctx.font = '14px Rajdhani, monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_MUTED;
    const remaining = Math.max(0, this.waveDuration - this.waveTimer);
    ctx.fillText(`TRANSMISSION CYCLE: ${remaining.toFixed(1)}s`, CONFIG.CANVAS_WIDTH / 2, 60);
    ctx.restore();

    // Score & Telemetry (Top Right)
    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = 'bold 20px Rajdhani, monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_MAIN;
    ctx.fillText(`SCORE: ${this.player.score.toLocaleString()}`, CONFIG.CANVAS_WIDTH - 24, 36);

    ctx.font = '14px Rajdhani, monospace';
    ctx.fillStyle = CONFIG.COLORS.ENEMY_SCOUT;
    ctx.fillText(`PURGED HOSTILES: ${this.player.kills}`, CONFIG.CANVAS_WIDTH - 24, 58);
    ctx.restore();

    // Radar Minimap (Bottom Right)
    this.renderMinimap();
  }

  renderMinimap() {
    const ctx = this.ctx;
    const mapW = 160;
    const mapH = 90;
    const mapX = CONFIG.CANVAS_WIDTH - mapW - 20;
    const mapY = CONFIG.CANVAS_HEIGHT - mapH - 20;

    ctx.save();
    ctx.fillStyle = 'rgba(7, 9, 19, 0.85)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    const scaleX = mapW / CONFIG.WORLD_WIDTH;
    const scaleY = mapH / CONFIG.WORLD_HEIGHT;

    // Viewport box
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(mapX + this.camera.x * scaleX, mapY + this.camera.y * scaleY, CONFIG.CANVAS_WIDTH * scaleX, CONFIG.CANVAS_HEIGHT * scaleY);

    // Hostiles
    for (const e of this.enemies) {
      ctx.fillStyle = e.type === 'boss' ? '#e11d48' : '#f43f5e';
      const rad = e.type === 'boss' ? 4 : 2;
      ctx.beginPath();
      ctx.arc(mapX + e.x * scaleX, mapY + e.y * scaleY, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player
    ctx.fillStyle = CONFIG.COLORS.PLAYER;
    ctx.shadowColor = CONFIG.COLORS.PLAYER;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(mapX + this.player.x * scaleX, mapY + this.player.y * scaleY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderTitleScreen() {
    const ctx = this.ctx;
    ctx.save();

    // Dark backdrop scrim
    ctx.fillStyle = 'rgba(7, 9, 19, 0.7)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    ctx.textAlign = 'center';

    // Title & Subtitle
    ctx.font = 'bold 54px Rajdhani, monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 24;
    ctx.fillText('VOID SURVIVOR', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 80);

    ctx.font = 'bold 24px Rajdhani, monospace';
    ctx.fillStyle = '#818cf8';
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 14;
    ctx.fillText('PROTOCOL ZERO', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 35);

    // Controls Brief
    ctx.font = '16px Rajdhani, monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_MUTED;
    ctx.shadowBlur = 0;
    ctx.fillText('WASD: Vector Propulsion   |   MOUSE: Gimbal Aim & Fire   |   SPACE: Tactical Dash', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 35);

    // Call to Action
    const pulse = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
    ctx.font = 'bold 22px Rajdhani, monospace';
    ctx.fillStyle = `rgba(248, 250, 252, ${pulse})`;
    ctx.fillText('PRESS [SPACE] OR CLICK TO INITIATE PROTOCOL', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 95);

    ctx.restore();
  }

  renderUpgradeModal() {
    const ctx = this.ctx;
    ctx.save();

    // Scrim
    ctx.fillStyle = 'rgba(7, 9, 19, 0.85)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Header
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px Rajdhani, monospace';
    ctx.fillStyle = CONFIG.COLORS.CORE_XP;
    ctx.shadowColor = CONFIG.COLORS.CORE_XP;
    ctx.shadowBlur = 18;
    ctx.fillText('CYBERNETIC AUGMENTATION DETECTED', CONFIG.CANVAS_WIDTH / 2, 130);

    ctx.font = '16px Rajdhani, monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_MUTED;
    ctx.shadowBlur = 0;
    ctx.fillText('Select an architectural protocol upgrade to integrate into vessel mainframe', CONFIG.CANVAS_WIDTH / 2, 165);

    // Cards
    const cardWidth = 320;
    const cardHeight = 360;
    const gap = 30;
    const totalW = cardWidth * 3 + gap * 2;
    const startX = (CONFIG.CANVAS_WIDTH - totalW) / 2;
    const startY = (CONFIG.CANVAS_HEIGHT - cardHeight) / 2 + 30;

    for (let i = 0; i < this.availableUpgradeCards.length; i++) {
      const card = this.availableUpgradeCards[i];
      const cx = startX + i * (cardWidth + gap);
      const cy = startY;

      // Card Background Glassmorphism
      ctx.fillStyle = CONFIG.COLORS.CARD_BG;
      ctx.fillRect(cx, cy, cardWidth, cardHeight);
      ctx.strokeStyle = CONFIG.COLORS.CARD_BORDER;
      ctx.lineWidth = 2;
      ctx.shadowColor = CONFIG.COLORS.CARD_BORDER;
      ctx.shadowBlur = 10;
      ctx.strokeRect(cx, cy, cardWidth, cardHeight);
      ctx.shadowBlur = 0;

      // Key shortcut badge
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fillRect(cx + 20, cy + 20, 36, 26);
      ctx.font = 'bold 15px Rajdhani, monospace';
      ctx.fillStyle = CONFIG.COLORS.PLAYER;
      ctx.textAlign = 'center';
      ctx.fillText(`[${i + 1}]`, cx + 38, cy + 38);

      // Category
      ctx.font = '12px Rajdhani, monospace';
      ctx.fillStyle = CONFIG.COLORS.TEXT_MUTED;
      ctx.textAlign = 'right';
      ctx.fillText(card.category, cx + cardWidth - 20, cy + 38);

      // Icon
      ctx.font = '48px Rajdhani, monospace';
      ctx.fillStyle = CONFIG.COLORS.TEXT_MAIN;
      ctx.textAlign = 'center';
      ctx.fillText(card.icon, cx + cardWidth / 2, cy + 115);

      // Title
      ctx.font = 'bold 22px Rajdhani, monospace';
      ctx.fillStyle = CONFIG.COLORS.PLAYER;
      ctx.fillText(card.title, cx + cardWidth / 2, cy + 175);

      // Stat delta description
      ctx.font = 'bold 14px Rajdhani, monospace';
      ctx.fillStyle = CONFIG.COLORS.CORE_XP;
      ctx.fillText(card.statDesc, cx + cardWidth / 2, cy + 205);

      // Body text description
      ctx.font = '14px Rajdhani, monospace';
      ctx.fillStyle = CONFIG.COLORS.TEXT_MAIN;
      this.renderMultilineText(ctx, card.desc, cx + 24, cy + 240, cardWidth - 48, 20);

      // Select button
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fillRect(cx + 24, cy + cardHeight - 55, cardWidth - 48, 36);
      ctx.strokeStyle = CONFIG.COLORS.PLAYER;
      ctx.strokeRect(cx + 24, cy + cardHeight - 55, cardWidth - 48, 36);
      ctx.font = 'bold 14px Rajdhani, monospace';
      ctx.fillStyle = CONFIG.COLORS.PLAYER;
      ctx.fillText(`INSTALL PROTOCOL [${i + 1}]`, cx + cardWidth / 2, cy + cardHeight - 32);
    }

    ctx.restore();
  }

  renderGameOverScreen() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(10, 2, 6, 0.88)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.font = 'bold 54px Rajdhani, monospace';
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 24;
    ctx.fillText('SYSTEM BREACH : PROTOCOL TERMINATED', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 90);

    // Telemetry Statistics Box
    ctx.font = '20px Rajdhani, monospace';
    ctx.fillStyle = CONFIG.COLORS.TEXT_MAIN;
    ctx.shadowBlur = 0;
    ctx.fillText(`FINAL PROTOCOL SCORE: ${this.player.score.toLocaleString()}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 25);
    ctx.fillText(`HOSTILES PURGED: ${this.player.kills}    |    AUGMENTATION LEVEL: ${this.player.level}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 10);
    ctx.fillText(`SECTORS NAVIGATED: ${this.wave}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 45);

    // Restart prompt
    const pulse = 0.6 + Math.sin(Date.now() * 0.006) * 0.4;
    ctx.font = 'bold 24px Rajdhani, monospace';
    ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
    ctx.fillText('PRESS [SPACE] TO REBOOT MAINFRAME', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 120);

    ctx.restore();
  }

  renderMultilineText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x + maxWidth / 2, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x + maxWidth / 2, currentY);
  }
}

// ==========================================
// BOOTSTRAP INITIALIZATION
// ==========================================
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
      console.error('[VoidSurvivor] Canvas #game-canvas not located in DOM.');
      return;
    }

    const engine = new GameEngine(canvas);
    let lastTime = performance.now();

    function gameLoop(now) {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      engine.update(dt);
      engine.render();

      requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
    console.log('[VoidSurvivor] Game loop initiated successfully.');
  });
}
