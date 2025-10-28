import React from 'react';

const GeneratePiece = (props) => {
  // const piece = [
  //     [0, 0, 0, 0],
  //     [1, 1, 1, 1],
  //     [0, 0, 0, 0],
  //     [0, 0, 0, 0],
  //   ]

  // const color = "cyan"

  if (!props.piece || !props.piece.shape.length) return null;

  const rows = props.piece.shape.length;
  const cols = props.piece.shape[0].length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 20px)`,
        gridTemplateRows: `repeat(${rows}, 20px)`,
        gap: '1px',
      }}
    >
      {props.piece.shape.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: cell === 1 ? props.piece.color : 'transparent',
              border: cell === 1 ? '1px solid rgba(0, 0, 0, 0.2)' : 'none',
            }}
          />
        ))
      )}
    </div>
  );
};

export default GeneratePiece;