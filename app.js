"use strict";
const canvas = document.getElementById("game-canvas");
/** @type {CanvasRenderingContext2D} */
const canvasContext = canvas.getContext("2d");

const FPS = 30;
const ASTEROIDS_COUNT = 5;
const ASTEROIDS_MAX_LIVES = 4;
const PLAYER_MAX_LIVES = 3;

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
  canvasContext.font = `${fontSize}px Arial`;
  canvasContext.fillStyle = color;
  canvasContext.textAlign = align;
  canvasContext.fillText(text, x, y);
};

class Player {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.rotation = 0;
    this.rotationSpeed = 360;
    this.size = 30;
    this.radius = this.size / 2;
    this.angle = (90 / 180) * Math.PI;
    this.strokeColor = "white";
    this.isThrusting = false;
    this.thrustX = 0;
    this.thrustY = 0;
    this.thrustAcceleration = 5;
    this.friction = 0.99;
    this.lives = PLAYER_MAX_LIVES;
    this.hasImmunity = false;
  }

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

  /** @param {number} direction */
  rotate(direction) {
    if (!direction || typeof direction !== "number") {
      this.rotation = 0;
      return;
    }

    this.rotation = (((this.rotationSpeed * direction) / 180) * Math.PI) / FPS;
    this.angle += this.rotation;
  }

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
      // this.thrustX -= (this.friction * this.thrustX) / FPS;
      // this.thrustY -= (this.friction * this.thrustY) / FPS;
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
}

class Asteroid {
  constructor(id) {
    this.id = id;
    this.setCoords();
    this.speed = 100;
    this.size = 50;
    this.color = `rgb(${1 + Math.random() * 254}, ${1 + Math.random() * 254}, ${
      1 + Math.random() * 254
    })`;
    this.lives = Math.ceil(Math.random() * ASTEROIDS_MAX_LIVES);
    this.velocityX =
      ((Math.random() * this.speed) / FPS) * (Math.random() < 0.5 ? 1 : -1);
    this.velocityY =
      ((Math.random() * this.speed) / FPS) * Math.random() < 0.5 ? 1 : -1;
    this.radius = (this.size * this.lives) / 2;
    this.angle = Math.random() * Math.PI * 2;
    // while (
    //   distanceBetweenPoints(
    //     canvas.width / 2,
    //     canvas.height / 2,
    //     this.x,
    //     this.y
    //   ) <
    //     this.size * 2 + this.radius ||
    //   this.#isOffXBounds() ||
    //   this.#isOffYBounds()
    // ) {
    //   this.#setCoords();
    // }
  }

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

  setCoords() {
    this.x = Math.floor(Math.random() * canvas.width);
    this.y = Math.floor(Math.random() * canvas.height);
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

  constructor() {
    console.log("initializing game...");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.player = new Player();

    for (let i = 0; i < ASTEROIDS_COUNT; i++) {
      this.asteroids.push(new Asteroid(i));
    }

    this.#addEventListeners();
    this.#drawAsteroids();

    this.interval = setInterval(() => this.#update(), 1000 / FPS);

    this.#checkInitialCollisions();
  }

  #update() {
    console.log("updating game...");
    this.#setCanvasContext();
    this.player.draw();
    this.player.thrust();
    this.#drawAsteroids();
    this.#setStats();
    this.#checkGameOver();
  }

  #setCanvasContext() {
    canvasContext.fillStyle = "#0e0836";
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);
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

  #addEventListeners() {
    document.addEventListener("keydown", this.#onKeyDown);
    document.addEventListener("keyup", this.#onKeyUp);
  }

  #removeEventListeners() {
    document.removeEventListener("keydown", this.#onKeyDown);
    document.removeEventListener("keyup", this.#onKeyDown);
  }

  #drawAsteroids() {
    this.asteroids.forEach((asteroid) => {
      asteroid.draw();
      this.#checkCollisions(asteroid);
    });
  }

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

  /** @param {Asteroid} asteroid */
  #getCollidingAsteroid(asteroid) {
    return this.asteroids.find(
      (a) =>
        a.id !== asteroid.id &&
        distanceBetweenPoints(a.x, a.y, asteroid.x, asteroid.y) <
          a.radius + asteroid.radius
    );
  }

  /** @param {Asteroid} asteroid */
  #checkCollisions(asteroid) {
    const collidingAsteroid = this.#getCollidingAsteroid(asteroid);

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
        this.player.x = canvas.width / 2;
        this.player.y = canvas.height / 2;
        this.player.hasImmunity = true;
        setTimeout(() => {
          this.player.hasImmunity = false;
        }, 3000);
      }
    }
  }

  #checkGameOver() {
    if (this.player.lives <= 0) {
      this.asteroids.forEach((asteroid) => {
        asteroid.velocityX = 0;
        asteroid.velocityY = 0;

        this.#removeEventListeners();

        clearInterval(this.interval);

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
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
});
