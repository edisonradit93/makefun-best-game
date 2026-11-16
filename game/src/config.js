// Void Survivor - Configuration Constants
// Version: 1.1.0 - Optimized weapon balance and particle density

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const WORLD_WIDTH = 2560;
export const WORLD_HEIGHT = 1440;

export const PALETTE = {
  bg: '#070913',
  grid: 'rgba(30, 41, 59, 0.4)',
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

export const UPGRADES = [
  {
    id: 'plasma_spread',
    title: 'Plasma Spread',
    desc: '+1 Additional projectile per shot in a spread arc',
    tier: 'Offense',
    color: '#38bdf8'
  },
  {
    id: 'hyper_fire',
    title: 'Overclocked Trigger',
    desc: '+35% Increased firing rate and projectile speed',
    tier: 'Offense',
    color: '#ec4899'
  },
  {
    id: 'piercing_beam',
    title: 'Quantum Penetrator',
    desc: 'Projectiles pierce through +2 additional enemy hulls',
    tier: 'Offense',
    color: '#f59e0b'
  },
  {
    id: 'emp_nova',
    title: 'EMP Shockwave',
    desc: 'Dashing releases a radial EMP blast that damages and stuns enemies',
    tier: 'Utility',
    color: '#a855f7'
  },
  {
    id: 'magnetic_vacuum',
    title: 'Graviton Attractor',
    desc: '+75% Energy Core pickup attraction radius',
    tier: 'Utility',
    color: '#22d3ee'
  },
  {
    id: 'shield_matrix',
    title: 'Aegis Shield Matrix',
    desc: '+50 Max Shield Capacity and faster regeneration delay',
    tier: 'Defense',
    color: '#6366f1'
  },
  {
    id: 'nano_repair',
    title: 'Nanite Hull Reinforcement',
    desc: 'Repair 35 Hull HP immediately and gain +30 Max Hull HP',
    tier: 'Defense',
    color: '#10b981'
  },
  {
    id: 'orbital_drone',
    title: 'Autonomous Sentinel',
    desc: 'Deploy an automated combat drone orbiting your ship that fires lasers',
    tier: 'Companion',
    color: '#eab308'
  }
];
