// Void Survivor - Enemy Hierarchy & AI Systems

import { PALETTE, WORLD_WIDTH, WORLD_HEIGHT } from './config.js';

export class BaseEnemy {
  constructor(x, y, type, hp, speed, size, scoreValue, color) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.maxHp = hp;
    this.hp = hp;
    this.speed = speed;
    this.size = size;
    this.scoreValue = scoreValue;
    this.color = color;
    this.vx = 0;
    this.vy = 0;
    this.shootTimer = Math.random() * 2;
    this.angle = 0;
    this.flashTime = 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.flashTime = 0.1;
    return this.hp <= 0;
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

    this.x = Math.max(this.size, Math.min(WORLD_WIDTH - this.size, this.x));
    this.y = Math.max(this.size, Math.min(WORLD_HEIGHT - this.size, this.y));
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

    this.drawShape(ctx);
    ctx.restore();

    // HP Bar for stronger enemies
    if (this.maxHp > 30) {
      const barW = this.size * 2;
      const barH = 4;
      const bx = sx - barW / 2;
      const by = sy - this.size - 8;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = this.color;
      ctx.fillRect(bx, by, barW * (this.hp / this.maxHp), barH);
    }
  }

  drawShape(ctx) {
    // Default diamond
    ctx.beginPath();
    ctx.moveTo(this.size, 0);
    ctx.lineTo(0, this.size * 0.7);
    ctx.lineTo(-this.size * 0.8, 0);
    ctx.lineTo(0, -this.size * 0.7);
    ctx.closePath();
    ctx.fill();
  }
}

export class ScoutDrone extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'scout', 20, 150, 14, 50, PALETTE.enemyScout);
    this.strafeDir = Math.random() > 0.5 ? 1 : -1;
    this.strafeTimer = 1.5;
  }

  update(dt, player, world) {
    this.flashTime = Math.max(0, this.flashTime - dt);
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    this.angle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);

    this.strafeTimer -= dt;
    if (this.strafeTimer <= 0) {
      this.strafeDir *= -1;
      this.strafeTimer = Math.random() * 1.5 + 1.0;
    }

    // Approach and orbit
    const approachSpeed = dist > 260 ? this.speed : dist < 180 ? -this.speed * 0.7 : 0;
    const strafeSpeed = this.speed * 0.8 * this.strafeDir;
    const perpX = -Math.sin(this.angle);
    const perpY = Math.cos(this.angle);

    this.vx = Math.cos(this.angle) * approachSpeed + perpX * strafeSpeed;
    this.vy = Math.sin(this.angle) * approachSpeed + perpY * strafeSpeed;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Shooting
    this.shootTimer -= dt;
    if (this.shootTimer <= 0 && dist < 500) {
      this.shootTimer = 2.2 + Math.random() * 0.8;
      world.spawnEnemyBullet(this.x, this.y, this.angle, 260, 12, '#f43f5e');
    }
  }

  drawShape(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.size, 0);
    ctx.lineTo(-this.size, this.size * 0.75);
    ctx.lineTo(-this.size * 0.5, 0);
    ctx.lineTo(-this.size, -this.size * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class KamikazeStalker extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'kamikaze', 35, 190, 16, 75, PALETTE.enemyKamikaze);
  }

  drawShape(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.size * 1.2, 0);
    ctx.lineTo(-this.size, this.size);
    ctx.lineTo(-this.size * 0.4, 0);
    ctx.lineTo(-this.size, -this.size);
    ctx.closePath();
    ctx.fill();
    // Glowing core
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class HeavyLaserMech extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'mech', 120, 85, 24, 250, PALETTE.enemyMech);
    this.telegraphTime = 0;
  }

  update(dt, player, world) {
    super.update(dt, player, world);

    this.shootTimer -= dt;
    if (this.shootTimer <= 0.8 && this.shootTimer > 0) {
      this.telegraphTime = 0.8;
    }
    if (this.shootTimer <= 0) {
      this.shootTimer = 3.5;
      this.telegraphTime = 0;
      // Spread volley
      for (let offset = -0.3; offset <= 0.3; offset += 0.3) {
        world.spawnEnemyBullet(this.x, this.y, this.angle + offset, 240, 18, '#fb7185');
      }
    }
  }

  drawShape(ctx) {
    // Hexagonal heavy chassis
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = Math.cos(a) * this.size;
      const py = Math.sin(a) * this.size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Twin cannons
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, -12, 18, 6);
    ctx.fillRect(4, 6, 18, 6);
  }
}

export class VoidDreadnoughtBoss extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'boss', 850, 60, 52, 2000, PALETTE.enemyBoss);
    this.spiralAngle = 0;
    this.phase = 1;
  }

  update(dt, player, world) {
    super.update(dt, player, world);
    this.spiralAngle += dt * 3.5;
    this.shootTimer -= dt;

    if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
      this.phase = 2;
      this.speed = 85;
      world.particles.emitExplosion(this.x, this.y, 40, '#c026d3', 300);
    }

    if (this.shootTimer <= 0) {
      this.shootTimer = this.phase === 1 ? 0.35 : 0.22;
      // Spiral bullet storm
      const count = this.phase === 1 ? 2 : 4;
      for (let i = 0; i < count; i++) {
        const bulletAngle = this.spiralAngle + (i * Math.PI * 2) / count;
        world.spawnEnemyBullet(this.x, this.y, bulletAngle, 210, 14, '#d946ef');
      }
    }
  }

  drawShape(ctx) {
    // Colossal dreadnought flagship geometry
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

    // Central pulsing reactor
    ctx.fillStyle = '#fae8ff';
    ctx.shadowColor = '#d946ef';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}
