import React from 'react';

const GenerateGrid = (props) => {
  const color = "gray"

  if (!props.grid || !props.grid.length) return null;

  const rows = props.grid.length;
  const cols = props.grid[0].length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 20px)`,
        gridTemplateRows: `repeat(${rows}, 20px)`,
        gap: '1px',
      }}
    >
      {props.grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: cell === 0 ? color : 'black',
              border: '1px solid rgba(0, 0, 0, 0.2)',
            }}
          />
        ))
      )}
    </div>
  );
};

export default GenerateGrid;