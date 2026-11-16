// Void Survivor - Game World Simulation & State Controller

import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  UPGRADES,
  PALETTE
} from './config.js';
import { ScoutDrone, KamikazeStalker, HeavyLaserMech, VoidDreadnoughtBoss } from './enemies.js';
import { ParticleSystem } from './particles.js';
import { sound } from './audio.js';

export class GameWorld {
  constructor() {
    this.particles = new ParticleSystem();
    this.reset();
  }

  reset() {
    this.player = {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
      vx: 0,
      vy: 0,
      speed: 260,
      size: 18,
      angle: 0,
      hull: 100,
      maxHull: 100,
      shield: 60,
      maxShield: 60,
      shieldRegenDelay: 0,
      dashCooldown: 0,
      dashDuration: 0,
      isDashing: false,
      fireTimer: 0,
      level: 1,
      xp: 0,
      xpToNext: 100,
      upgrades: new Map()
    };

    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.energyCores = [];
    this.orbitalDrones = [];

    this.score = 0;
    this.multiplier = 1;
    this.streakTimer = 0;
    this.wave = 1;
    this.waveTime = 30;
    this.spawnTimer = 1.0;
    this.bossSpawned = false;

    this.camera = { x: this.player.x - CANVAS_WIDTH / 2, y: this.player.y - CANVAS_HEIGHT / 2 };
    this.screenShake = 0;
    this.isPaused = false;
    this.isLevelingUp = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.levelUpOptions = [];

    this.stats = {
      enemiesKilled: 0,
      coresCollected: 0,
      damageDealt: 0,
      timeSurvived: 0
    };
  }

  triggerLevelUp() {
    this.isLevelingUp = true;
    sound.playLevelUp();

    // Pick 3 random upgrades from pool
    const available = [...UPGRADES];
    const picked = [];
    while (picked.length < 3 && available.length > 0) {
      const idx = Math.floor(Math.random() * available.length);
      picked.push(available.splice(idx, 1)[0]);
    }
    this.levelUpOptions = picked;
  }

  selectUpgrade(upgradeId) {
    const currentLvl = this.player.upgrades.get(upgradeId) || 0;
    this.player.upgrades.set(upgradeId, currentLvl + 1);

    // Apply upgrade effects
    if (upgradeId === 'plasma_spread') {
      // Handled in firing
    } else if (upgradeId === 'hyper_fire') {
      this.player.speed += 15;
    } else if (upgradeId === 'shield_matrix') {
      this.player.maxShield += 30;
      this.player.shield = this.player.maxShield;
    } else if (upgradeId === 'nano_repair') {
      this.player.maxHull += 25;
      this.player.hull = Math.min(this.player.maxHull, this.player.hull + 40);
    } else if (upgradeId === 'orbital_drone') {
      this.orbitalDrones.push({
        angle: (Math.PI * 2 * this.orbitalDrones.length) / 3,
        distance: 70,
        fireTimer: 0
      });
    }

    this.isLevelingUp = false;
    this.levelUpOptions = [];
  }

  spawnEnemyBullet(x, y, angle, speed, damage, color) {
    this.enemyBullets.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      color,
      size: 4,
      life: 5
    });
  }

  spawnPlayerBullet(angle) {
    const baseSpeed = 580;
    const spreadLvl = this.player.upgrades.get('plasma_spread') || 0;
    const pierceLvl = this.player.upgrades.get('piercing_beam') || 0;
    const projectileCount = 1 + spreadLvl;
    const spreadArc = 0.15;

    for (let i = 0; i < projectileCount; i++) {
      const offset = projectileCount === 1 ? 0 : (i - (projectileCount - 1) / 2) * spreadArc;
      const finalAngle = angle + offset;
      this.bullets.push({
        x: this.player.x + Math.cos(angle) * 20,
        y: this.player.y + Math.sin(angle) * 20,
        vx: Math.cos(finalAngle) * baseSpeed,
        vy: Math.sin(finalAngle) * baseSpeed,
        damage: 25,
        pierce: 1 + pierceLvl,
        size: 5,
        color: PALETTE.bullet,
        life: 1.8
      });
    }
    sound.playLaser();
  }

  performDash() {
    if (this.player.dashCooldown > 0) return;
    this.player.isDashing = true;
    this.player.dashDuration = 0.22;
    this.player.dashCooldown = 1.6;
    this.screenShake = 6;
    sound.playDash();

    // EMP Nova upgrade
    const empLvl = this.player.upgrades.get('emp_nova') || 0;
    if (empLvl > 0) {
      const radius = 140 + empLvl * 40;
      this.particles.emitExplosion(this.player.x, this.player.y, 35, '#a855f7', 260);
      for (const e of this.enemies) {
        if (Math.hypot(e.x - this.player.x, e.y - this.player.y) <= radius) {
          const dead = e.takeDamage(40 + empLvl * 25);
          this.particles.addDamageText(e.x, e.y, `${40 + empLvl * 25}`, '#a855f7', true);
          if (dead) this.handleEnemyKill(e);
        }
      }
    }
  }

  handleEnemyKill(e) {
    this.stats.enemiesKilled++;
    this.score += e.scoreValue * this.multiplier;
    this.multiplier = Math.min(5, this.multiplier + 0.1);
    this.streakTimer = 4.0;
    this.particles.emitExplosion(e.x, e.y, e.type === 'boss' ? 80 : 25, e.color, e.type === 'boss' ? 380 : 200);
    sound.playExplosion(e.type === 'boss' ? 0.5 : 0.25);

    // Drop energy core
    const coreCount = e.type === 'boss' ? 12 : e.type === 'mech' ? 4 : 1;
    for (let i = 0; i < coreCount; i++) {
      this.energyCores.push({
        x: e.x + (Math.random() - 0.5) * 30,
        y: e.y + (Math.random() - 0.5) * 30,
        value: 20,
        size: 5,
        color: PALETTE.coreEnergy,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60
      });
    }

    if (e.type === 'boss') {
      this.isVictory = true;
      this.screenShake = 18;
    }
  }

  damagePlayer(amount) {
    if (this.player.isDashing) return; // Invulnerable during dash

    this.screenShake = 10;
    this.player.shieldRegenDelay = 3.5;
    sound.playHit();

    if (this.player.shield > 0) {
      const absorbed = Math.min(this.player.shield, amount);
      this.player.shield -= absorbed;
      amount -= absorbed;
      this.particles.emitExplosion(this.player.x, this.player.y, 10, PALETTE.playerShield, 100);
    }

    if (amount > 0) {
      this.player.hull -= amount;
      this.particles.emitExplosion(this.player.x, this.player.y, 14, '#ef4444', 150);
      this.particles.addDamageText(this.player.x, this.player.y, `-${Math.round(amount)}`, '#ef4444', true);
    }

    if (this.player.hull <= 0) {
      this.player.hull = 0;
      this.isGameOver = true;
      this.particles.emitExplosion(this.player.x, this.player.y, 60, '#38bdf8', 350);
      sound.playExplosion(0.6);
    }
  }

  update(dt, input) {
    if (this.isLevelingUp || this.isGameOver || this.isVictory) return;

    this.stats.timeSurvived += dt;

    // Multiplier decay
    if (this.streakTimer > 0) {
      this.streakTimer -= dt;
      if (this.streakTimer <= 0) this.multiplier = 1;
    }

    // Shield Regen
    if (this.player.shieldRegenDelay > 0) {
      this.player.shieldRegenDelay -= dt;
    } else if (this.player.shield < this.player.maxShield) {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + dt * 18);
    }

    // Player Movement
    const move = input.getMovementVector();
    let currentSpeed = this.player.speed;

    if (this.player.isDashing) {
      currentSpeed *= 2.6;
      this.player.dashDuration -= dt;
      this.particles.emitThruster(this.player.x, this.player.y, this.player.angle, 140);
      if (this.player.dashDuration <= 0) {
        this.player.isDashing = false;
      }
    } else {
      if (this.player.dashCooldown > 0) this.player.dashCooldown -= dt;
      if (input.wasJustPressed('Space')) {
        this.performDash();
      }
    }

    this.player.vx = move.dx * currentSpeed;
    this.player.vy = move.dy * currentSpeed;
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // World clamping
    this.player.x = Math.max(30, Math.min(WORLD_WIDTH - 30, this.player.x));
    this.player.y = Math.max(30, Math.min(WORLD_HEIGHT - 30, this.player.y));

    // Player aim angle
    const mouseWorldX = input.mouse.x + this.camera.x;
    const mouseWorldY = input.mouse.y + this.camera.y;
    this.player.angle = Math.atan2(mouseWorldY - this.player.y, mouseWorldX - this.player.x);

    // Player shooting
    const hyperLvl = this.player.upgrades.get('hyper_fire') || 0;
    const fireInterval = Math.max(0.12, 0.22 - hyperLvl * 0.04);
    this.player.fireTimer += dt;
    if (input.mouse.down && this.player.fireTimer >= fireInterval) {
      this.player.fireTimer = 0;
      this.spawnPlayerBullet(this.player.angle);
    }

    // Orbital Drones
    for (let i = 0; i < this.orbitalDrones.length; i++) {
      const drone = this.orbitalDrones[i];
      drone.angle += dt * 3.0;
      const dx = this.player.x + Math.cos(drone.angle) * drone.distance;
      const dy = this.player.y + Math.sin(drone.angle) * drone.distance;
      drone.fireTimer += dt;

      if (drone.fireTimer >= 0.6 && this.enemies.length > 0) {
        drone.fireTimer = 0;
        // Target closest enemy
        let closest = null;
        let cDist = 450;
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - dx, e.y - dy);
          if (d < cDist) {
            cDist = d;
            closest = e;
          }
        }
        if (closest) {
          const fireAngle = Math.atan2(closest.y - dy, closest.x - dx);
          this.bullets.push({
            x: dx,
            y: dy,
            vx: Math.cos(fireAngle) * 550,
            vy: Math.sin(fireAngle) * 550,
            damage: 20,
            pierce: 1,
            size: 4,
            color: '#eab308',
            life: 1.5
          });
          sound.playLaser(0.08);
        }
      }
    }

    // Bullets update
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Bullet-Enemy Collisions
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (Math.hypot(b.x - e.x, b.y - e.y) < b.size + e.size) {
          this.particles.emitExplosion(b.x, b.y, 6, b.color, 100);
          this.particles.addDamageText(e.x, e.y, `${b.damage}`, '#f8fafc');
          const dead = e.takeDamage(b.damage);
          if (dead) {
            this.handleEnemyKill(e);
            this.enemies.splice(j, 1);
          }
          b.pierce--;
          if (b.pierce <= 0) {
            b.life = 0;
            break;
          }
        }
      }

      if (b.life <= 0) {
        this.bullets.splice(i, 1);
      }
    }

    // Enemy Bullets update
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.x += eb.vx * dt;
      eb.y += eb.vy * dt;
      eb.life -= dt;

      if (Math.hypot(eb.x - this.player.x, eb.y - this.player.y) < eb.size + this.player.size) {
        this.damagePlayer(eb.damage);
        eb.life = 0;
      }
      if (eb.life <= 0) {
        this.enemyBullets.splice(i, 1);
      }
    }

    // Enemies update
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.player, this);

      // Player contact collision
      if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.size + this.player.size) {
        this.damagePlayer(e.type === 'kamikaze' ? 45 : 20);
        if (e.type === 'kamikaze') {
          this.particles.emitExplosion(e.x, e.y, 30, e.color, 240);
          this.enemies.splice(i, 1);
        }
      }
    }

    // Energy Cores update (Magnetic Attraction)
    const magLvl = this.player.upgrades.get('magnetic_vacuum') || 0;
    const magnetRadius = 140 + magLvl * 90;
    for (let i = this.energyCores.length - 1; i >= 0; i--) {
      const c = this.energyCores[i];
      const dx = this.player.x - c.x;
      const dy = this.player.y - c.y;
      const dist = Math.hypot(dx, dy);

      if (dist < magnetRadius) {
        const pull = 380 * (1 - dist / magnetRadius) + 120;
        c.x += (dx / dist) * pull * dt;
        c.y += (dy / dist) * pull * dt;
      } else {
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vx *= 0.95;
        c.vy *= 0.95;
      }

      if (dist < this.player.size + c.size) {
        this.player.xp += c.value;
        this.stats.coresCollected++;
        sound.playPickup();
        this.particles.emitExplosion(c.x, c.y, 6, PALETTE.coreEnergy, 80);
        this.energyCores.splice(i, 1);

        if (this.player.xp >= this.player.xpToNext) {
          this.player.xp -= this.player.xpToNext;
          this.player.level++;
          this.player.xpToNext = Math.round(this.player.xpToNext * 1.4);
          this.triggerLevelUp();
        }
      }
    }

    // Wave Progression & Spawning
    this.waveTime -= dt;
    if (this.waveTime <= 0) {
      this.wave++;
      this.waveTime = 35;
      this.screenShake = 8;
      if (this.wave === 5 && !this.bossSpawned) {
        this.bossSpawned = true;
        this.enemies.push(new VoidDreadnoughtBoss(this.player.x, this.player.y - 450));
      }
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.enemies.length < 35) {
      this.spawnTimer = Math.max(0.6, 2.0 - this.wave * 0.25);
      this.spawnWaveEnemies();
    }

    // Particles & FX
    this.particles.update(dt);
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 15);
    }

    // Smooth Camera Follow
    const targetCamX = this.player.x - CANVAS_WIDTH / 2;
    const targetCamY = this.player.y - CANVAS_HEIGHT / 2;
    this.camera.x += (targetCamX - this.camera.x) * (dt * 8);
    this.camera.y += (targetCamY - this.camera.y) * (dt * 8);
    this.camera.x = Math.max(0, Math.min(WORLD_WIDTH - CANVAS_WIDTH, this.camera.x));
    this.camera.y = Math.max(0, Math.min(WORLD_HEIGHT - CANVAS_HEIGHT, this.camera.y));
  }

  spawnWaveEnemies() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 550 + Math.random() * 150;
    const x = Math.max(50, Math.min(WORLD_WIDTH - 50, this.player.x + Math.cos(angle) * dist));
    const y = Math.max(50, Math.min(WORLD_HEIGHT - 50, this.player.y + Math.sin(angle) * dist));

    const roll = Math.random();
    if (this.wave >= 3 && roll < 0.25) {
      this.enemies.push(new HeavyLaserMech(x, y));
    } else if (roll < 0.45) {
      this.enemies.push(new KamikazeStalker(x, y));
    } else {
      this.enemies.push(new ScoutDrone(x, y));
    }
  }
}
