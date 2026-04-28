const character = document.getElementById("character");
const game = document.getElementById("game");

const scoreDisplay = document.getElementById("score");
const bestScoreDisplay = document.getElementById("bestScore");
const finalScoreDisplay = document.getElementById("finalScore");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const jumpSound = document.getElementById("jumpSound");
const gameOverSound = document.getElementById("gameOverSound");

let score = 0;
let bestScore = localStorage.getItem("bestScore") || 0;
let speed = 5;
let isPlaying = false;
let obstacles = [];

bestScoreDisplay.innerText = bestScore;

// ================= START BUTTON =================
startBtn.addEventListener("click", () => {
    startScreen.classList.add("hidden");
    startGame();
});

restartBtn.addEventListener("click", () => {
    location.reload();
});

// ================= CONTROLES =================
document.addEventListener("keydown", (e) => {
    if (!isPlaying) return;

    if (e.key === "ArrowUp") jump();
    if (e.key === "ArrowDown") crouch();
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowDown") standUp();
});

// ================= JOUEUR =================
function jump() {
    if (!character.classList.contains("jump")) {
        character.classList.add("jump");

        jumpSound.currentTime = 0;
        jumpSound.play();

        setTimeout(() => {
            character.classList.remove("jump");
        }, 500);
    }
}

function crouch() {
    character.classList.add("crouch");
}

function standUp() {
    character.classList.remove("crouch");
}

// ================= OBSTACLES =================
function createObstacle() {
    const obs = document.createElement("div");
    obs.classList.add("obstacle");

    obs.style.right = "-30px";
    game.appendChild(obs);
    obstacles.push(obs);
}

// ================= GAME LOOP =================
function gameLoop() {
    if (!isPlaying) return;

    score++;
    scoreDisplay.innerText = score;

    obstacles.forEach((obs, index) => {
        let right = parseInt(obs.style.right);
        obs.style.right = (right + speed) + "px";

        let characterBottom = parseInt(window.getComputedStyle(character).bottom);

        if (right > 580 && right < 640 && characterBottom < 40) {
            gameOver();
        }

        if (right > 700) {
            obs.remove();
            obstacles.splice(index, 1);
        }
    });

    if (Math.random() < 0.02) {
        createObstacle();
    }

    requestAnimationFrame(gameLoop);
}

// ================= GAME STATES =================
function startGame() {
    isPlaying = true;
    score = 0;
    speed = 5;
    obstacles = [];

    gameLoop();
}

function gameOver() {
    isPlaying = false;

    gameOverSound.currentTime = 0;
    gameOverSound.play();

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("bestScore", bestScore);
    }

    finalScoreDisplay.innerText = score;
    bestScoreDisplay.innerText = bestScore;

    gameOverScreen.classList.remove("hidden");
}