import { PIECES, PieceIcon } from "./Pieces";

export default function Castle({ row, col, team = "red", label = "F", isSelected, onClick }) {
  const config = PIECES[label];
  return (
    <div
      className={`piece ${team} castle ${isSelected ? "selected" : ""}`}
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