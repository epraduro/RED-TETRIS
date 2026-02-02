function Grid({ grid, playerBag, mode }) {

  const getClass = (cell) => {
    if (cell === 0) {
      return "E";
    } else if (cell === 2) {
      return "B";
    } else {
        return cell;
    }
  };

  const isSquare = (piece) => {
    if (piece.color === "O") return true;
    return false;
  };

  return (
    <>
    <div className="flex flex-row h-full">
      {/* GRID */}
      <div className="grid bg-transparent border border-white h-full">
        {/* <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${grid[0].length}, 30px)`,
            gridTemplateRows: `repeat(${grid.length}, 30px)`,
          }}
        > */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${grid[0].length}, var(--cell-main))`,
            gridTemplateRows: `repeat(${grid.length}, var(--cell-main))`,
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
      {/* PREVIEW PIECES */}
      <div className="flex flex-col bg-[#00003c] pt-5 items-center border border-white w-[125px] min-w-[125px]">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(
            ${
              isSquare(playerBag[0])
                ? playerBag[0].shape.length + 1
                : playerBag[0].shape.length
            },
            var(--cell-preview)
          )`,
            gridTemplateRows: `repeat(${playerBag[0].shape[0].length}, var(--cell-preview))`,
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
          {Object.values(playerBag)
            .slice(1, 3)
            .map((piece, index) => {
              return (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${
                      isSquare(piece)
                        ? piece.shape.length + 1
                        : piece.shape.length
                    }, var(--cell-preview))`,
                    gridTemplateRows: `repeat(${piece.shape[0].length}, var(--cell-preview))`,
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
            })}
        </div>
      </div>
      </div>
    </>
  );
}

export default Grid;
