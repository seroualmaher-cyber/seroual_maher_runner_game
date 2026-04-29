#  Darkest Run

> Jeu de type **endless runner** sur fond de donjon médiéval fantastique, développé entièrement en HTML, CSS et JavaScript .

---

##  Lien du jeu

** [Jouer maintenant](https://seroualmaher-cyber.github.io/seroual_maher_runner_game/)**

---

##  Technologies utilisées

| Technologie | Rôle |
|---|---|
| HTML5 | Structure de la page et éléments `<canvas>` |
| CSS3 | Interface, overlay, animations UI |
| JavaScript (Vanilla) | Logique du jeu, physique, rendu, audio |
| Canvas API (2D) | Rendu du personnage, obstacles, particules, fond |
| Web Audio API | Musique de fond et effets sonores |
| `requestAnimationFrame` | Boucle de jeu fluide (60 fps) |

---

##  Fonctionnalités principales

- **Double saut** — le joueur peut sauter une seconde fois en l'air
- **Accroupissement** — esquiver les obstacles volants
- **3 types d'obstacles** — au sol, vol bas, vol haut, générés aléatoirement
- **Difficulté progressive** — la vitesse augmente continuellement avec le score
- **Système de vies** — 3 vies avec période d'invincibilité après chaque dégât
- **Effets visuels** — particules dorées au saut, particules rouges à l'impact, flash d'écran rouge
- **Fond défilant en parallaxe** sur deux canvas superposés
- **Animation d'ondulation** des obstacles en vol
- **Scintillement du sprite** pendant l'invincibilité
- **Musique de fond** en boucle + effets sonores (saut, dégât, game over)
- **Meilleur score persistent** pendant la session, affiché en menu et en jeu
- **Menu de départ** et **écran Game Over** avec score final et détection de record

---

##  Contr
| Sauter (double saut) | `Espace` / `↑` / `W` | 
| S'accroupir | `↓` / `S` | 

---

##  Structure du projet

```
darkest-run/
├── index.html          # Structure HTML, canvases, overlay, audio
├── style.css           # Mise en page, UI, overlay, boutons
├── game.js             # Logique complète du jeu (20 sections)
├── background.jpg      # Image de fond du donjon
├── character.png       # Sprite du personnage joueur
├── obstacle.png        # Sprite des obstacles
├── darkfantasy.mp3     # Musique de fond
├── jumpSound.mp3       # Son du saut
├── damage.mp3          # Son de dégât
└── gameOverSound.mp3   # Son de fin de partie
```

---

##  Nouveautés explorées

- **Double canvas** : utilisation d'un canvas dédié au fond (`bgCanvas`) et d'un second pour les sprites (`gameCanvas`), ce qui évite de redessiner le fond à chaque frame inutilement.
- **Physique manuelle** : implémentation d'une gravité et d'une vitesse verticale sans moteur de physique externe.
- **Système de particules** : création, animation et suppression dynamique de particules pour les effets visuels.
- **Responsive canvas** : recalcul des dimensions et repositionnement du joueur à chaque `resize`.
- **Animation d'ondulation** avec `Math.sin()` pour donner du mouvement aux obstacles volants.

---

##  Difficultés rencontrées

1. **Défilement du fond sans coupure** : faire boucler l'image de fond de façon transparente avec un calcul de décalage modulo.
2. **Synchronisation audio** : les navigateurs bloquent la lecture audio automatique ; gérer les promesses rejetées silencieusement avec `.catch(() => {})`.
3. **Fréquence d'apparition des obstacles** : trouver un équilibre entre difficulté et jouabilité en faisant varier l'intervalle dynamiquement avec `nombreFrames`.

---

##  Solutions apportées

1. **Défilement du fond** → Double dessin de l'image avec décalage calculé via `(decalageFond % largeurFond) - largeurFond`, garantissant une boucle sans couture.
2. **Audio bloqué** → Encapsulation de chaque `play()` dans un `.catch()` vide pour éviter les erreurs non gérées en console.
3. **Fréquence des obstacles** → Formule `Math.max(55, 120 - nombreFrames / 40)` pour réduire progressivement l'intervalle tout en gardant un minimum jouabl
