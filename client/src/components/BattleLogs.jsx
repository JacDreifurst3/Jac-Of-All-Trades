import React, { useRef} from "react";
import { PieceIcon } from "./Pieces.jsx";

const RANK_NAMES = {
  0: "Flag", 1: "Spy (1)", 2: "Scout (2)", 3: "Miner (3)", 4: "Sergeant (4)",
  5: "Lieutenant (5)", 6: "Captain (6)", 7: "Major (7)", 8: "Colonel (8)",
  9: "General (9)", 10: "Marshal (10)", 11: "Bomb"
};

const rankName = (rank) => RANK_NAMES[rank] ?? `Rank ${rank}`;
const rankLabel = (rank) => rank === 11 ? "11" : rank === 0 ? "0" : String(rank);


export function Piece({ owner, rank }) {
  const label = rank === "HIDDEN" ? "" : rank.toString();
  return (
    <div className={`piece ${owner.toLowerCase()}`}>
      <div className="piece-icon-wrapper">
        <PieceIcon label={label} className="piece-icon" />
      </div>
    </div>
  );
}

export function BattleLog({ entries }) {
  const listRef = useRef(null);
  return (
    <div className="battle-log battle-log--sidebar">
      <div className="battle-log__header">
        ⚔ Battle Log
        {entries.length > 0 && <span className="battle-log__count">{entries.length}</span>}
      </div>
      <div className="battle-log__scroll" ref={listRef}>
        {entries.map((e) => <BattleEntry key={e.id} entry={e} />)}
      </div>
    </div>
  );
}

export function CapturedLog({ pieces, playerColor }) {
  const redPieces = pieces.filter(p => p.color === "RED");
  const bluePieces = pieces.filter(p => p.color === "BLUE");

  const [topList, topName, topClass] = playerColor === "RED" 
    ? [redPieces, "Your Lost Pieces", "red"] 
    : [bluePieces, "Your Lost Pieces", "blue"];
    
  const [bottomList, bottomName, bottomClass] = playerColor === "RED"
    ? [bluePieces, "Captured Blue", "blue"]
    : [redPieces, "Captured Red", "red"];
  const renderPiece = (p) => (
    <div key={p.id} className="captured-entry">
      <div className={`battle-piece__token piece ${p.color.toLowerCase()} battle-piece--dead`}>
        <div className="piece-icon-wrapper">
          <PieceIcon label={p.label} className="piece-icon" />
        </div>
      </div>
      <span className="captured-entry__name">{p.name}</span>
    </div>
  );

  return (
    <div className="battle-log battle-log--sidebar">
      <div className="battle-log__header">Pieces Captured</div>
      <div className="battle-log__scroll--split">
        <div className="captured-section">
          <div className={`captured-section__label ${topClass}`}>{topName}</div>
          {topList.map(renderPiece)}
        </div>
        <div className="captured-section__divider" />
        <div className="captured-section">
          <div className={`captured-section__label ${bottomClass}`}>{bottomName}</div>
          {bottomList.map(renderPiece)}
        </div>
      </div>
    </div>
  );
}

export function BattleEntry({ entry }) {
  const { result, attackerRank, defenderRank, attackerColor, defenderColor } = entry;
  
  const atkLabel = rankLabel(attackerRank);
  const defLabel = rankLabel(defenderRank);
  const atkName = rankName(attackerRank);
  const defName = rankName(defenderRank);
  const atkColor = attackerColor;
  const defColor = defenderColor;
  
  const atkDead = result === "DEFENDER_WINS" || result === "BOTH_DIE";
  const defDead = result === "ATTACKER_WINS" || result === "BOTH_DIE" || result === "FLAG_CAPTURED";
  const atkColorLow = (atkColor ?? "RED").toLowerCase();
  const defColorLow = (defColor ?? "BLUE").toLowerCase();
  const atkLabel2 = (atkColor ?? "RED").charAt(0) + (atkColor ?? "RED").slice(1).toLowerCase();
  const defLabel2 = (defColor ?? "BLUE").charAt(0) + (defColor ?? "BLUE").slice(1).toLowerCase();

  return (
    <div className={`battle-entry battle-entry--${result.toLowerCase()}`}>
      <div className={`battle-piece battle-piece--atk ${atkDead ? "battle-piece--dead" : "battle-piece--alive"}`}>
        <div className={`battle-piece__token piece ${atkColorLow}`}>
          <div className="piece-icon-wrapper">
            <PieceIcon label={atkLabel} className="piece-icon" />
          </div>
        </div>
        <span className="battle-piece__name">{atkName}</span>
      </div>
      <div className="battle-vs">
        <span className="battle-vs__label">
          {result === "BOTH_DIE" ? "✕✕" : result === "ATTACKER_WINS" || result === "FLAG_CAPTURED" ? "▶" : "◀"}
        </span>
      </div>
      <div className={`battle-piece battle-piece--def ${defDead ? "battle-piece--dead" : "battle-piece--alive"}`}>
        <div className={`battle-piece__token piece ${defColorLow}`}>
          <div className="piece-icon-wrapper">
            <PieceIcon label={defLabel} className="piece-icon" />
          </div>
        </div>
        <span className="battle-piece__name">{defName}</span>
      </div>
      <div className="battle-outcome">
        {result === "ATTACKER_WINS" && <span className={`battle-tag battle-tag--${atkColorLow}`}>{atkLabel2} Defeats</span>}
        {result === "DEFENDER_WINS" && <span className={`battle-tag battle-tag--${defColorLow}`}>{defLabel2} Defeats</span>}
        {result === "BOTH_DIE"      && <span className="battle-tag battle-tag--draw">Both Eliminated</span>}
        {result === "FLAG_CAPTURED" && <span className="battle-tag battle-tag--flag"> Flag Captured!</span>}
      </div>
    </div>
  );
}