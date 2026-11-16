# Void Survivor: Protocol Zero

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/edisonradit93/makefun-best-game/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/edisonradit93/makefun-best-game/reward.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

An autonomous roguelite survival bullet-hell shooter built with native HTML5 Canvas, modern ES Modules, and procedural Web Audio synthesis. Navigate abyssal space sectors, purge relentless alien swarms, extract glowing energy cores, and augment your vessel with game-altering cybernetic protocols.

---

## 🎮 Flight Controls & Flight Interface

| Command | Key / Input | Tactical Function |
| :--- | :--- | :--- |
| **Vector Propulsion** | `W`, `A`, `S`, `D` or `Arrow Keys` | Omnidirectional thrusters with realistic momentum and drift damping |
| **Gimbal Turret Aim** | `Mouse Cursor` | 360-degree crosshair tracking relative to dynamic camera viewport |
| **Continuous Beam Fire** | `Left Mouse Button` (Hold) | High-velocity plasma laser capacitors with automatic cycling |
| **Tactical Dash** | `Spacebar` | Phase shift burst providing invulnerability frames & EMP discharge |
| **Augmentation Selection**| `1`, `2`, `3` or `Mouse Click` | Instant hotkey integration of selected cybernetic protocol upgrade |
| **Emergency Reboot** | `Spacebar` / `Enter` | Restart game loop after hull breach or start from title console |

---

## ⚙️ Core Architectural Subsystems

### 1. Vector Physics & Viewport Camera
- **Logical Resolution**: Fixed high-definition 1280x720 canvas viewport dynamically clamped to a vast 2560x1440 world sector.
- **Dynamic Camera Tracking**: Smooth linear interpolation camera centered on the pilot's vessel with bounding border locks.
- **Parallax Starfield**: 140 multi-tier procedural stars exhibiting realistic depth parallax and twinkling luminescence.

### 2. Procedural Web Audio API Synthesizer
- **100% Zero External Audio Files**: Synthesizes all acoustic effects dynamically in real-time via the browser's native `AudioContext`.
- **Laser Ramps**: Exponential frequency sweeps (`880Hz` to `160Hz`) paired with fast micro-envelopes.
- **Concussive Explosions**: White noise buffer synthesis fed through low-pass resonant filters for heavy impact crunches.
- **Harmonic Core Resonances**: Crystal clean sine harmonic glissandos on XP pickup.
- **Fanfare Arpeggios**: Polyphonic four-note chord progression (`C5`, `E5`, `G5`, `C6`) celebrating level ascensions.

### 3. Kinetic Particle Engine
- **Directional Plumes**: Vector-aligned exhaust fire trailing engine nozzles.
- **Velocity Dampening Sparks**: High-energy spark fragments generated upon projectile impact and hostile detonations.
- **EMP Shockwaves**: Expanding circular wave rings with chromatic alpha dissipation that neutralize enemy ordnance.
- **Floating Combat Telemetry**: Real-time floating damage markers and XP indicators (`"CRIT 75"`, `"+100 XP"`).

---

## 🧬 Cybernetic Augmentation Matrix (8 Unique Upgrades)

When your vessel absorbs sufficient **Energy Cores**, the onboard mainframe initiates an augmentation pause offering 3 randomized protocol upgrades:

1. **Plasma Spread**: Adds +2 multi-directional laser barrels per shot, unleashing wide-angle swarm annihilation.
2. **Overclocked Trigger**: Supercharges laser capacitor cycling rate by +35% for blisteringly dense projectile streams.
3. **Quantum Penetrator**: Lasers pass through +1 additional hostile hull and enjoy a +20% raw damage bonus.
4. **EMP Shockwave**: Converts your tactical dash into a destructive pulse (85px radius, 75 DMG) neutralizing incoming enemy ordnance.
5. **Graviton Attractor**: Expands the ship's gravitational attractor field by +85%, vacuuming energy cores from afar.
6. **Aegis Shield Matrix**: Reinforces max energy shield capacity by +30 points and expedites shield recharge recovery.
7. **Nanite Hull Reinforcement**: Increases maximum structural integrity by +45 HP and instantly conducts emergency hull repair.
8. **Autonomous Sentinel**: Deploys an automated orbital defense drone that orbits your vessel and snipes targets with violet lasers.

---

## 👾 Swarm Intelligence & Adversary Hierarchy

| Adversary | Role & Behavior | Threat Profile |
| :--- | :--- | :--- |
| **Scout Drone** | Agile flankers that swarm in dense packs | High speed, fragile hull, contact attrition |
| **Kamikaze Stalker** | Heavy ramming drone with intermittent rocket charge | High speed ramming, self-destruct concussive explosion |
| **Laser Mech** | Tactical gunship that kites at medium range | Heavy armor, charged 350 px/s energy projectiles |
| **Void Dreadnought (Boss)**| Colossal multi-phase sector flagship (Wave 5 & 10) | 2,500 HP, 4-arm rotating spiral bullet storm, radial nova pulses |

---

## 📸 Deterministic Visual Telemetry Harness

The engine supports automated evaluation and screenshot capture using URL query parameters:

- `?shot=1-cover`: Displays the cinematic title console over an active sector skirmish.
- `?shot=2-combat`: Simulates a high-intensity mid-game swarm engagement with active sentinels and particle sparks.
- `?shot=3-boss`: Teleports into an encounter with the Void Dreadnought flagship amidst a 4-arm spiral bullet storm.
- `?shot=4-upgrade`: Opens the glassmorphic cybernetic augmentation modal with interactive upgrade cards.

---

## 🚀 Build & Packaging Pipeline

To compile the make.fun dossier and bundle client assets:

```bash
# Execute the automated compilation runner
npx tsx main.ts
```

The pipeline outputs all web client files and `dossier.json` to `$MAKEFUN_OUTPUT_DIR` (or `/output`).
