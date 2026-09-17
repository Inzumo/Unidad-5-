// ============================================================
// RELEVO — sistema de partículas con topología variable
// 5 estados narrativos alineados con el guion
// ============================================================

const SCENE_PARAMS = [
  // 0 — Rígido: Slides 1–2 (inercia de la tradición)
  { rigidity: 0.18, restLength: 65,  damping: 0.85, agitation: 0.15 },
  // 1 — Fluido: Slides 3–4 (la universidad se abre al mundo)
  { rigidity: 0.10, restLength: 95,  damping: 0.88, agitation: 0.6 },
  // 2 — Impacto / comunidad: Slides 5–6
  { rigidity: 0.06, restLength: 110, damping: 0.90, agitation: 1.4 },
  // 3 — Fricción / transferencia: Slides 7–10
  { rigidity: 0.04, restLength: 130, damping: 0.92, agitation: 2.5 },
  // 4 — Adaptable / cohesión: Slides 11–13
  { rigidity: 0.12, restLength: 85,  damping: 0.95, agitation: 0.4 }
];

let currentScene = 0;
let system;
let slides;

function setup() {
  const contenedor = document.getElementById('canvas-container');
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(contenedor);

  slides = document.querySelectorAll('.slide');
  system = new ParticleSystem(70);
  applyScene(currentScene);
}

function draw() {
  background(20, 20, 20);
  system.update();
  system.display();
}

// ---------- SISTEMA ----------
class ParticleSystem {
  constructor(count) {
    this.nodes = [];
    this.springs = [];
    this.k = 0.1;
    this.restLength = 100;
    this.damping = 0.9;
    this.agitation = 0.5;

    for (let i = 0; i < count; i++) {
      const isYoung = i > count * 0.55;
      const mass = isYoung ? 1 : 3.5;
      const pos = createVector(
        random(width * 0.35, width * 0.95),
        random(height * 0.15, height * 0.85)
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
        const d = dist(
          this.nodes[i].pos.x, this.nodes[i].pos.y,
          this.nodes[j].pos.x, this.nodes[j].pos.y
        );
        if (d < 170) {
          this.springs.push(new Spring(this.nodes[i], this.nodes[j]));
        }
      }
    }
  }

  update() {
    for (const node of this.nodes) {
      const rf = p5.Vector.random2D().mult(
        this.agitation * (node.isYoung ? 1.6 : 0.4)
      );
      node.applyForce(rf);

      // Fuerza suave hacia el centro del sistema
      const center = createVector(width * 0.68, height * 0.5);
      const cf = p5.Vector.sub(center, node.pos).mult(0.0002);
      node.applyForce(cf);
    }

    for (const spring of this.springs) {
      spring.update(this.k, this.restLength);
    }

    for (const node of this.nodes) {
      node.update(this.damping);
    }
  }

  display() {
    for (const spring of this.springs) spring.display();
    for (const node of this.nodes) node.display();
  }
}

// ---------- NODO ----------
class Node {
  constructor(x, y, mass, isYoung) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.mass = mass;
    this.isYoung = isYoung;
  }

  applyForce(force) {
    const f = p5.Vector.div(force, this.mass);
    this.acc.add(f);
  }

  update(damping) {
    this.vel.add(this.acc);
    this.vel.mult(damping);
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.pos.x = constrain(this.pos.x, width * 0.28, width - 60);
    this.pos.y = constrain(this.pos.y, 60, height - 60);
  }

  display() {
    noStroke();
    if (this.isYoung) {
      fill(0, 230, 200, 220);
      ellipse(this.pos.x, this.pos.y, 7, 7);
    } else {
      fill(198, 93, 59, 200);
      ellipse(this.pos.x, this.pos.y, 15, 15);
    }
  }
}

// ---------- RESORTE ----------
class Spring {
  constructor(nodeA, nodeB) {
    this.a = nodeA;
    this.b = nodeB;
  }

  update(k, restLength) {
    const force = p5.Vector.sub(this.b.pos, this.a.pos);
    const currentLength = force.mag();
    const delta = currentLength - restLength;
    force.normalize();
    force.mult(k * delta);

    this.a.applyForce(force);
    this.b.applyForce(force.mult(-1));
  }

  display() {
    const d = p5.Vector.dist(this.a.pos, this.b.pos);
    const alpha = map(d, 20, 220, 140, 12, true);
    strokeWeight(map(d, 20, 180, 1.6, 0.4, true));
    stroke(242, 237, 228, alpha);
    line(this.a.pos.x, this.a.pos.y, this.b.pos.x, this.b.pos.y);
  }
}

// ---------- NAVEGACIÓN ----------
function applyScene(index) {
  slides.forEach((slide, i) => {
    if (i === index) slide.classList.add('active');
    else slide.classList.remove('active');
  });

  const progress = document.getElementById('progress');
  if (progress) {
    progress.style.width = `${((index + 1) / slides.length) * 100}%`;
  }

  const sceneAttr = slides[index].getAttribute('data-scene');
  const sceneIndex = sceneAttr ? parseInt(sceneAttr, 10) : 0;

  if (system) {
    system.setParams(SCENE_PARAMS[sceneIndex]);
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
  if (keyCode === RIGHT_ARROW || keyCode === 32) {
    nextSlide();
    return false;
  }
  if (keyCode === LEFT_ARROW) {
    prevSlide();
    return false;
  }
  if (key === 'f' || key === 'F') {
    fullscreen(!fullscreen());
  }
}

function mousePressed() {
  nextSlide();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}