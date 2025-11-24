import { Piece } from './Piece.js'

export class Player {
  static DEFAULT_BAG = ["J", "L", "O", "T", "S", "Z", "I"];

  bag = [];
  currentPiece = null;

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

  constructor(name, ws) {
    this.name = name;
    this.newPiece();
    this.ws = ws
  }

  getNewBag() {
    const newArray = Array.from(Player.DEFAULT_BAG);
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    for (let i = 0; i < newArray.length; i++) {
      newArray[i] = new Piece(newArray[i]);
    }
    return newArray;
  }

  newPiece() {
    let newP = this.bag ? this.bag.shift() : null;
    if (this.bag.length <= 2) {
      let newBag = [...this.bag, ...this.getNewBag()];
      if (!newP) {
        this.currentPiece = newBag.shift();
      } else {
		this.currentPiece = newP
	  }
    }
  }

  undraw = () => {
    this.currentPiece?.shape.map((row, i) => {
      row.map((col, j) => {
        if (col !== 0) {
          this.grid[this.currentPiece.x + i][this.currentPiece.y + j] = 0;
        }
      });
    });
  };

  draw = () => {
    this.currentPiece?.shape.map((row, i) => {
      row.map((col, j) => {
        if (col !== 0) {
          this.grid[this.currentPiece.x + i][this.currentPiece.y + j] =
            currentPiece.color;
        }
      });
    });
  };

  collaps = (nx, ny, nshape = null) => {
    const shape = nshape ? nshape : this.currentPiece.shape;
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j] === 0) {
          continue;
        } else {
          const cx = this.currentPiece.shape.x + i + nx;
          const cy = this.currentPiece.shape.y + j + ny;
          // bas && droite && gauche
          if (cx >= grid.length || cy >= grid[0].length || cy < 0) {
            return true;
          }

          if (i + nx < shape.length && j + ny < shape[i].length) {
            if (shape[i + nx][j + ny] === 1) continue;
          }
          if (grid[cx][cy] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
