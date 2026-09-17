// --- PARÁMETROS DE LAS ESCENAS FÍSICAS ---
const SCENE_PARAMS = [
  { rigidity: 0.15, restLength: 70,  damping: 0.85, agitation: 0.2 }, // Status Quo: Rígido
  { rigidity: 0.04, restLength: 130, damping: 0.92, agitation: 2.5 }, // Fricción: Inestable
  { rigidity: 0.08, restLength: 95,  damping: 0.90, agitation: 0.8 }, // Transferencia: Reorganización
  { rigidity: 0.12, restLength: 85,  damping: 0.95, agitation: 0.4 }  // Ventaja: Cohesión adaptable
];

let currentScene = 0;
let system;
let slides;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas-container');
  
  slides = document.querySelectorAll('.slide');
  system = new ParticleSystem(60);
  applyScene(currentScene);
}

function draw() {
  background(11, 13, 18);
  system.update();
  system.display();
}

// --- CLASES DEL SISTEMA DE PARTÍCULAS ---
class ParticleSystem {
  constructor(count) {
    this.nodes = [];
    this.springs = [];
    this.k = 0.1;
    this.restLength = 100;
    this.damping = 0.9;
    this.agitation = 0.5;

    for (let i = 0; i < count; i++) {
      let isYoung = i > count * 0.55;
      let mass = isYoung ? 1 : 3.5;
      // Posiciona más partículas a la derecha para dejar espacio al texto HTML
      let pos = createVector(
        random(width * 0.4, width * 0.9),
        random(height * 0.2, height * 0.8)
      );
      this.nodes.push(new Node(pos.x, pos.y, mass, isYoung));
    }
    this.rebuildConnections();
  }

  setParams(p) {
    this.k = p.rigidity;
    this.restLength = p.restLength;
    this.damping = p.damping;
    this.agitation = p.agitation;
  }

  rebuildConnections() {
    this.springs = [];
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        let d = dist(this.nodes[i].pos.x, this.nodes[i].pos.y, this.nodes[j].pos.x, this.nodes[j].pos.y);
        if (d < 170) {
          this.springs.push(new Spring(this.nodes[i], this.nodes[j]));
        }
      }
    }
  }

  update() {
    for (let node of this.nodes) {
      let randomForce = p5.Vector.random2D().mult(this.agitation * (node.isYoung ? 1.6 : 0.4));
      node.applyForce(randomForce);

      // Mantiene el centro de gravedad a la derecha
      let center = createVector(width * 0.65, height * 0.5);
      let centerForce = p5.Vector.sub(center, node.pos).mult(0.0002);
      node.applyForce(centerForce);
    }

    for (let spring of this.springs) {
      spring.update(this.k, this.restLength);
    }

    for (let node of this.nodes) {
      node.update(this.damping);
    }
  }

  display() {
    for (let spring of this.springs) spring.display();
    for (let node of this.nodes) node.display();
  }
}

class Node {
  constructor(x, y, mass, isYoung) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.mass = mass;
    this.isYoung = isYoung;
  }

  applyForce(force) {
    let f = p5.Vector.div(force, this.mass);
    this.acc.add(f);
  }

  update(damping) {
    this.vel.add(this.acc);
    this.vel.mult(damping);
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.pos.x = constrain(this.pos.x, width * 0.3, width - 60);
    this.pos.y = constrain(this.pos.y, 60, height - 60);
  }

  display() {
    noStroke();
    if (this.isYoung) {
      fill(0, 230, 200, 230);
      ellipse(this.pos.x, this.pos.y, 8, 8);
    } else {
      fill(245, 100, 70, 210);
      ellipse(this.pos.x, this.pos.y, 16, 16);
    }
  }
}

class Spring {
  constructor(nodeA, nodeB) {
    this.a = nodeA;
    this.b = nodeB;
  }

  update(k, restLength) {
    let force = p5.Vector.sub(this.b.pos, this.a.pos);
    let currentLength = force.mag();
    let delta = currentLength - restLength;
    force.normalize();
    force.mult(k * delta);

    this.a.applyForce(force);
    this.b.applyForce(force.mult(-1));
  }

  display() {
    let d = p5.Vector.dist(this.a.pos, this.b.pos);
    let alpha = map(d, 20, 220, 160, 15, true);
    strokeWeight(map(d, 20, 180, 2, 0.5, true));
    stroke(255, 255, 255, alpha);
    line(this.a.pos.x, this.a.pos.y, this.b.pos.x, this.b.pos.y);
  }
}

// --- NAVEGACIÓN Y SINCRONIZACIÓN ---
function applyScene(index) {
  // Sincroniza HTML
  slides.forEach((slide, i) => {
    if (i === index) slide.classList.add('active');
    else slide.classList.remove('active');
  });

  document.getElementById('progress').style.width = `${((index + 1) / slides.length) * 100}%`;

  // Sincroniza Parámetros Físicos
  if (system) {
    system.setParams(SCENE_PARAMS[index]);
    system.rebuildConnections();
  }
}

function nextSlide() {
  currentScene = (currentScene + 1) % slides.length;
  applyScene(currentScene);
}

function prevSlide() {
  currentScene = (currentScene - 1 + slides.length) % slides.length;
  applyScene(currentScene);
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW || keyCode === 32) nextSlide();
  if (keyCode === LEFT_ARROW) prevSlide();
}

function mousePressed() {
  nextSlide();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}