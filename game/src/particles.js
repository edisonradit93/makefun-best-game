// Void Survivor - High Performance Particle & FX Engine

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.damageTexts = [];
  }

  emit(x, y, vx, vy, color, size, life, decay = 1) {
    this.particles.push({
      x,
      y,
      vx,
      vy,
      color,
      size,
      maxLife: life,
      life,
      decay
    });
  }

  emitExplosion(x, y, count = 24, baseColor = '#f59e0b', maxSpeed = 220) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * maxSpeed + 20;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = Math.random() * 4 + 2;
      const life = Math.random() * 0.4 + 0.2;
      const color = Math.random() > 0.4 ? baseColor : '#ffffff';
      this.emit(x, y, vx, vy, color, size, life);
    }
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: 80,
      color: baseColor,
      life: 0.35,
      maxLife: 0.35
    });
  }

  emitThruster(x, y, angle, speed = 80) {
    const spread = (Math.random() - 0.5) * 0.4;
    const a = angle + Math.PI + spread;
    const s = Math.random() * speed + speed * 0.5;
    const vx = Math.cos(a) * s;
    const vy = Math.sin(a) * s;
    const colors = ['#f59e0b', '#ef4444', '#fbbf24', '#38bdf8'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    this.emit(x, y, vx, vy, color, Math.random() * 3 + 2, 0.25);
  }

  addDamageText(x, y, text, color = '#f8fafc', critical = false) {
    this.damageTexts.push({
      x,
      y,
      text,
      color,
      critical,
      life: 0.8,
      maxLife: 0.8,
      vy: -40
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      sw.radius += (sw.maxRadius - sw.radius) * (dt * 12);
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const dtObj = this.damageTexts[i];
      dtObj.y += dtObj.vy * dt;
      dtObj.life -= dt;
      if (dtObj.life <= 0) {
        this.damageTexts.splice(i, 1);
      }
    }
  }

  render(ctx, camera) {
    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const screenX = p.x - camera.x;
      const screenY = p.y - camera.y;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(screenX, screenY, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    for (let i = 0; i < this.shockwaves.length; i++) {
      const sw = this.shockwaves[i];
      const screenX = sw.x - camera.x;
      const screenY = sw.y - camera.y;
      const alpha = Math.max(0, sw.life / sw.maxLife);
      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3 * alpha;
      ctx.beginPath();
      ctx.arc(screenX, screenY, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    for (let i = 0; i < this.damageTexts.length; i++) {
      const dtObj = this.damageTexts[i];
      const screenX = dtObj.x - camera.x;
      const screenY = dtObj.y - camera.y;
      const alpha = Math.max(0, dtObj.life / dtObj.maxLife);
      ctx.globalAlpha = alpha;
      ctx.font = dtObj.critical ? 'bold 18px monospace' : '14px monospace';
      ctx.fillStyle = dtObj.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(dtObj.text, screenX, screenY);
    }
    ctx.restore();
  }
}
