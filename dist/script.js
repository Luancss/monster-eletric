// Define uma função cross-browser para solicitar animações
window.requestAnimFrame = function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback);
    }
  );
};

// Função de inicialização do canvas
function init(elemid) {
  // Obtém o elemento do canvas e seu contexto 2D

  let canvas = document.getElementById(elemid),
    c = canvas.getContext("2d"),
    // Define a largura e altura do canvas como as dimensões da janela

    w = (canvas.width = window.innerWidth),
    h = (canvas.height = window.innerHeight);
  c.fillStyle = "rgba(30,30,30,1)";
  c.fillRect(0, 0, w, h);
  return { c: c, canvas: canvas };
}

// Evento que é acionado quando a página é totalmente carregada
window.onload = function () {
  // Inicializa o contexto e o canvas

  let c = init("canvas").c,
    canvas = init("canvas").canvas,
    // Obtém a largura e altura do canvas

    w = (canvas.width = window.innerWidth),
    h = (canvas.height = window.innerHeight),
    // Variáveis para armazenar a posição do mouse

    mouse = { x: false, y: false },
    last_mouse = {};

  // Função para calcular a distância entre dois pontos

  function dist(p1x, p1y, p2x, p2y) {
    return Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
  }

  // Classe que representa um segmento
  class segment {
    constructor(parent, l, a, first) {
      // Verifica se é o primeiro segmento

      this.first = first;
      if (first) {
        this.pos = {
          x: parent.x,
          y: parent.y
        };
      } else {
        // Caso contrário, a posição é a próxima posição do pai

        this.pos = {
          x: parent.nextPos.x,
          y: parent.nextPos.y
        };
      }
      // Comprimento, ângulo e próxima posição do segmento

      this.l = l;
      this.ang = a;
      this.nextPos = {
        x: this.pos.x + this.l * Math.cos(this.ang),
        y: this.pos.y + this.l * Math.sin(this.ang)
      };
    }

    // Atualiza a posição do segmento em direção a um alvo

    update(t) {
      this.ang = Math.atan2(t.y - this.pos.y, t.x - this.pos.x);
      this.pos.x = t.x + this.l * Math.cos(this.ang - Math.PI);
      this.pos.y = t.y + this.l * Math.sin(this.ang - Math.PI);
      this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
      this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
    }
    // Fallback: ajusta a posição do segmento para uma posição alternativa
    fallback(t) {
      this.pos.x = t.x;
      this.pos.y = t.y;
      this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
      this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
    }
    // Função para exibir o segmento
    show() {
      c.lineTo(this.nextPos.x, this.nextPos.y);
    }
  }

  // Classe que representa um tentáculo
  class tentacle {
    constructor(x, y, l, n, a) {
      this.x = x;
      this.y = y;
      this.l = l;
      this.n = n;
      this.t = {};
      this.rand = Math.random();
      this.segments = [new segment(this, this.l / this.n, 0, true)];
      for (let i = 1; i < this.n; i++) {
        this.segments.push(
          new segment(this.segments[i - 1], this.l / this.n, 0, false)
        );
      }
    }
    // Move o tentáculo em direção a um alvo

    move(last_target, target) {
      // Calcula o ângulo entre a posição atual do objeto e o destino
      this.angle = Math.atan2(target.y - this.y, target.x - this.x);
      this.dt = dist(last_target.x, last_target.y, target.x, target.y) + 5;
      // Calcula uma posição ajustada com base no tempo e no ângulo

      this.t = {
        x: target.x - 0.8 * this.dt * Math.cos(this.angle),
        y: target.y - 0.8 * this.dt * Math.sin(this.angle)
      };

      // Atualiza a posição do último segmento com base no ponto ajustado ou no destino
      if (this.t.x) {
        this.segments[this.n - 1].update(this.t);
      } else {
        this.segments[this.n - 1].update(target);
      }
      // Atualiza as posições dos segmentos restantes
      for (let i = this.n - 2; i >= 0; i--) {
        this.segments[i].update(this.segments[i + 1].pos);
      }
      // Verifica se o objeto está próximo o suficiente do destino
      if (
        dist(this.x, this.y, target.x, target.y) <=
        this.l + dist(last_target.x, last_target.y, target.x, target.y)
      ) {
        // Se sim, ajusta as posições dos segmentos para um estado alternativo (fallback)
        this.segments[0].fallback({ x: this.x, y: this.y });
        for (let i = 1; i < this.n; i++) {
          this.segments[i].fallback(this.segments[i - 1].nextPos);
        }
      }
    }
