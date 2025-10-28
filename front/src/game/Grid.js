import GeneratePiece from "./GeneratePiece";
import { useEffect, useState } from "react";
import GenerateGrid from "./GenerateGrid";

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
      color: "cyan",
    },
    O: {
      shape: [
        [1, 1],
        [1, 1],
      ],
      color: "yellow",
    },
    J: {
      shape: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      color: "J",
    },
    T: {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      color: "purple",
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
      color: "green",
    },
    Z: {
      shape: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      color: "red",
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
  const playerBag = [];

  function getNewBag() {
    const newArray = Array.from(bag);
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    console.log(newArray);
    return newArray;
  }

  function newPiece() {
    if (playerBag.length <= 2) {
      playerBag.push(...getNewBag());
    }
    setCurrentPiece(prevState => {
      return {
        ...pieces[playerBag.shift()],
        x: 0,
        y: 0
      }
    })
  }

  const [currentPiece, setCurrentPiece] = useState(null);

  const update = () => {
    undraw();
    if (currentPiece !== null) {
      currentPiece.x = currentPiece.x + 1;
    }
    draw();
  };

  const undraw = () => {
    currentPiece?.shape.map((row, i) => {
      row.map((col, j) => {
        if (col !== 0) {
          grid[currentPiece.x + i][currentPiece.y + j] = "E";
        }
      });
    });
    setGrid([...grid]);
  };

  const draw = () => {
    console.log(currentPiece);
    currentPiece?.shape.map((row, i) => {
      row.map((col, j) => {
        if (col !== 0) {
          grid[currentPiece.x + i][currentPiece.y + j] = currentPiece.color;
        }
      });
    });
    setGrid([...grid]);
  };

  useEffect(() => {
    const iter = setInterval(() => {
      update();
    }, REFRESH);
    return () => clearInterval(iter);
  }, [currentPiece]);

  useEffect(() => {
    newPiece();
  }, []);

  useEffect(() => {
    draw();
  }, [currentPiece])

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
