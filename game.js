/* ============================================================
   DARKEST RUN — Logique du jeu
   Assets attendus dans le même dossier :
     background.jpg  — décor défilant
     caracter.jpg    — sprite du joueur
     obstacle.png    — ennemi / obstacle volant
   ============================================================ */

/* ── Références DOM ─────────────────────────────────────────── */
const bgCanvas   = document.getElementById('bgCanvas');
const gc         = document.getElementById('gameCanvas');
const bgCtx      = bgCanvas.getContext('2d');
const ctx        = gc.getContext('2d');
const container  = document.getElementById('gameContainer');
const overlay    = document.getElementById('overlay');
const scoreValEl = document.getElementById('scoreVal');
const livesValEl = document.getElementById('livesVal');
const speedEl    = document.getElementById('speedLabel2');
const startBtn   = document.getElementById('startBtn');
const hitFlash   = document.getElementById('hitFlash');

/* ── Dimensions ─────────────────────────────────────────────── */
let W, H, GROUND;

function resize() {
  W = container.offsetWidth;
  H = container.offsetHeight;
  GROUND = H * 0.78;                        // ligne du sol (78 % de la hauteur)
  bgCanvas.width  = gc.width  = W;
  bgCanvas.height = gc.height = H;
}
resize();
window.addEventListener('resize', () => { resize(); drawBg(); });

/* ── Chargement des images ───────────────────────────────────── */
const bgImg   = new Image();
const charImg = new Image();
const obsImg  = new Image();

bgImg.src   = 'background.jpg';
charImg.src = 'caracter.jpg';
obsImg.src  = 'obstacle.png';

let bgLoaded = false, charLoaded = false, obsLoaded = false;
bgImg.onload   = () => { bgLoaded   = true; drawBg(); };
charImg.onload = () => { charLoaded = true; };
obsImg.onload  = () => { obsLoaded  = true; };

/* ── État du jeu ─────────────────────────────────────────────── */
let gameRunning = false;
let animId;
let score       = 0;
let lives       = 3;
let speed       = 3;           // vitesse de base en px/frame
let frameCount  = 0;
let bgX         = 0;           // décalage du fond
let obstacles   = [];
let particles   = [];
let invincible  = false;
let invTimer    = 0;

/* ── Personnage ─────────────────────────────────────────────── */
const CHAR = {
  x: 0, y: 0,
  w: 72, h: 90,
  vy: 0,              // vitesse verticale courante
  jumping: false,
  crouching: false,
  jumpCount: 0        // permet le double saut (max 2)
};

function resetChar() {
  CHAR.x         = W * 0.15;
  CHAR.y         = GROUND - CHAR.h;
  CHAR.vy        = 0;
  CHAR.jumping   = false;
  CHAR.crouching = false;
  CHAR.jumpCount = 0;
}

/* ── Rendu du background défilant ───────────────────────────── */
function drawBg() {
  if (bgLoaded) {
    bgCtx.clearRect(0, 0, W, H);
    const aspect = bgImg.width / bgImg.height;
    const bh = H;
    const bw = bh * aspect;
    // calcul de la position pour un défilement parfaitement bouclé
    const x1 = ((bgX % bw) + bw) % bw - bw;
    bgCtx.drawImage(bgImg, x1,      0, bw, bh);
    bgCtx.drawImage(bgImg, x1 + bw, 0, bw, bh);
    // assombrissement léger pour améliorer la lisibilité
    bgCtx.fillStyle = 'rgba(0,0,0,0.18)';
    bgCtx.fillRect(0, 0, W, H);
  } else {
    bgCtx.fillStyle = '#0a0608';
    bgCtx.fillRect(0, 0, W, H);
  }
}

/* ── Génération d'obstacles ─────────────────────────────────── */
/*
 * Trois types :
 *  - ground   : au sol          → le joueur doit SAUTER
 *  - low_fly  : en vol bas      → le joueur doit SAUTER
 *  - high_fly : en vol haut     → le joueur doit S'ACCROUPIR
 */
function spawnObstacle() {
  const types = ['low_fly', 'high_fly', 'ground'];
  const type  = types[Math.floor(Math.random() * types.length)];
  let y, w = 64, h = 56;

  if      (type === 'ground')   { y = GROUND - 52;  h = 52; w = 52; }
  else if (type === 'low_fly')  { y = GROUND - 115; h = 56; w = 64; }
  else                          { y = GROUND - 185; h = 56; w = 64; }

  obstacles.push({ x: W + 80, y, w, h, type, passed: false });
}

/* ── Particules (saut / dégât) ──────────────────────────────── */
function spawnParticles(x, y, color) {
  for (let i = 0; i < 14; i++) {
    particles.push({
      x, y,
      vx:   (Math.random() - 0.5) * 6,
      vy:   -Math.random() * 5 - 1,
      r:    Math.random() * 4 + 2,
      life: 1,
      color
    });
  }
}

/* ── Actions joueur ─────────────────────────────────────────── */
function jump() {
  if (!gameRunning) return;
  if (CHAR.jumpCount < 2) {
    CHAR.vy        = -15;
    CHAR.jumping   = true;
    CHAR.jumpCount++;
    spawnParticles(CHAR.x + CHAR.w / 2, CHAR.y + CHAR.h, '#d4a84b');
  }
}

function crouch(on) {
  if (!gameRunning) return;
  CHAR.crouching = on;
}

/* ── Mise à jour (logique) ──────────────────────────────────── */
function update() {
  frameCount++;

  // Vitesse croissante plafonnée à 9
  speed = Math.min(9, 3 + Math.floor(score / 500) * 0.5);
  speedEl.textContent = (speed / 3).toFixed(1) + 'x';

  // Défilement du fond
  bgX -= speed * 0.4;

  // ── Physique du personnage (gravité) ──
  if (CHAR.jumping || CHAR.y < GROUND - CHAR.h - 1) {
    CHAR.vy += 0.72;
    CHAR.y  += CHAR.vy;
    if (CHAR.y >= GROUND - CHAR.h) {
      CHAR.y         = GROUND - CHAR.h;
      CHAR.vy        = 0;
      CHAR.jumping   = false;
      CHAR.jumpCount = 0;
    }
  }

  // ── Compte à rebours invincibilité post-dégât ──
  if (invincible) {
    invTimer--;
    if (invTimer <= 0) invincible = false;
  }

  // ── Spawn d'obstacles ──
  const spawnRate = Math.max(55, 120 - frameCount / 40);
  if (frameCount % Math.floor(spawnRate) === 0) spawnObstacle();

  // ── Mise à jour + collisions obstacles ──
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const ob = obstacles[i];
    ob.x -= speed;

    // Comptage : passage réussi d'un obstacle
    if (!ob.passed && ob.x + ob.w < CHAR.x) {
      ob.passed = true;
      score    += 10;
    }

    // Suppression une fois sorti de l'écran
    if (ob.x + ob.w < -120) {
      obstacles.splice(i, 1);
      continue;
    }

    // ── Détection de collision (hitbox réduite = plus fair) ──
    if (!invincible) {
      const charY = CHAR.crouching ? CHAR.y + CHAR.h * 0.45 : CHAR.y;
      const charH = CHAR.crouching ? CHAR.h * 0.55           : CHAR.h;
      const charX = CHAR.x + 10;
      const charW = CHAR.w - 20;

      const hit =
        charX         < ob.x + ob.w - 8 &&
        charX + charW > ob.x + 8         &&
        charY         < ob.y + ob.h - 8  &&
        charY + charH > ob.y + 8;

      if (hit) {
        lives--;
        livesValEl.textContent = lives;
        invincible = true;
        invTimer   = 90;

        spawnParticles(CHAR.x + CHAR.w / 2, CHAR.y + CHAR.h / 2, '#c0392b');

        // Flash rouge à l'écran
        hitFlash.style.background = 'rgba(180,0,0,0.35)';
        setTimeout(() => { hitFlash.style.background = 'rgba(180,0,0,0)'; }, 150);

        obstacles.splice(i, 1);

        if (lives <= 0) { endGame(); return; }
      }
    }
  }

  // Score passif (distance parcourue)
  score++;
  if (frameCount % 5 === 0) scoreValEl.textContent = score;

  // ── Mise à jour particules ──
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x    += p.vx;
    p.y    += p.vy;
    p.vy   += 0.15;
    p.life -= 0.04;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

/* ── Rendu (affichage) ──────────────────────────────────────── */
function draw() {
  ctx.clearRect(0, 0, W, H);

  // Fond défilant
  drawBg();

  // Ligne de sol lumineuse (effet doré)
  ctx.save();
  ctx.shadowColor = '#d4a84b';
  ctx.shadowBlur  = 18;
  ctx.fillStyle   = 'rgba(212,168,75,0.33)';
  ctx.fillRect(0, GROUND + 4, W, 3);
  ctx.restore();

  // ── Obstacles ──
  for (const ob of obstacles) {
    ctx.save();
    if (obsLoaded) {
      ctx.globalAlpha = 0.92;
      if (ob.type !== 'ground') {
        // Animation de vol : oscillation verticale sinusoïdale
        const fly = Math.sin(frameCount * 0.12 + ob.x * 0.01) * 6;
        ctx.drawImage(obsImg, ob.x, ob.y + fly, ob.w, ob.h);
      } else {
        ctx.drawImage(obsImg, ob.x, ob.y, ob.w, ob.h);
      }
    } else {
      // Fallback si image non chargée
      ctx.fillStyle = '#8b2323';
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    }
    ctx.restore();
  }

  // ── Personnage ──
  ctx.save();

  // Clignotement pendant la période d'invincibilité
  if (invincible && Math.floor(invTimer / 6) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }

  if (charLoaded) {
    if (CHAR.crouching) {
      // Écrasement vertical (simulation d'accroupissement)
      ctx.save();
      ctx.translate(CHAR.x + CHAR.w / 2, CHAR.y + CHAR.h * 0.72);
      ctx.scale(1.0, 0.58);
      ctx.drawImage(charImg, -CHAR.w / 2, -CHAR.h / 2, CHAR.w, CHAR.h);
      ctx.restore();
    } else {
      ctx.drawImage(charImg, CHAR.x, CHAR.y, CHAR.w, CHAR.h);
    }
  } else {
    // Fallback couleur
    const cy = CHAR.crouching ? CHAR.y + CHAR.h * 0.45 : CHAR.y;
    const ch = CHAR.crouching ? CHAR.h * 0.55           : CHAR.h;
    ctx.fillStyle = '#c0a030';
    ctx.fillRect(CHAR.x, cy, CHAR.w, ch);
  }

  ctx.restore();

  // ── Particules ──
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ── Boucle principale ──────────────────────────────────────── */
function loop() {
  if (!gameRunning) return;
  update();
  draw();
  animId = requestAnimationFrame(loop);
}

/* ── Démarrer / Redémarrer ──────────────────────────────────── */
function startGame() {
  score      = 0;
  lives      = 3;
  speed      = 3;
  frameCount = 0;
  bgX        = 0;
  obstacles  = [];
  particles  = [];
  invincible = false;
  invTimer   = 0;

  scoreValEl.textContent = '0';
  livesValEl.textContent = '3';

  overlay.style.display = 'none';

  resize();
  resetChar();

  gameRunning = true;
  loop();
}

/* ── Game Over ──────────────────────────────────────────────── */
function endGame() {
  gameRunning = false;
  cancelAnimationFrame(animId);

  overlay.innerHTML = `
    <h1>MORT</h1>
    <div class="subtitle">— VOUS ÊTES TOMBÉ DANS LE DONJON —</div>
    <p class="final-score-label">SCORE FINAL</p>
    <p class="final-score-value">${score}</p>
    <button class="btn" id="retryBtn">RÉESSAYER</button>
  `;
  overlay.style.display = 'flex';

  document.getElementById('retryBtn').addEventListener('click', startGame);
}

/* ── Événements clavier ─────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (['Space', 'ArrowUp'].includes(e.code) || e.key === 'w' || e.key === 'W') {
    e.preventDefault();
    jump();
  }
  if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    e.preventDefault();
    crouch(true);
  }
});

document.addEventListener('keyup', e => {
  if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    crouch(false);
  }
});

/* ── Événements tactiles (mobile) ───────────────────────────── */
let touchStartY = 0;

gc.addEventListener('touchstart', e => {
  e.preventDefault();
  touchStartY = e.touches[0].clientY;
  jump();
}, { passive: false });

gc.addEventListener('touchmove', e => {
  e.preventDefault();
  const dy = e.touches[0].clientY - touchStartY;
  if (dy > 30) crouch(true);
}, { passive: false });

gc.addEventListener('touchend', e => {
  e.preventDefault();
  crouch(false);
}, { passive: false });

/* ── Bouton démarrer (menu initial) ─────────────────────────── */
startBtn.addEventListener('click', startGame);

/* ── Premier rendu du background ────────────────────────────── */
drawBg();
