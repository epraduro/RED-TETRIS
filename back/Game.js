
export class Game {

  loser = 0;

  constructor(id, name, owner, status, mode) {
    this.id = id;
    this.name = name;
    this.players = [];
    this.owner = owner;
    this.status = status;
    this.loop = null;
    this.starting = false;
    this.mode = mode;
    this.seed = new Date().getTime();
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
      for (const player of this.players) {
        if (player.currentPiece !== null && player.lose !== true) {
          if (!player.next()) continue;
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
        }
      }
      if (this.players.length === 1) {
        if (this.players[0].lose) {
          this.finish();
        }
      } else {
        const losers = this.players.filter((p) => p.lose);
        if (losers.length === this.players.length - 1) {
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
          score: player.score,
          opponentGrid: player.opponentGrid
        })
    );
    return {
      id: this.id,
      name: this.name,
      playerCount: this.players.length,
      players,
      status: this.status,
      owner: this.owner,
      mode: this.mode,
    };
  }

  broadcast(type, payload) {
    const { message, data } = payload;
    this.players.forEach((player) => {
      if (player.socket && player.socket.connected) {
        player.socket.emit(type, { message, data });
      }
    });
  }

  iscrazyMode() {
    if (this.mode === 'crazyMode') {
      return true;
    }
    return false;
  }

  start() {
    console.log("-------------------------------");
    this.starting = true;
    this.playerFailed = [];
    this.loop = setInterval(() => {
      this.update();
      this.broadcast("update", { data: this.forSend() });
    }, this.iscrazyMode() ? 100 : 600);
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
    this.playerFailed = [];
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
