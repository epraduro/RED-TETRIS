import { Piece } from './Piece.js'

export class Player {
  static DEFAULT_BAG = ["J", "L", "O", "T", "S", "Z", "I"];
  // static DEFAULT_BAG = ["I", "I", "I", "I", "I", "I", "I"];

  currentPiece = null;
  bag = [];
  lose = false;
  name;
  rand;

  grid = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  constructor(name, ws, rand = undefined) {
    this.name = name;
    this.ws = ws
    this.rand = rand ?? Math.random
    this.newPiece()
  }

  getNewBag() {
    const newArray = Array.from(Player.DEFAULT_BAG);
    for (let i = 0; i < newArray.length; i++) {
      newArray[i] = new Piece(newArray[i]);
    }
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    for (const p of newArray) {
      this.bag.push(p)
    }
  }

  newPiece() {
    if (this.bag.length <= 2) this.getNewBag()
    this.currentPiece = this.bag.shift();
    console.log("new")
    this.draw()
  }

  undraw() {
    let x = 0
    for (const row of this.currentPiece?.shape) {
      if (row.every(v => v === 0)) continue
      let y = 0
      for (const c of row) {
        if (c !== 0) {
          this.grid[this.currentPiece.x + x][this.currentPiece.y + y] = 0
        }
        y++
      }
      x++;
    }
  };

  draw() {
    let x = 0
    for (const row of this.currentPiece?.shape) {
      if (row.every(v => v === 0)) continue
      let y = 0
      for (const c of row) {
        if (c !== 0) {
          this.grid[this.currentPiece.x + x][this.currentPiece.y + y] =
            this.currentPiece.color;
        }
        y++
      }
      x++;
    }
  };

  next() {
    this.movePiece(1, 0)
    return !this.lose
  }

  goNext() {
    this.removefilled();
    if (this.grid[0].some((v) => v !== 0)) {
      this.lose = true
    } else {
      this.newPiece();
    }
    this.update();
  }

  movePiece(x, y) {
    if (this.currentPiece && !this.lose) {
      this.undraw();
      const collide = this.collaps(x, y)
      if (!collide) {
        this.currentPiece.x = this.currentPiece.x + x;
        this.currentPiece.y = this.currentPiece.y + y;
        this.draw()
      } else {
        if (x >= 1) {
          this.draw();
          this.goNext();
          this.update()
          return !collide
        }
      }
      this.draw()
      this.update()
      return !collide
    }
    return false;
  };

  collaps(nx, ny, nshape = null) {
    const shape = nshape ? nshape : this.currentPiece.shape;
    
    let x = 0;
    for (const row of shape) {
      let y = 0;
      if (row.every(v => v === 0)) continue
      for (const c of row) {
        if (c !== 0) {
          const cx = this.currentPiece.x + x + nx;
          const cy = this.currentPiece.y + y + ny;

          // bas
          if (cx >= this.grid.length) {
            return true;
          }
          // droite && gauche
          if (cy >= this.grid[0].length || cy < 0) {
            return true;
          }
          // piece
          if (this.grid[cx][cy] !== 0) {
            return true;
          }
        }
        y++;
      }
      x++;
    }
    return false;
  }

  removefilled() {
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i].every(v => v !== 0)) {
        this.grid.splice(i, 1)
        this.grid.splice(0, 0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
      }
    }
  }

  async update() {
    await this.ws.send(JSON.stringify({type: 'updateMove', data: {
      grid: this.grid,
      bag: this.bag,
      lose: this.lose,
    }}))
  }

  drawRotatedPiece() {
    if (this.currentPiece && !this.lose) {
      this.undraw();
      let rotated = this.currentPiece.rotateMatrix90()
      if (!this.collaps(0, 0, rotated)) {
        this.currentPiece.shape = rotated;
      }
      this.draw()
      this.update()
    }
  }

  printShape(shape = []) {
    for (const row of shape) {
      console.log(row.join(' '))
    }
  }

  losing() {
    this.lose = true;
  }
}
