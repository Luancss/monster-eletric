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
    // Função para exibir o tentáculo, com efeitos de luz
    show(target) {
      // Verifica se a distância entre o tentáculo e o alvo é menor ou igual ao comprimento do tentáculo
      if (dist(this.x, this.y, target.x, target.y) <= this.l) {
        // Define o modo de composição global para "lighter"
        c.globalCompositeOperation = "lighter";
        // Inicia o caminho
        c.beginPath();
        // Move para a posição inicial do tentáculo
        c.lineTo(this.x, this.y);

        // Exibe cada segmento do tentáculo
        for (let i = 0; i < this.n; i++) {
          this.segments[i].show();
        }

        // Configuração de estilos para o desenho do tentáculo
        c.strokeStyle =
          "hsl(" +
          (this.rand * 60 + 180) +
          ",100%," +
          (this.rand * 60 + 25) +
          "%)";
        c.lineWidth = this.rand * 2;
        c.lineCap = "round";
        c.lineJoin = "round";
        // Desenha o tentáculo
        c.stroke();

        // Restaura o modo de composição global para "source-over"
        c.globalCompositeOperation = "source-over";
      }
    }

    // Função para exibir uma forma circular em torno do tentáculo
    show2(target) {
      // Inicia o caminho
      c.beginPath();
      // Verifica se a distância entre o tentáculo e o alvo é menor ou igual ao comprimento do tentáculo
      if (dist(this.x, this.y, target.x, target.y) <= this.l) {
        // Desenha um círculo branco ao redor do tentáculo
        c.arc(this.x, this.y, 2 * this.rand + 1, 0, 2 * Math.PI);
        c.fillStyle = "white";
        // Desenha um círculo de cor escura ao redor do tentáculo
      } else {
        c.arc(this.x, this.y, this.rand * 2, 0, 2 * Math.PI);
        c.fillStyle = "darkcyan";
      }
      // Preenche a forma
      c.fill();
    }
  }
  // Constantes para configuração dos tentáculos
  let maxl = 300,     // Comprimento máximo do tentáculo
    minl = 50,      // Comprimento mínimo do tentáculo
    n = 30,         // Número de segmentos em cada tentáculo
    numt = 500,     // Número de tentáculos
    tent = [],      // Array para armazenar objetos de tentáculo
    clicked = false, // Sinalizador para rastrear clique do mouse
    target = { x: 0, y: 0 }, // Posição alvo para os tentáculos
    last_target = {}, // Última posição alvo registrada
    t = 0,          // Variável para o tempo de animação
    q = 10;         // Variável usada nos cálculos de animação

  // Inicializa objetos de tentáculo com posições, comprimentos e ângulos aleatórios
  for (let i = 0; i < numt; i++) {
    tent.push(
      new tentacle(
        Math.random() * w,
        Math.random() * h,
        Math.random() * (maxl - minl) + minl,
        n,
        Math.random() * 2 * Math.PI
      )
    );
  }

  // Função para desenhar a animação no canvas
  function draw() {
    // Atualiza a posição alvo com base no movimento do mouse ou um padrão animado
    if (mouse.x) {
      target.errx = mouse.x - target.x;
      target.erry = mouse.y - target.y;
    } else {
      // Padrão animado quando o mouse não é movido
      target.errx =
        w / 2 +
        ((h / 2 - q) * Math.sqrt(2) * Math.cos(t)) /
        (Math.pow(Math.sin(t), 2) + 1) -
        target.x;
      target.erry =
        h / 2 +
        ((h / 2 - q) * Math.sqrt(2) * Math.cos(t) * Math.sin(t)) /
        (Math.pow(Math.sin(t), 2) + 1) -
        target.y;
    }

    // Atualiza suavemente a posição alvo
    target.x += target.errx / 10;
    target.y += target.erry / 10;

    // Incrementa a variável de tempo para o padrão de animação
    t += 0.01;

    // Desenha um círculo ao redor da posição alvo com um raio dinamicamente alterado
    c.beginPath();
    c.arc(
      target.x,
      target.y,
      dist(last_target.x, last_target.y, target.x, target.y) + 5,
      0,
      2 * Math.PI
    );
    c.fillStyle = "hsl(210,100%,80%)";
    c.fill();

    // Move e exibe cada tentáculo
    for (i = 0; i < numt; i++) {
      tent[i].move(last_target, target);
      tent[i].show2(target);
    }
    for (i = 0; i < numt; i++) {
      tent[i].show(target);
    }

    // Registra a posição alvo atual para o próximo quadro
    last_target.x = target.x;
    last_target.y = target.y;
  }

  // Event listeners para interações com o mouse
  canvas.addEventListener(
    "mousemove",
    function (e) {
      last_mouse.x = mouse.x;
      last_mouse.y = mouse.y;

      mouse.x = e.pageX - this.offsetLeft;
      mouse.y = e.pageY - this.offsetTop;
    },
    false
  );

  canvas.addEventListener("mouseleave", function (e) {
    mouse.x = false;
    mouse.y = false;
  });

  canvas.addEventListener(
    "mousedown",
    function (e) {
      clicked = true;
    },
    false
  );

  canvas.addEventListener(
    "mouseup",
    function (e) {
      clicked = false;
    },
    false
  );

  // Função de loop de animação
  function loop() {
    window.requestAnimFrame(loop);
    // Limpa o canvas e redesenha a animação
    c.clearRect(0, 0, w, h);
    draw();
  }

  // Event listener para redimensionamento da janela
  window.addEventListener("resize", function () {
    (w = canvas.width = window.innerWidth),
      (h = canvas.height = window.innerHeight);
    loop();
  });

  // Chamada inicial para o loop de animação
  loop();

  // Chamada adicional para manter uma taxa de quadros consistente
  setInterval(loop, 1000 / 60);
};