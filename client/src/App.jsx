import { useMemo } from "react";
import "./App.css";

const SIZE = 10;

const LAKES = new Set([
  "4,2","4,3","5,2","5,3",
  "4,6","4,7","5,6","5,7",
]);

function makeBoard() {
  const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!LAKES.has(`${r},${c}`)) b[r][c] = { owner: "BLUE", label: "" };
    }
  }

  const rows = [
    ["8","2","3","2","7","3","2","2","B","3"],
    ["3","5","2","B","7","4","B","2","4","2"],
    ["8","B","6","5","7","2","3","4","4","5"],
    ["B","F","B","10","S","6","6","6","9","5"],
  ];

  for (let i = 0; i < 4; i++) {
    const r = 6 + i;
    for (let c = 0; c < SIZE; c++) {
      if (!LAKES.has(`${r},${c}`)) b[r][c] = { owner: "RED", label: rows[i][c] };
    }
  }

  return b;
}

export default function App() {
  const board = useMemo(() => makeBoard(), []);

  return (
    <div className="boardOnlyPage">
      <div className="strategoBoard" role="grid" aria-label="Stratego board">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r},${c}`;
            const isLake = LAKES.has(key);

            return (
              <div
                key={key}
                className={`tile ${isLake ? "lake" : "grass"}`}
                role="gridcell"
              >
                {cell ? (
                  <div className={`piece ${cell.owner === "RED" ? "red" : "blue"}`}>
                    {cell.label ? <span className="rank">{cell.label}</span> : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
