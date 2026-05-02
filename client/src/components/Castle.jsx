import { PIECES, PieceIcon } from "./Pieces";

// Renders a single piece on the board at the given grid position.
// Uses data attributes so CSS tooltips can display rank/name on hover.
export default function Castle({ row, col, team = "red", label = "F", isSelected, onClick }) {
  const config = PIECES[label];
  return (
    <div
      className={`piece ${team} castle ${isSelected ? "selected" : ""}`}
      style={{ gridRowStart: row + 1, gridColumnStart: col + 1 }} // grid is 1-indexed
      data-rank={config?.rank}
      data-name={config?.name}
      data-label={label}
      onClick={onClick}
    >
      <PieceIcon label={label} />
    </div>
  );
}