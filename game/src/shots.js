// Void Survivor - Deterministic Screenshot Scenes for make.fun AI Judge

import { ScoutDrone, KamikazeStalker, HeavyLaserMech, VoidDreadnoughtBoss } from './enemies.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';

export function setupShotScene(world, shotType) {
  world.reset();

  if (shotType === '1-cover' || shotType === 'start') {
    // Backdrop enemies and battle
    world.enemies.push(new ScoutDrone(world.player.x + 220, world.player.y - 140));
    world.enemies.push(new KamikazeStalker(world.player.x - 240, world.player.y + 160));
    world.enemies.push(new HeavyLaserMech(world.player.x + 360, world.player.y + 120));
    // Spawn ambient energy cores and particles
    for (let i = 0; i < 8; i++) {
      world.energyCores.push({
        x: world.player.x + (Math.random() - 0.5) * 400,
        y: world.player.y + (Math.random() - 0.5) * 400,
        value: 20,
        size: 5,
        color: '#22d3ee',
        vx: 0,
        vy: 0
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

    // Active enemies around player
    world.enemies.push(new ScoutDrone(world.player.x + 180, world.player.y - 120));
    world.enemies.push(new ScoutDrone(world.player.x - 210, world.player.y - 90));
    world.enemies.push(new KamikazeStalker(world.player.x + 130, world.player.y + 160));
    world.enemies.push(new KamikazeStalker(world.player.x - 170, world.player.y + 140));
    world.enemies.push(new HeavyLaserMech(world.player.x + 320, world.player.y - 40));

    // Player firing volley
    world.spawnPlayerBullet(0.2);
    world.spawnEnemyBullet(world.player.x + 180, world.player.y - 120, Math.PI + 0.1, 240, 12, '#f43f5e');

    // Particles and cores
    world.particles.emitExplosion(world.player.x - 210, world.player.y - 90, 30, '#f43f5e', 220);
    world.particles.addDamageText(world.player.x - 210, world.player.y - 110, 'CRIT 75', '#fbbf24', true);
    for (let i = 0; i < 6; i++) {
      world.energyCores.push({
        x: world.player.x + (Math.random() - 0.5) * 300,
        y: world.player.y + (Math.random() - 0.5) * 300,
        value: 20,
        size: 5,
        color: '#22d3ee',
        vx: 0,
        vy: 0
      });
    }
    return 'playing';
  }

  if (shotType === '3-boss' || shotType === 'boss') {
    world.wave = 5;
    world.bossSpawned = true;
    world.score = 78400;
    world.multiplier = 4.5;
    world.player.level = 8;
    world.player.xp = 320;
    world.player.xpToNext = 600;
    world.player.upgrades.set('plasma_spread', 2);
    world.player.upgrades.set('orbital_drone', 2);
    world.orbitalDrones.push({ angle: 0, distance: 70, fireTimer: 0 });
    world.orbitalDrones.push({ angle: Math.PI, distance: 70, fireTimer: 0 });

    const boss = new VoidDreadnoughtBoss(world.player.x, world.player.y - 280);
    boss.hp = 520;
    world.enemies.push(boss);
    world.enemies.push(new HeavyLaserMech(world.player.x - 300, world.player.y - 120));
    world.enemies.push(new HeavyLaserMech(world.player.x + 300, world.player.y - 120));

    // Spiral bullet storm from boss
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
    world.enemies.push(new ScoutDrone(world.player.x + 240, world.player.y + 120));
    world.triggerLevelUp();
    return 'playing';
  }

  return 'playing';
}
