function OpponentGrid({ grid, playerName }) {
  // console.log("oppoGrid:", grid);

  const getClass = (cell) => {
    if (cell === 0) {
      return "E";
    } else if (cell === 2) {
      return "B";
    } else {
      for (let i = 0; i < grid[0].length; i++) {
        let colored = false;
        for (let j = 0; j < grid.length; j++) {
          if (grid[j][i] !== 0) {
            grid[j][i] = "G";
            colored = true;
          }
          if (colored) grid[j][i] = "G";
        }
      }
    }
  };

  return (
      <div className="inline-flex flex-col items-center">
        <h1> {playerName} </h1>
        {/* GRID */}
        <div className="grid bg-transparent border border-white">
		  <div
		  	style={{
				display: "grid",
				gridTemplateColumns: `repeat(${grid[0].length}, var(--cell-opponent))`,
				gridTemplateRows: `repeat(${grid.length}, var(--cell-opponent))`,
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
      </div>
  );
}

export default OpponentGrid;
