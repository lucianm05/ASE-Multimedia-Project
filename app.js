"use strict";
const canvas = document.getElementById("game-canvas");
/** @type {CanvasRenderingContext2D} */
const canvasContext = canvas.getContext("2d");

const FPS = 30;
const ASTEROIDS_COUNT = 5;
const ASTEROIDS_MAX_LIVES = 4;

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
  constructor() {
    this.#setCoords();
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
    while (
      distanceBetweenPoints(
        canvas.width / 2,
        canvas.height / 2,
        this.x,
        this.y
      ) <
        this.size * 2 + this.radius ||
      this.#isOffXBounds() ||
      this.#isOffYBounds()
    ) {
      this.#setCoords();
    }
  }

  draw() {
    canvasContext.beginPath();
    canvasContext.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    canvasContext.fillStyle = this.color;
    canvasContext.closePath();
    canvasContext.fill();

    canvasContext.font = "20px Arial";
    canvasContext.fillStyle = "white";
    canvasContext.textAlign = "center";
    canvasContext.fillText(this.lives, this.x, this.y);

    if (this.#isOffXBounds()) {
      this.velocityX *= -1;
    }

    if (this.#isOffYBounds()) {
      this.velocityY *= -1;
    }

    this.x += this.velocityX;
    this.y += this.velocityY;

    // if (this.x < 0 - this.radius) {
    //   this.x = canvas.width + this.radius;
    // } else if (this.x > 0 - this.radius) {
    //   this.x = 0 - this.radius;
    // }

    // if(this.y < 0 - this.radius) {

    // }
  }

  #setCoords() {
    this.x = Math.floor(Math.random() * canvas.width);
    this.y = Math.floor(Math.random() * canvas.height);
  }

  #isOffXBounds() {
    return this.x + this.radius > canvas.width || this.x - this.radius < 0;
  }

  #isOffYBounds() {
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
      this.asteroids.push(new Asteroid());
    }

    this.#initListeners();
    this.#drawAsteroids();

    setInterval(() => this.#update(), 1000 / FPS);
  }

  #update() {
    console.log("updating game...");
    this.#setCanvasContext();
    this.player.draw();
    this.player.thrust();
    this.#drawAsteroids();
  }

  #initListeners() {
    document.addEventListener("keydown", (event) => {
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
    });

    document.addEventListener("keyup", (event) => {
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
    });
  }

  #setCanvasContext() {
    canvasContext.fillStyle = "#0e0836";
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);
  }

  #drawAsteroids() {
    this.asteroids.forEach((asteroid) => {
      asteroid.draw();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
});
