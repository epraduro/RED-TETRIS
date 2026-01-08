function Grid({ grid, playerBag, w, h }) {
  console.log("playerbag:", playerBag);

  const getClass = (cell) => {
    if (cell === 0) {
      return "E";
    } else if (cell === 2) {
      return "B";
    } else {
      return cell;
    }
  };

  return (
    <>
      {/* PREVIEW PIECES */}
      <div className="flex flex-col bg-[#00003c] h-[300px] w-[125px] pt-5 items-center border border-white">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${playerBag[0].shape.length}, 25px)`,
            gridTemplateRows: `repeat(${playerBag[0].shape[0].length}, 25px)`,
          }}
        >
          {playerBag[0].shape.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                className={`${
                  cell === 0 ? "transparent" : playerBag[0].color
                  } border-[0.5px] border-[#00003c]`}
                key={`${rowIndex}-${colIndex}`}
              />
            ))
          )}
        </div>
        <div className="flex flex-col items-center">
          {Object.values(playerBag).slice(1, 3).map((piece) => {
              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${piece.shape.length}, 25px)`,
                    gridTemplateRows: `repeat(${piece.shape[0].length}, 25px)`,
                  }}
                >
                  {piece.shape.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <div
                        className={`${
                          cell === 0 ? "transparent" : "N"
                          } border-[0.5px] border-[#00003c]`}
                        key={`${rowIndex}-${colIndex}`}
                      />
                    ))
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>
      {/* GRID */}
      <div className="grid bg-transparent border border-white">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${grid[0].length}, ${w})`,
            gridTemplateRows: `repeat(${grid.length}, ${h})`,
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                className={`${getClass(cell)} border-[0.5px] border-black`}
                key={`${rowIndex}-${colIndex}`}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default Grid;
