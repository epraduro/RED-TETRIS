export class Piece {
  static shapes = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    O: [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
  }

  constructor(type) {
    this.shape = Piece.shapes[type];
    this.color = type;
    this.x = 0;
    this.y = 3;
  }

  rotateMatrix90 = () => {
    const n = this.shape.length;
    let rotated = Array.from({ length: n }, () => Array(n).fill(0));
  
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        rotated[j][n - 1 - i] = this.shape[i][j];
      }
    }
    return rotated
  }

  // movePiece = (x, y) => {
  //   if (this.shape) {
  //     if (!collaps(x, y)) {
  //       undraw();
  //       this.shape.x = this.shape.x + x;
  //       this.shape.y = this.shape.y + y;
  //       draw();
  //       return true;
  //     }
  //   }
  //   return false;
  // }
}