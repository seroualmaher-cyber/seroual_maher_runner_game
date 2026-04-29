/* ═══════════════════════════════════════════════════════════════
   SECTION 1 — RECUPERATION DES ELEMENTS HTML
   ═══════════════════════════════════════════════════════════════ */

// Les deux zones de dessin (canvas)
const bgCanvas  = document.getElementById('bgCanvas');   
const gameCanvas = document.getElementById('gameCanvas'); 

// Les pinceaux pour dessiner sur chaque canvas
const bgCtx  = bgCanvas.getContext('2d');
const ctx    = gameCanvas.getContext('2d');

// Le conteneur principal 
const container = document.getElementById('gameContainer');

// Lecran de menu / game over
const overlay = document.getElementById('overlay');

//  (affichage en jeu)
const scoreValEl = document.getElementById('scoreVal');  
const bestValEl  = document.getElementById('bestVal');  
const livesValEl = document.getElementById('livesVal'); 
const speedValEl = document.getElementById('speedVal'); 

// Le rectangle rouge qui clignote quand on est touche
const hitFlash = document.getElementById('hitFlash');

// Le bouton "Commencer" du menu
const startBtn = document.getElementById('startBtn');

// Meilleur score affiche dans le menu
const bestScoreMenuEl = document.getElementById('bestScoreMenu');

// Les audio 
const bgMusic       = document.getElementById('bgMusic');       
const jumpAudio     = document.getElementById('jumpAudio');     
const damageAudio   = document.getElementById('damageAudio');   
const gameOverAudio = document.getElementById('gameOverAudio');


/* ═══════════════════════════════════════════════════════════════
   SECTION 2 — REGLAGE DES VOLUMES AUDIO
   ═══════════════════════════════════════════════════════════════ */

bgMusic.volume       = 0.40;
jumpAudio.volume     = 0.65; 
damageAudio.volume   = 0.80; 
gameOverAudio.volume = 0.90; 

/* ═══════════════════════════════════════════════════════════════
   SECTION 3 — DIMENSIONS DU JEU
   ═══════════════════════════════════════════════════════════════ */

let W;       // largeur 
let H;       // hauteur
let GROUND;  // position Y du sol 
function calculerDimensions() {
  W      = container.offsetWidth;
  H      = container.offsetHeight;
  GROUND = H * 0.78; 
  // On ajuste la taille des deux canvas
  bgCanvas.width   = gameCanvas.width  = W;
  bgCanvas.height  = gameCanvas.height = H;
}

calculerDimensions();
window.addEventListener('resize', () => {
  calculerDimensions();
  dessinerFond();
});


/* ═══════════════════════════════════════════════════════════════
   SECTION 4 — CHARGEMENT DES IMAGES
   ═══════════════════════════════════════════════════════════════ */

// Image du fond 
const imgFond = new Image();
imgFond.src   = 'background.jpg';       
let fondCharge = false;
imgFond.onload = () => { fondCharge = true; dessinerFond(); };

// Image du personnage joueur
const imgPersonnage = new Image();
imgPersonnage.src   = 'character.png';  
let personnageCharge = false;
imgPersonnage.onload = () => { personnageCharge = true; };

// Image de lobstacle
const imgObstacle = new Image();
imgObstacle.src   = 'obstacle.png';    
let obstacleCharge = false;
imgObstacle.onload = () => { obstacleCharge = true; };


/* ═══════════════════════════════════════════════════════════════
   SECTION 5 — VARIABLES DETAT DU JEU
   ═══════════════════════════════════════════════════════════════ */

let partieEnCours = false;  
let animationId;            
let score       = 0;   
let meilleurScore = 0; 
let vies        = 3;   
let vitesse     = 3;  
let nombreFrames = 0;  
let decalageFond = 0;  

let obstacles  = [];   
let particules = [];   

let invincible  = false;
let timerInvincible = 0; 

/* ─── Constantes de vitesse ─── */
const VITESSE_DEPART = 3;   
const VITESSE_MAX    = 30;  


/* ═══════════════════════════════════════════════════════════════
   SECTION 6 — LE PERSONNAGE
   ═══════════════════════════════════════════════════════════════ */

const joueur = {
  x: 0,           
  y: 0,            
  largeur:  72,   
  hauteur:  90,   
  vitesseY: 0,     
  estEnSaut:     false, 
  estAccroupi:   false, 
  nombreSauts:   0      
 
};

/*  position de depart */
function initialiserJoueur() {
  joueur.x           = W * 0.15;         
  joueur.y           = GROUND - joueur.hauteur;
  joueur.vitesseY    = 0;
  joueur.estEnSaut   = false;
  joueur.estAccroupi = false;
  joueur.nombreSauts = 0;
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 7 — FONCTIONS AUDIO
   ═══════════════════════════════════════════════════════════════ */

/* Lance la musique de fond depuis le début */
function lancerMusique() {
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => { });
}

/* Arrete la musique de fond */
function arreterMusique() {
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

function jouerSon(elementAudio) {
  elementAudio.currentTime = 0;
  elementAudio.play().catch(() => {});
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 8 — DESSIN DU FOND DEFILANT
   ═══════════════════════════════════════════════════════════════ */

function dessinerFond() {
  if (fondCharge) {

    bgCtx.clearRect(0, 0, W, H);

    // Calcul de la largeur de limage 
    const ratioImage = imgFond.width / imgFond.height;
    const hauteurFond = H;
    const largeurFond = hauteurFond * ratioImage;

    // Calcul de la position X 
    const positionX = ((decalageFond % largeurFond) + largeurFond) % largeurFond - largeurFond;

    // On dessine limage deux fois 
    bgCtx.drawImage(imgFond, positionX,               0, largeurFond, hauteurFond);
    bgCtx.drawImage(imgFond, positionX + largeurFond, 0, largeurFond, hauteurFond);

    // Couche noire pour que les sprites soient plus lisibles
    bgCtx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    bgCtx.fillRect(0, 0, W, H);

  } else {
    //  fond noir uni si limage nest pas encore chargee
    bgCtx.fillStyle = '#0a0608';
    bgCtx.fillRect(0, 0, W, H);
  }
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 9 — CALCUL DE LA VITESSE
   ═══════════════════════════════════════════════════════════════ */

function calculerVitesse() {
  // La vitesse augmente  avec le score
  let nouvelleVitesse = VITESSE_DEPART + (score / 600);

  // On ne depasse pas le maximum
  if (nouvelleVitesse > VITESSE_MAX) {
    nouvelleVitesse = VITESSE_MAX;
  }

  vitesse = nouvelleVitesse;
  const affichageMultiplicateur = (vitesse / VITESSE_DEPART).toFixed(1);
  speedValEl.textContent = affichageMultiplicateur + 'x';
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 10 — GESTION DES OBSTACLES
   ═══════════════════════════════════════════════════════════════ */

function creerObstacle() {
  // On choisit un type au hasard parmi les 3
  const types = ['sol', 'vol_bas', 'vol_haut'];
  const type  = types[Math.floor(Math.random() * types.length)];

  let posY, largeur = 64, hauteur = 56;

  // On place lobstacle a la bonne hauteur 
  if      (type === 'sol')      { posY = GROUND - 52;  hauteur = 52; largeur = 52; }
  else if (type === 'vol_bas')  { posY = GROUND - 115; }
  else                          { posY = GROUND - 185; } 

  // On ajoute lobstacle dans la liste
  obstacles.push({
    x:        W + 80,  
    y:        posY,
    largeur:  largeur,
    hauteur:  hauteur,
    type:     type,
    depasse:  false,
  });
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 11 — PARTICULES (effets visuels)
   ═══════════════════════════════════════════════════════════════ */

function creerParticules(x, y, couleur) {
  for (let i = 0; i < 14; i++) {
    particules.push({
      x:       x,
      y:       y,
      vx:      (Math.random() - 0.5) * 6,   
      vy:      -Math.random() * 5 - 1,       
      rayon:   Math.random() * 4 + 2,        
      vie:     1,                           
      couleur: couleur
    });
  }
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 12 — ACTIONS DU JOUEUR
   ═══════════════════════════════════════════════════════════════ */

/* SAUT (double saut) */
function sauter() {
  if (!partieEnCours) return;

  if (joueur.nombreSauts < 2) {
    joueur.vitesseY    = -15;         
    joueur.estEnSaut   = true;
    joueur.nombreSauts++;

    jouerSon(jumpAudio);           

    // Particules  sous les pieds
    creerParticules(
      joueur.x + joueur.largeur / 2,
      joueur.y + joueur.hauteur,
      '#d4a84b'
    );
  }
}

/* ACCROUPISSEMENT */
function sAccroupir(actif) {
  if (!partieEnCours) return;
  joueur.estAccroupi = actif;
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 13 — MISE A JOUR (logique du jeu)
   ═══════════════════════════════════════════════════════════════ */

function mettreAJour() {
  nombreFrames++;

  /* ───  Mise a jour de la vitesse ─── */
  calculerVitesse();

  /* ───  Defilement du fond ─── */
  decalageFond -= vitesse * 0.4;

  /* ─── 13c. Physique du personnage : gravite et sol ─── */
  // Si le joueur est en lair, on lui applique la gravite
  if (joueur.estEnSaut || joueur.y < GROUND - joueur.hauteur - 1) {
    joueur.vitesseY += 0.72;          // acceere vers le bas
    joueur.y        += joueur.vitesseY;

   
    if (joueur.y >= GROUND - joueur.hauteur) {
      joueur.y           = GROUND - joueur.hauteur; 
      joueur.vitesseY    = 0;
      joueur.estEnSaut   = false;
      joueur.nombreSauts = 0;         
    }
  }

  /* Gestion de linvincibilite */
  if (invincible) {
    timerInvincible--;
    if (timerInvincible <= 0) {
      invincible = false; 
    }
  }

  /*  Apparition des obstacles */
  const frequenceApparition = Math.max(55, 120 - nombreFrames / 40);
  if (nombreFrames % Math.floor(frequenceApparition) === 0) {
    creerObstacle();
  }

  /* Deplacement des obstacles et detection de collision */
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const ob = obstacles[i];

    // Lobstacle avance vers la gauche
    ob.x -= vitesse;
    if (!ob.depasse && ob.x + ob.largeur < joueur.x) {
      ob.depasse = true;
      score     += 10;
    }

    // Si lobstacle est sorti completement a gauche, on le supprime
    if (ob.x + ob.largeur < -120) {
      obstacles.splice(i, 1);
      continue; 
    }

    /* Detection de collision*/
    if (!invincible) {
      const jX = joueur.x + 10;                                  
      const jW = joueur.largeur - 20;                             
      const jY = joueur.estAccroupi ? joueur.y + joueur.hauteur * 0.45 : joueur.y;
      const jH = joueur.estAccroupi ? joueur.hauteur * 0.55       : joueur.hauteur;

      // Test de collision rectangulaire
      const collision =
        jX      < ob.x + ob.largeur - 8 &&
        jX + jW > ob.x + 8              &&
        jY      < ob.y + ob.hauteur - 8 &&
        jY + jH > ob.y + 8;

      if (collision) {
        vies--;
        livesValEl.textContent = vies;

        // Periode dinvincibilite 
        invincible      = true;
        timerInvincible = 90;

        // Son et effets visuels du degat
        jouerSon(damageAudio); 
        creerParticules(
          joueur.x + joueur.largeur / 2,
          joueur.y + joueur.hauteur / 2,
          '#c0392b'
        );

        // Flash rouge qui couvre lecran
        hitFlash.style.background = 'rgba(180, 0, 0, 0.38)';
        setTimeout(() => {
          hitFlash.style.background = 'rgba(180, 0, 0, 0)';
        }, 150);

        // On supprime lobstacle qui a touche le joueur
        obstacles.splice(i, 1);

        // Si plus de vies:fin de partie
        if (vies <= 0) {
          terminerPartie();
          return; 
        }
      }
    }
  }

  /* Score passif  */
  score++;
  if (nombreFrames % 5 === 0) {
    scoreValEl.textContent = score;
  }

  /* Mise à jour des particules */
  for (let i = particules.length - 1; i >= 0; i--) {
    const p = particules[i];
    p.x   += p.vx;
    p.y   += p.vy;
    p.vy  += 0.15;  
    p.vie -= 0.04;  
    if (p.vie <= 0) {
      particules.splice(i, 1);
    }
  }
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 14 — DESSIN
   ═══════════════════════════════════════════════════════════════ */

function dessiner() {
  ctx.clearRect(0, 0, W, H);

  /*  Fond defilant */
  dessinerFond();

  /*  Ligne du sol */
  ctx.save();
  ctx.shadowColor = '#d4a84b';
  ctx.shadowBlur  = 18;
  ctx.fillStyle   = 'rgba(212, 168, 75, 0.33)';
  ctx.fillRect(0, GROUND + 4, W, 3);
  ctx.restore();

  /*  Dessin des obstacles*/
  for (const ob of obstacles) {
    ctx.save();

    if (obstacleCharge) {
      ctx.globalAlpha = 0.93;

      if (ob.type !== 'sol') {
        const ondulation = Math.sin(nombreFrames * 0.12 + ob.x * 0.01) * 6;
        ctx.drawImage(imgObstacle, ob.x, ob.y + ondulation, ob.largeur, ob.hauteur);
      } else {
        ctx.drawImage(imgObstacle, ob.x, ob.y, ob.largeur, ob.hauteur);
      }

    } else {
      ctx.fillStyle = '#8b2323';
      ctx.fillRect(ob.x, ob.y, ob.largeur, ob.hauteur);
    }

    ctx.restore();
  }

  /* Dessin du personnage */
  ctx.save();
  if (invincible && Math.floor(timerInvincible / 6) % 2 === 0) {
    ctx.globalAlpha = 0.30;
  }

  if (personnageCharge) {

    if (joueur.estAccroupi) {
      ctx.save();
      ctx.translate(
        joueur.x + joueur.largeur / 2,
        joueur.y + joueur.hauteur * 0.72
      );
      ctx.scale(1.0, 0.58);
      ctx.drawImage(
        imgPersonnage,
        -joueur.largeur / 2,
        -joueur.hauteur / 2,
        joueur.largeur,
        joueur.hauteur
      );
      ctx.restore();

    } else {
      ctx.drawImage(imgPersonnage, joueur.x, joueur.y, joueur.largeur, joueur.hauteur);
    }

  } else {
    const posY  = joueur.estAccroupi ? joueur.y + joueur.hauteur * 0.45 : joueur.y;
    const hautF = joueur.estAccroupi ? joueur.hauteur * 0.55             : joueur.hauteur;
    ctx.fillStyle = '#c0a030';
    ctx.fillRect(joueur.x, posY, joueur.largeur, hautF);
  }

  ctx.restore();

  /* Dessin des particules*/
  for (const p of particules) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.vie); 
    ctx.fillStyle   = p.couleur;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.rayon, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 15 — BOUCLE PRINCIPALE DU JEU
   ═══════════════════════════════════════════════════════════════ */

function boucleJeu() {
  if (!partieEnCours) return;

  mettreAJour(); 
  dessiner();    
  animationId = requestAnimationFrame(boucleJeu);
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 16 — DEMARRER UNE PARTIE
   ═══════════════════════════════════════════════════════════════ */

function demarrerPartie() {
  score        = 0;
  vies         = 3;
  vitesse      = VITESSE_DEPART;
  nombreFrames = 0;
  decalageFond = 0;
  obstacles    = [];
  particules   = [];
  invincible   = false;
  timerInvincible = 0;
  scoreValEl.textContent = '0';
  livesValEl.textContent = '3';
  overlay.style.display = 'none';

  // Replacer le joueur au dep
  calculerDimensions();
  initialiserJoueur();
  lancerMusique(); 
  partieEnCours = true;
  boucleJeu();
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 17 — FIN DE PARTIE (GAME OVER)
   ═══════════════════════════════════════════════════════════════ */

function terminerPartie() {
  partieEnCours = false;
  cancelAnimationFrame(animationId);
  arreterMusique();
  jouerSon(gameOverAudio); 

  /*Mise a jour du meilleur score */
  let nouveauRecord = false;
  if (score > meilleurScore) {
    meilleurScore    = score;
    nouveauRecord    = true;
    bestValEl.textContent        = meilleurScore;
    bestScoreMenuEl.textContent  = meilleurScore;
  }

  /* ─── Affichage de Game Over ─── */
  overlay.innerHTML = `
    <h1>MORT</h1>
    <p class="subtitle">— VOUS ÊTES TOMBÉ DANS LE DONJON —</p>
    <p class="final-label">SCORE FINAL</p>
    <p class="final-value">${score}</p>
    ${nouveauRecord ? '<p class="new-record">🏆 NOUVEAU RECORD !</p>' : `<p class="best-display">🏆 MEILLEUR : ${meilleurScore}</p>`}
    <button class="btn" id="retryBtn">RÉESSAYER</button>
  `;
  overlay.style.display = 'flex';

  // Rebrancher le bouton "Reessayer"
  document.getElementById('retryBtn').addEventListener('click', demarrerPartie);
}


/* ═══════════════════════════════════════════════════════════════
   SECTION 18 — CONTROLES CLAVIER
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('keydown', (evenement) => {
  if (
    evenement.code === 'Space'    ||
    evenement.code === 'ArrowUp'  ||
    evenement.key  === 'w'        ||
    evenement.key  === 'W'
  ) {
    evenement.preventDefault(); 
    sauter();
  }

  // ACCROUPISSEMENT 
  if (evenement.code === 'ArrowDown' || evenement.key === 's' || evenement.key === 'S') {
    evenement.preventDefault();
    sAccroupir(true); 
  }
});

document.addEventListener('keyup', (evenement) => {
  if (evenement.code === 'ArrowDown' || evenement.key === 's' || evenement.key === 'S') {
    sAccroupir(false);
  }
});


/* ═══════════════════════════════════════════════════════════════
   SECTION 19 — CONTROLES TACTILES 
   ═══════════════════════════════════════════════════════════════ */

let posYTouchDepart = 0;
gameCanvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  posYTouchDepart = e.touches[0].clientY;
  sauter();
}, { passive: false });
gameCanvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const deplacement = e.touches[0].clientY - posYTouchDepart;
  if (deplacement > 30) {
    sAccroupir(true);
  }
}, { passive: false });
gameCanvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  sAccroupir(false);
}, { passive: false });


/* ═══════════════════════════════════════════════════════════════
   SECTION 20 — INITIALISATION AU CHARGEMENT DE LA PAGE
   ═══════════════════════════════════════════════════════════════ */
startBtn.addEventListener('click', demarrerPartie);
dessinerFond();
