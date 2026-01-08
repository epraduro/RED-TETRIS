export class Game {
  constructor(id, name, owner, status) {
    this.id = id;
    this.name = name;
    this.players = [];
    this.owner = owner;
    this.status = status;
    this.loop = null;
    this.starting = false;
    this.loser = 0;
    this.seed = new Date().getTime();
    this.playerFailed = [];
  }

  createRand() {
    let s = this.seed % 2147483647;
    if (s <= 0) {
      s += 2147483646;
    }
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  update() {
    if (this.starting) {
      this.players.forEach((player) => {
        if (player.currentPiece !== null && player.lose !== true) {
          if (!player.next()) {
            this.loser++;
          }
          if (player.bonus > 1) {
            this.players.forEach((p) => {
              if (p.name !== player.name) {
                for (let i = 0; i != player.bonus - 1; i++) {
                  p.addMalus();
                }
              }
            });
            player.bonus = 0;
          }
        } else if (
          player.currentPiece !== null &&
          player.lose === true &&
          this.players.length < 3
        ) {
          if (!this.playerFailed.includes(player.name)) {
            this.playerFailed.push(player.name);
            this.loser++;
          }
        }
      });
      if (this.players.length === 1) {
        if (this.loser === 1) {
          this.finish();
        }
      } else {
        if (this.loser === this.players.length - 1) {
          this.finish();
        }
      }
    }
  }

  forSend() {
    const players = {};
    this.players.forEach(
      (player) =>
        (players[player.name] = {
          grid: player.grid,
          bag: player.bag,
          lose: player.lose,
          opponentGrid: player.opponentGrid
        })
    );
    return {
      players,
      status: this.status,
      owner: this.owner,
    };
  }

  broadcast(type, payload) {
    const { message, data } = payload;
    this.players.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify({ type, message, data }));
      }
    });
  }

  start() {
    this.starting = true;
    this.loop = setInterval(() => {
      this.update();
      this.broadcast("update", { data: this.forSend() });
    }, 800);
  }

  finish() {
    this.status = "finished";
    clearInterval(this.loop);
    this.broadcast("finished", { data: this.forSend() });
  }

  restart() {
    this.status = "waiting";
    this.seed = new Date().getTime();
    this.loser = 0;
    for (const p of this.players) {
      for (const row of p.grid) {
        row.fill(0, 0, 10);
      }
      p.lose = false;
      p.rand = this.createRand();
      p.bag = [];
      p.newPiece();
    }
    this.broadcast("waiting", { data: this.forSend() });
  }
}
