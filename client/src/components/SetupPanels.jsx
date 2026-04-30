import React from "react";
import { PieceIcon } from "./Pieces.jsx";
const RANK_ORDER = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 11, 0];

const RANK_NAMES = {
  0: "Flag", 1: "Spy (1)", 2: "Scout (2)", 3: "Miner (3)", 4: "Sergeant (4)",
  5: "Lieutenant (5)", 6: "Captain (6)", 7: "Major (7)", 8: "Colonel (8)",
  9: "General (9)", 10: "Marshal (10)", 11: "Bomb"
};

const rankName = (rank) => RANK_NAMES[rank] ?? `Rank ${rank}`;

export function SetupSidebar({ 
  availablePieces, 
  selectedRank, 
  setSelectedRank, 
  setSelectedSetupSlot, 
  setupComplete, 
  showConfirmation, 
  randomizeLayout, 
  markSetupComplete, 
  playerColor 
}) {
  const totalLeft = Object.values(availablePieces).reduce((a, b) => a + b, 0);

  return (
    <div className="setup-sidebar">
      <div className="setup-sidebar__header">
        <div className="setup-sidebar__crown">♛</div>
        <h2 className="setup-sidebar__title">Your Pieces</h2>
        <div className={`setup-sidebar__team-badge ${playerColor.toLowerCase()}`}>
          {playerColor === "RED" ? "Red Army" : "Blue Army"}
        </div>
      </div>

      <div className="setup-sidebar__counter">
        <span className="setup-counter__num">{totalLeft}</span>
        <span className="setup-counter__label">pieces remaining</span>
        <div className="setup-counter__track">
          <div
            className="setup-counter__fill"
            style={{ width: `${100 - (totalLeft / 40) * 100}%` }}
          />
        </div>
      </div>

      <div className="setup-pieces-grid">
        {RANK_ORDER.map((r) => {
          const count = availablePieces[r] ?? 0;
          const isSelected = selectedRank === r;
          const depleted = count === 0;
          return (
            <button
              key={r}
              className={`setup-piece-card ${isSelected ? "selected" : ""} ${depleted ? "depleted" : ""} ${playerColor.toLowerCase()}`}
              onClick={() => {
                setSelectedRank(isSelected ? null : r);
                setSelectedSetupSlot(null);
              }}
              disabled={depleted}
              title={rankName(r)}
            >
              <div className="setup-piece-card__token">
                <div className={`piece ${playerColor.toLowerCase()}`}>
                  <PieceIcon label={String(r)} />
                </div>
              </div>
              <div className="setup-piece-card__info">
                <span className="setup-piece-card__name">{rankName(r)}</span>
                <span className="setup-piece-card__count">×{count}</span>
              </div>
              {isSelected && <div className="setup-piece-card__glow" />}
            </button>
          );
        })}
      </div>

      <div className="setup-sidebar__actions">
        {!setupComplete && (
          <button
            className="setup-action-btn setup-action-btn--random"
            onClick={() => {
              randomizeLayout();
              setSelectedRank(null);
              setSelectedSetupSlot(null);
            }}
          >
            <span className="setup-action-btn__icon">⚄</span>
            Randomize
          </button>
        )}
        {showConfirmation && !setupComplete && (
          <button className="setup-action-btn setup-action-btn--confirm" onClick={markSetupComplete}>
            <span className="setup-action-btn__icon">✓</span>
            Confirm Setup
          </button>
        )}
      </div>
    </div>
  );
}

export function SetupInfoSidebar({ playerColor, selectedRank, setupComplete }) {
  const hints = setupComplete ? [] : [
    "Select a piece from the left, then click your zone.",
    "Click an empty tile in your zone to place.",
    "Click or drag to another tile to move or swap.",
  ];

  const PIECE_TIPS = {
    10: "Marshal — highest ranking piece, only beaten by the Spy.",
    9:  "General — second highest ranking piece.",
    8:  "Colonel — solid frontline attacker.",
    7:  "Major — versatile mid-rank fighter.",
    6:  "Captain — reliable attacker.",
    5:  "Lieutenant — light infantry.",
    4:  "Sergeant — cannon fodder.",
    3:  "Miner — the only unit that can defuse Bombs.",
    2:  "Scout — can move any number of empty spaces horizontally or vertically",
    1:  "Spy — the only unit that can defeat the Marshal when the spy attacks.",
    11: "Bomb — immovable and kills any attacker except the Miner.",
    0:  "Flag — protect at all costs! If captured, you lose.",
  };

  return (
    <div className="setup-info-sidebar">
      <div className="setup-info-sidebar__header">
        <span className="setup-info-sidebar__icon"></span>
        <h3>Field Manual</h3>
      </div>

      {hints.map((h, i) => (
        <div key={i} className="setup-hint">
          <div className="setup-hint__arrow">▶</div>
          <span>{h}</span>
        </div>
      ))}

      <div className="setup-tips">
        {RANK_ORDER.map((r) => (
          <div
            key={r}
            className={`setup-tip-row ${selectedRank === r ? "highlighted" : ""} ${r === 0 || r === 11 ? "special" : ""}`}
          >
            <div className={`setup-tip-badge ${playerColor.toLowerCase()}`}>
              <PieceIcon label={String(r)} />
            </div>
            <span className="setup-tip-text">{PIECE_TIPS[r]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}