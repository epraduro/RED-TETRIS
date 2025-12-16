import { useState } from "react";


function Grid({grid, bag}) {
  return (
    <>
      <div className="grid bg-transparent border border-white">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${grid[0].length}, 30px)`,
            gridTemplateRows: `repeat(${grid.length}, 30px)`
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                className={`${cell === 0 ? "E" : cell} border-[0.5px] border-black`}
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