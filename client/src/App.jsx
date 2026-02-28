import { useState } from "react";
import "./App.css";
import { PIECES, LAKES, BOARD_SIZE, PieceIcon } from "./Pieces";

const RED_ROWS = [
  ["8","2","3","2","7","3","2","2","B","3"],
  ["3","5","2","B","7","4","B","2","4","2"],
  ["8","B","6","5","7","2","3","4","4","5"],
  ["B","F","B","10","S","6","6","6","9","5"],
];

function buildInitialPieces() {
  const pieces = [];

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (LAKES.has(`${r},${c}`)) continue;
      pieces.push({ id: `blue-${r}-${c}`, team: "blue", row: r, col: c, label: "" });
    }
  }

  for (let i = 0; i < 4; i++) {
    const r = 6 + i;
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (LAKES.has(`${r},${c}`)) continue;
      pieces.push({
        id: `red-${r}-${c}`,
        team: "red",
        row: r,
        col: c,
        label: RED_ROWS[i][c],
      });
    }
  }

  return pieces;
}

function BoardBackground() {
  return (
    <div className="board-bg">
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, idx) => {
        const r = Math.floor(idx / BOARD_SIZE);
        const c = idx % BOARD_SIZE;
        const isLake = LAKES.has(`${r},${c}`);
        return (
          <div key={`${r},${c}`} className={`tile ${isLake ? "lake" : "grass"}`} />
        );
      })}
    </div>
  );
}

function Piece({ team, row, col, label, isSelected, onClick }) {
  const config = PIECES[label];
  return (
    <div
      className={`piece ${team} ${isSelected ? "selected" : ""}`}
      style={{ gridRowStart: row + 1, gridColumnStart: col + 1 }}
      data-rank={config?.rank}
      data-name={config?.name}
      data-label={label}
      onClick={onClick}
    >
      <PieceIcon label={label} />
    </div>
  );
}

export default function App() {
  const [pieces, setPieces] = useState(buildInitialPieces);
  const [selectedId, setSelectedId] = useState(null);

  function handlePieceClick(piece) {
    setSelectedId(prev => (prev === piece.id ? null : piece.id));
  }

  return (
    <div className="board-wrapper">
      <BoardBackground />
      <div className="pieces-layer">
        {pieces.map(p => (
          <Piece
            key={p.id}
            team={p.team}
            row={p.row}
            col={p.col}
            label={p.label}
            isSelected={selectedId === p.id}
            onClick={() => handlePieceClick(p)}
          />
        ))}
      </div>
    </div>
  );
}