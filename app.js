"use strict";
const root = document.getElementById("root");
const form = document.getElementById("form");
const btnViewLeaderboard = document.getElementById("view-leaderboard");
const canvas = document.getElementById("game-canvas");
/** @type {CanvasRenderingContext2D} */
const canvasContext = canvas.getContext("2d");

const FPS = 30;
const ASTEROIDS_MAX_LIVES = 4;
const PLAYER_SIZE = 30;
const PLAYER_MAX_LIVES = 3;
const ROCKET_SPEED = 700;
const ROCKET_RADIUS = 3;
const SCORE_MULTIPLIER = 50;
const MAX_LEVEL = 3;

const keys = {
  z: "z",
  x: "x",
  c: "c",
  arrows: {
    ArrowUp: "ArrowUp",
    ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft",
    ArrowRight: "ArrowRight",
  },
};

// Determinarea numărului de asteroizi în funcție de nivel
const LevelToAsteroidsCountMap = {
  1: 5,
  2: 7,
  3: 10,
};

// Determinarea culorii asteroidului în funcție de numărul de vieți al acestuia
const AsteroidLivesToColorsMap = {
  1: "#3146e8",
  2: "#43b1e8",
  3: "#77e843",
  4: "#eb5b34",
};

/** @param {HTMLElement} element */
const toggleElement = (element) => {
  element.classList.toggle("hide");
};

// Determinarea distanței dintre două puncte
const distanceBetweenPoints = (x1, y1, x2, y2) =>
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

const drawText = ({
  fontSize = 20,
  align = "start",
  color = "#fff",
  text = "",
  x = 0,
  y = 0,
} = {}) => {
  canvasContext.font = `${fontSize}px Rowdies`;
  canvasContext.fillStyle = color;
  canvasContext.textAlign = align;
  canvasContext.fillText(text, x, y);
};

class Rocket {
  constructor(id, x, y, velocityX, velocityY) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.radius = ROCKET_RADIUS;
    this.hasHitAsteroid = false;
  }

  // Desenare rachetă sub formă de cerc
  draw() {
    canvasContext.fillStyle = "#f5b128";
    canvasContext.beginPath();
    canvasContext.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    canvasContext.closePath();
    canvasContext.fill();

    this.x += this.velocityX;
    this.y += this.velocityY;
  }
}

class Player {
  /** @type {Rocket[]} */
  rockets;

  constructor() {
    this.setInitialCoords();
    this.rotation = 0;
    this.rotationSpeed = 360;
    this.size = PLAYER_SIZE;
    this.radius = this.size / 2;
    this.angle = (90 / 180) * Math.PI;
    this.strokeColor = "white";
    this.isThrusting = false;
    this.thrustX = 0;
    this.thrustY = 0;
    this.thrustAcceleration = 5;
    this.lives = PLAYER_MAX_LIVES;
    this.hasImmunity = false;
    this.rockets = [];
    this.rocketSpeed = ROCKET_SPEED;
    this.score = 0;
    this.nickname = "";
  }

  // Desenare player sub formă de triunghi
  draw() {
    canvasContext.strokeStyle = this.strokeColor;
    canvasContext.lineWidth = this.size / 20;
    canvasContext.beginPath();
    canvasContext.moveTo(
      this.x + this.radius * Math.cos(this.angle),
      this.y - this.radius * Math.sin(this.angle)
    );
    canvasContext.lineTo(
      this.x - this.radius * (Math.cos(this.angle) + Math.sin(this.angle)),
      this.y + this.radius * (Math.sin(this.angle) - Math.cos(this.angle))
    );
    canvasContext.lineTo(
      this.x - this.radius * (Math.cos(this.angle) - Math.sin(this.angle)),
      this.y + this.radius * (Math.sin(this.angle) + Math.cos(this.angle))
    );
    canvasContext.closePath();
    canvasContext.stroke();
  }

  // Rotire player în funcție de direcția oferită (-1 sau 1)
  /** @param {-1 | 1} direction */
  rotate(direction) {
    if (!direction || (direction !== 1 && direction !== -1)) {
      this.rotation = 0;
      return;
    }

    this.rotation = (((this.rotationSpeed * direction) / 180) * Math.PI) / FPS;
    this.angle += this.rotation;
  }

  // Mișcarea playerului pe canvas în funcție de direcția oferită (sus/jos/stânga/dreapta)
  /** @param {keyof typeof keys.arrows} direction */
  thrust(direction) {
    if (this.isThrusting) {
      switch (direction) {
        case keys.arrows.ArrowUp:
          {
            this.thrustX +=
              (this.thrustAcceleration * Math.cos(this.angle)) / FPS;
            this.thrustY -=
              (this.thrustAcceleration * Math.sin(this.angle)) / FPS;
          }
          break;

        case keys.arrows.ArrowDown:
          {
            this.thrustX -=
              (this.thrustAcceleration * Math.cos(this.angle)) / FPS;
            this.thrustY +=
              (this.thrustAcceleration * Math.sin(this.angle)) / FPS;
          }
          break;

        case keys.arrows.ArrowLeft:
          {
            this.thrustX -=
              (this.thrustAcceleration * Math.sin(this.angle)) / FPS;
            this.thrustY -=
              (this.thrustAcceleration * Math.cos(this.angle)) / FPS;
          }
          break;

        case keys.arrows.ArrowRight:
          {
            this.thrustX +=
              (this.thrustAcceleration * Math.sin(this.angle)) / FPS;
            this.thrustY +=
              (this.thrustAcceleration * Math.cos(this.angle)) / FPS;
          }
          break;
      }
    } else {
      this.thrustX = 0;
      this.thrustY = 0;
    }

    this.x += this.thrustX;
    this.y += this.thrustY;

    if (this.x < 0 - this.radius) {
      this.x = canvas.width + this.radius;
    } else if (this.x > canvas.width + this.radius) {
      this.x = 0 - this.radius;
    }

    if (this.y < 0 - this.radius) {
      this.y = canvas.height + this.radius;
    } else if (this.y > canvas.height + this.radius) {
      this.y = 0 - this.radius;
    }
  }

  // Lansarea rachetei, maxim 3 rachete simultan
  shoot() {
    const angleCos = Math.cos(this.angle);
    const angleSin = Math.sin(this.angle);

    if (this.rockets.length >= 3) return;

    this.rockets.push(
      new Rocket(
        this.rockets.length + 1,
        this.x + (4 / 3) * this.radius * angleCos,
        this.y - (4 / 3) * this.radius * angleSin,
        (this.rocketSpeed * angleCos) / FPS,
        -(this.rocketSpeed * angleSin) / FPS
      )
    );
  }

  // Acordarea imunității și resetarea acesteia după 3 secunde
  giveImmunity() {
    this.hasImmunity = true;
    setTimeout(() => {
      this.hasImmunity = false;
    }, 3000);
  }

  // Setare coordonate inițiale
  setInitialCoords() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
  }
}

class Asteroid {
  constructor(id) {
    this.id = id;
    this.setCoords();
    this.speed = 100;
    this.size = 50;
    this.initialLives = Math.ceil(Math.random() * ASTEROIDS_MAX_LIVES);
    this.lives = this.initialLives;
    this.setColor();
    this.velocityX =
      ((Math.random() * this.speed) / FPS) * (Math.random() < 0.5 ? 1 : -1);
    this.velocityY =
      ((Math.random() * this.speed) / FPS) * Math.random() < 0.5 ? 1 : -1;
    this.setRadius();
    this.angle = Math.random() * Math.PI * 2;
  }

  // Desenarea unui asteroid sub formă de cerc, scrierea numărului de vieți în centrul lui și modificarea traiectoriei în urma coliziunii cu limitele ecranului
  draw() {
    canvasContext.beginPath();
    canvasContext.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    canvasContext.fillStyle = this.color;
    canvasContext.closePath();
    canvasContext.fill();

    drawText({
      align: "center",
      text: this.lives,
      x: this.x,
      y: this.y,
    });

    if (this.isOffXBounds()) {
      this.velocityX *= -1;
    }

    if (this.isOffYBounds()) {
      this.velocityY *= -1;
    }

    this.x += this.velocityX;
    this.y += this.velocityY;
  }

  // Setarea coordonatelor
  setCoords() {
    this.x = Math.floor(Math.random() * canvas.width);
    this.y = Math.floor(Math.random() * canvas.height);
  }

  // Setarea razei
  setRadius() {
    this.radius = (this.size * this.lives) / 2;
  }

  // Setarea culorii în funcție de numărul actual de vieți
  setColor() {
    this.color = AsteroidLivesToColorsMap[this.lives];
  }

  isOffXBounds() {
    return this.x + this.radius > canvas.width || this.x - this.radius < 0;
  }

  isOffYBounds() {
    return this.y + this.radius > canvas.height || this.y - this.radius < 0;
  }
}

class App {
  /** @type {Player} */
  player;
  /** @type {Asteroid[]}  */
  asteroids = [];
  /** @type {'keyboard' | 'mouse' | 'both'} */
  gameplayMode;

  constructor(gameplayMode) {
    toggleElement(form);
    toggleElement(btnViewLeaderboard);
    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.gameplayMode = gameplayMode;

    this.level = 1;
    this.player = new Player();

    this.#createAsteroids(LevelToAsteroidsCountMap[this.level]);
    this.#addEventListeners();
    this.#updateAsteroids();

    this.interval = setInterval(() => this.#update(), 1000 / FPS);

    this.#checkInitialCollisions();
  }

  // Actualizare joc
  #update() {
    this.#setCanvasContext();
    this.#updateEntities();
    this.#setStats();
    this.#checkNewLevel();
    this.#checkGameOver();
  }

  // Actualizare player (desenare și mișcare)
  #updatePlayer() {
    this.player.draw();
    this.player.thrust();
  }

  // Actualizare asteroizi (desenare și verificare coliziuni)
  #updateAsteroids() {
    this.asteroids.forEach((asteroid) => {
      asteroid.draw();
      this.#checkCollisions(asteroid);
    });
  }

  // Actualizare rachete (eliminarea rachetelor care au ieșit din ecran sau care au lovit asteroid și desenarea celor rămase)
  #updateRockets() {
    this.player.rockets = this.player.rockets.filter(
      (rocket) =>
        rocket.x + rocket.radius < canvas.width &&
        rocket.x > 0 &&
        rocket.y + rocket.radius < canvas.height &&
        rocket.y > 0 &&
        !rocket.hasHitAsteroid
    );

    this.player.rockets.forEach((rocket) => {
      rocket.draw();
    });
  }

  #updateEntities() {
    this.#updatePlayer();
    this.#updateAsteroids();
    this.#updateRockets();
  }

  #setCanvasContext() {
    canvasContext.fillStyle = "#0e0836";
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Verificare coliziuni asteroizi pentru a nu genera asteroizi în mijlocul ecranului (poziția inițială a playerului sau în afara ecranului)
  #checkInitialCollisions() {
    this.asteroids.forEach((asteroid) => {
      while (
        distanceBetweenPoints(
          canvas.width / 2,
          canvas.height / 2,
          asteroid.x,
          asteroid.y
        ) <
          asteroid.size * 2 + asteroid.radius ||
        asteroid.isOffXBounds() ||
        asteroid.isOffYBounds() ||
        this.#getCollidingAsteroid(asteroid)
      ) {
        asteroid.setCoords();
      }
    });
  }

  // Verificare coliziuni asteroid-asteroid sau rachetă-asteroid
  /** @param {Asteroid} asteroid */
  #checkCollisions(asteroid) {
    const collidingRocket = this.#getCollidingRocket(asteroid);
    const collidingAsteroid = this.#getCollidingAsteroid(asteroid);

    if (collidingRocket && !collidingRocket.hasHitAsteroid) {
      collidingRocket.hasHitAsteroid = true;
      asteroid.lives -= 1;
      asteroid.setRadius();
      asteroid.setColor();
    }

    if (asteroid.lives <= 0) {
      this.player.score += asteroid.initialLives * SCORE_MULTIPLIER;
    }

    if (collidingAsteroid) {
      collidingAsteroid.velocityX *= -1;
      collidingAsteroid.velocityY *= -1;
    }

    if (
      distanceBetweenPoints(
        this.player.x,
        this.player.y,
        asteroid.x,
        asteroid.y
      ) <
      this.player.radius + asteroid.radius
    ) {
      if (this.player.lives > 0 && !this.player.hasImmunity) {
        this.player.lives -= 1;
        this.player.setInitialCoords();
        this.player.giveImmunity();
      }
    }

    this.asteroids = this.asteroids.filter((a) => a.lives > 0);
  }

  // Căutare asteroid care lovește alt asteroid
  /** @param {Asteroid} asteroid */
  #getCollidingAsteroid(asteroid) {
    return this.asteroids.find(
      (a) =>
        a.id !== asteroid.id &&
        distanceBetweenPoints(a.x, a.y, asteroid.x, asteroid.y) <
          a.radius + asteroid.radius
    );
  }

  // Căutare rachetă care lovește asteroid
  /** @param {Asteroid} asteroid */
  #getCollidingRocket(asteroid) {
    return this.player.rockets.find(
      (rocket) =>
        distanceBetweenPoints(asteroid.x, asteroid.y, rocket.x, rocket.y) <
        asteroid.radius + rocket.radius
    );
  }

  // Verificare dacă trebuie actualizat nivelul sau dacă jocul urmează să fie câștigat
  #checkNewLevel() {
    if (!this.asteroids.length) {
      if (this.level === MAX_LEVEL) {
        this.#setStats();
        this.#saveScore();
        this.#cleanup();

        canvasContext.fillStyle = "#00000025";
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);

        drawText({
          fontSize: 64,
          align: "center",
          text: "You won! Congratulations!",
          color: "#0f0",
          x: canvas.width / 2,
          y: canvas.height / 2,
        });
        return;
      }

      if (this.level < MAX_LEVEL && !this.asteroids.length) {
        this.level += 1;
        this.player.lives += 1;
        this.#createAsteroids(LevelToAsteroidsCountMap[this.level]);
        this.player.setInitialCoords();
        this.player.giveImmunity();
        this.#checkInitialCollisions();
      }
    }
  }

  // Verificare dacă playerul a fost învins
  #checkGameOver() {
    if (this.player.lives <= 0) {
      this.asteroids.forEach((asteroid) => {
        asteroid.velocityX = 0;
        asteroid.velocityY = 0;

        this.#cleanup();

        canvasContext.fillStyle = "#00000025";
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);

        drawText({
          fontSize: 64,
          align: "center",
          text: "Game over",
          color: "#f00",
          x: canvas.width / 2,
          y: canvas.height / 2,
        });
      });
    }
  }

  // Întrerupere joc
  #cleanup() {
    this.#removeEventListeners();
    clearInterval(this.interval);
  }

  #createAsteroids(count) {
    for (let i = 0; i < count; i++) {
      this.asteroids.push(new Asteroid(i));
    }
  }

  // Desenare statistici (vieți rămase, scor, nivel actual)
  #setStats() {
    drawText({
      fontSize: 32,
      text: `Lives: ${this.player.lives}`,
      x: 16,
      y: 32,
    });

    if (this.player.hasImmunity && this.player.lives > 0) {
      drawText({
        fontSize: 24,
        text: "You have immunity",
        x: 16,
        y: 64,
      });
    }

    drawText({
      fontSize: 32,
      text: `Level: ${this.level}`,
      x: 16,
      y: canvas.height - 64,
    });

    drawText({
      fontSize: 32,
      text: `Score: ${this.player.score}`,
      x: 16,
      y: canvas.height - 16,
    });
  }

  // Salvare scor în local storage
  #saveScore() {
    try {
      let scores = JSON.parse(localStorage.getItem("scores")) || [];

      const newEntry = {
        nickname: this.player.nickname,
        score: this.player.score,
        date: new Date().toISOString(),
      };

      const hasHigherScoreEntry = scores.find(
        (entry) =>
          entry.nickname === newEntry.nickname && entry.score > newEntry.score
      );

      if (hasHigherScoreEntry) return;

      scores = scores.filter((entry) => entry.nickname !== newEntry.nickname);
      scores.push(newEntry);
      scores.sort((a, b) => b.score - a.score);
      scores.slice(0, 10);

      localStorage.setItem("scores", JSON.stringify(scores));
    } catch (err) {
      console.error(err);
    }
  }

  #onKeyDown = (event) => {
    if (keys.arrows[event.key]) {
      this.player.isThrusting = true;
      this.player.thrust(event.key);
      return;
    }

    switch (event.key) {
      case keys.z:
        this.player.rotate(1);
        break;

      case keys.x:
        this.player.shoot();
        break;

      case keys.c:
        this.player.rotate(-1);
        break;
    }
  };

  #onKeyUp = (event) => {
    if (keys.arrows[event.key]) {
      this.player.isThrusting = false;
      this.player.thrust();
      return;
    }

    switch (event.key) {
      case keys.z:
        this.player.rotate(0);
        break;

      case keys.c:
        this.player.rotate(0);
        break;
    }
  };

  #onClick = () => {
    this.player.shoot();
  };

  #onMouseMove = (event) => {
    this.player.x = event.x;
    this.player.y = event.y;
  };

  // Adăugare eventuri în funcție de modul de joc ales
  #addEventListeners() {
    if (this.gameplayMode === "keyboard" || this.gameplayMode === "both") {
      document.addEventListener("keydown", this.#onKeyDown);
      document.addEventListener("keyup", this.#onKeyUp);
    }

    if (this.gameplayMode === "mouse" || this.gameplayMode === "both") {
      document.addEventListener("click", this.#onClick);
      document.addEventListener("mousemove", this.#onMouseMove);
    }
  }

  #removeEventListeners() {
    document.removeEventListener("keydown", this.#onKeyDown);
    document.removeEventListener("keyup", this.#onKeyDown);
    document.removeEventListener("click", this.#onClick);
    document.removeEventListener("mousemove", this.#onMouseMove);
  }
}

form.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const nickname = formData.get("nickname");
    const gameplayMode = formData.get("gameplay_mode");

    if (!nickname || !gameplayMode) return;

    const app = new App(gameplayMode);
    app.player.nickname = nickname;
  },
  false
);

btnViewLeaderboard.addEventListener("click", () => {
  toggleElement(form);
  toggleElement(btnViewLeaderboard);

  const ol = document.createElement("ol");
  const btnBack = document.createElement("button");
  btnBack.classList.add("btn__back");
  btnBack.textContent = "Back";

  try {
    const scores = JSON.parse(localStorage.getItem("scores")) || [];

    scores.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = `${entry.nickname} - ${entry.score} points`;
      ol.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }

  root.appendChild(ol);
  root.appendChild(btnBack);

  btnBack.addEventListener("click", () => {
    root.removeChild(ol);
    root.removeChild(btnBack);
    toggleElement(form);
    toggleElement(btnViewLeaderboard);
  });
});
