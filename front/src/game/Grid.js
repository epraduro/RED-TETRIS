import { useEffect, useState } from "react";
import { showToast } from "../Toasts";

const REFRESH = 1000;

function Grid() {
  const pieces = {
    I: {
      shape: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      color: "I",
    },
    O: {
      shape: [
        [1, 1],
        [1, 1],
      ],
      color: "O",
    },
    J: {
      shape: [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
      color: "J",
    },
    T: {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      color: "T",
    },
    L: {
      shape: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      color: "L",
    },
    S: {
      shape: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      color: "S",
    },
    Z: {
      shape: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      color: "Z",
    },
  };

  const [grid, setGrid] = useState([
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
  ]);


  const bag = ["J", "L", "O", "T", "S", "Z", "I"];
  const [playerBag, setPlayerBag] = useState([]);
  const [start, setStart] = useState(false);
  const [end, setEnd] = useState(false);
  
  function rotateMatrix90() {
    const n = currentPiece.shape.length;
    let rotated = Array.from({ length: n }, () => Array(n).fill(0));
  
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        rotated[j][n - 1 - i] = currentPiece.shape[i][j];
      }
    }

    if (!collaps(0, 0, rotated)) {
      undraw()
      currentPiece.shape = rotated;
      draw()
    }
  }

  function getNewBag() {
    const newArray = Array.from(bag);
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  function newPiece() {
    let newP = playerBag ? playerBag.shift() : null;
    if (playerBag.length <= 2) {
      const newBag = [...playerBag, ...getNewBag()]
      if (!newP) {
        newP = newBag.shift()
      }
      setPlayerBag(prevState => [...newBag])
    }
    setCurrentPiece(prevState => {
      return {
        ...pieces[newP],
        x: 0,
        y: 3
      }
    })
  }

  const [currentPiece, setCurrentPiece] = useState(null);

  const movePiece = (x, y) => {
    if (currentPiece) {
      if (!collaps(x, y)) {
        undraw()
        currentPiece.x = currentPiece.x + x;
        currentPiece.y = currentPiece.y + y
        draw()
        return true
      }
    }
    return false
  }

  const collaps = (nx, ny, nshape = null) => {
    const shape = nshape ? nshape : currentPiece.shape;
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j] === 0) {
          continue
        } else {
          const cx = currentPiece.x + i + nx
          const cy = currentPiece.y + j + ny
          // bas && droite && gauche
          if (cx >= grid.length || cy >= grid[0].length || cy < 0) {
            return true
          }

          if (i + nx < shape.length && j + ny < shape[i].length) {
            if (shape[i + nx][j + ny] === 1) continue
          }
          if (grid[cx][cy] !== 0) {
            return true
          }
        }
      }
    }
    return false
  }

  const update = () => {
    if (start && currentPiece !== null) {
      if (!movePiece(1, 0)) {
        if (grid[0].some((v) => v !== 0)) {
          showToast("error", "GAME OVER");
          setStart(false)
        } else newPiece()
      }
    }
  };

  const undraw = () => {
    currentPiece?.shape.map((row, i) => {
      row.map((col, j) => {
        if (col !== 0) {
          grid[currentPiece.x + i][currentPiece.y + j] = 0;
        }
      });
    });
    setGrid([...grid]);
  };

  const draw = () => {
    currentPiece?.shape.map((row, i) => {
      row.map((col, j) => {
        if (col !== 0) {
          grid[currentPiece.x + i][currentPiece.y + j] = currentPiece.color;
        }
      });
    });
    setGrid([...grid]);
  };

  const keydown = (e) => {
    if (e.code === 'Space') {
      setStart(true)
    }
    else if (e.code === 'ArrowRight') {
      movePiece(0, 1)
    }
    else if (e.code === 'ArrowLeft') {
      movePiece(0, -1)
    }
    else if (e.code === 'ArrowDown') {
      movePiece(1, 0)
    }
    else if (e.code === 'ArrowUp') {
      rotateMatrix90()
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", keydown)
    draw();
    const iter = setInterval(() => {
      update();
    }, REFRESH);
    return () => {
      clearInterval(iter);
      document.removeEventListener("keydown", keydown)
    }
  }, [currentPiece, start, playerBag]);

  useEffect(() => {
    if (!currentPiece) newPiece();
  }, []);

  return (
    <>
      <div className="grid bg-transparent border border-black">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${grid[0].length}, 20px)`,
            gridTemplateRows: `repeat(${grid.length}, 20px)`,
            gap: "1px",
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                className={cell === 0 ? "E" : cell}
                key={`${rowIndex}-${colIndex}`}
                style={{
                  width: "20px",
                  height: "20px",
                  border: "1px solid rgba(0, 0, 0, 0.2)",
                }}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default Grid;
