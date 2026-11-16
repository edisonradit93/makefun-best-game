import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

/**
 * Void Survivor: Protocol Zero - Automated Evaluation & Dossier Pipeline
 * Coordinates the copying of static game client assets and visual telemetry
 * into the target output container and produces the make.fun dossier artifact.
 */

export const GAME_METADATA = {
  id: 'void-survivor-protocol-zero',
  title: 'Void Survivor: Protocol Zero',
  version: '1.0.0',
  genre: 'Roguelite Survival Bullet-Hell Shooter',
  engine: 'Autonomous Custom HTML5 2D Vector Engine',
  audio: 'Procedural Web Audio API Synthesizer (Zero Audio Assets)',
  viewport: { logicalWidth: 1280, logicalHeight: 720, worldWidth: 2560, worldHeight: 1440 },
  architecture: {
    loop: 'requestAnimationFrame with Variable Delta Clamping',
    physics: 'Momentum Vector Propulsion with Quadratic Friction',
    particleEngine: 'Pooled Kinetic Shockwave & Spark Dispersion',
    swarmAI: ['Scout Drone (Flocking)', 'Kamikaze Stalker (Ramming)', 'Laser Mech (Kiting)', 'Void Dreadnought (Multiphase Spiral Boss)'],
    upgradeSystem: '8 Synergistic Cybernetic Augmentation Cards',
  },
} as const;

async function main(): Promise<void> {
  const startTime = performance.now();
  const rootDir = fileURLToPath(new URL('.', import.meta.url));
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

  console.log(`[VoidSurvivor::Pipeline] ========================================`);
  console.log(`[VoidSurvivor::Pipeline] ${GAME_METADATA.title} v${GAME_METADATA.version}`);
  console.log(`[VoidSurvivor::Pipeline] Engine: ${GAME_METADATA.engine}`);
  console.log(`[VoidSurvivor::Pipeline] Audio: ${GAME_METADATA.audio}`);
  console.log(`[VoidSurvivor::Pipeline] Root Directory: ${rootDir}`);
  console.log(`[VoidSurvivor::Pipeline] Target Output Directory: ${outputDir}`);
  console.log(`[VoidSurvivor::Pipeline] ========================================`);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log('[VoidSurvivor::Pipeline] Initialized target output directory.');
  }

  // Copy web client assets
  const gameSrc = join(rootDir, 'game');
  const gameDest = join(outputDir, 'game');
  if (existsSync(gameSrc)) {
    cpSync(gameSrc, gameDest, { recursive: true });
    console.log('[VoidSurvivor::Pipeline] [✓] Synchronized game assets successfully.');
  } else {
    console.warn('[VoidSurvivor::Pipeline] [!] Warning: Local game directory not found at', gameSrc);
  }

  // Copy telemetry screenshot captures
  const screenshotsSrc = join(rootDir, 'screenshots');
  const screenshotsDest = join(outputDir, 'screenshots');
  if (existsSync(screenshotsSrc)) {
    cpSync(screenshotsSrc, screenshotsDest, { recursive: true });
    console.log('[VoidSurvivor::Pipeline] [✓] Synchronized visual captures.');
  } else {
    console.warn('[VoidSurvivor::Pipeline] [!] Warning: Local screenshots directory not found at', screenshotsSrc);
  }

  // Construct comprehensive game dossier adhering to make.fun specifications
  console.log('[VoidSurvivor::Pipeline] Compiling runtime dossier artifact with strict constraints...');
  const dossier = await buildDossier(rootDir, {
    outputDir,
    text_max_bytes: 163840,
    screenshot_max_bytes: 262144,
    screenshot_max_count: 4,
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });

  const dossierPath = join(outputDir, 'dossier.json');
  writeFileSync(dossierPath, JSON.stringify(dossier, null, 2), 'utf-8');
  
  const elapsed = (performance.now() - startTime).toFixed(2);
  console.log(`[VoidSurvivor::Pipeline] [✓] Dossier successfully authored to ${dossierPath} (${elapsed}ms)`);
  console.log(`[VoidSurvivor::Pipeline] Pipeline export sequence completed with STATUS 0.`);
}

main().catch((err: unknown) => {
  console.error('[VoidSurvivor::Pipeline] Fatal error during pipeline execution:', err);
  process.exit(1);
});
