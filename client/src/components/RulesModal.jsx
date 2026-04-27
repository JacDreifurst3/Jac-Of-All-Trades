import React from "react";

export default function RulesModal({ onClose }) {
  return (
    <div className="rules-overlay" onClick={onClose}>
      <div className="rules-modal" onClick={e => e.stopPropagation()}>
        <div className="rules-modal__header">
          <h2 className="rules-modal__title">📜 STRATEGO — Rules</h2>
          <button className="rules-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="rules-modal__body">

          <div className="rules-overview">
            <p>
              Stratego is a two-player strategy board game where each player commands an army of hidden pieces.
              The goal is to capture your opponent's Flag while protecting your own.
            </p>
            <p>
              Players secretly arrange their pieces at the start, and each piece has a rank, like soldiers,
              scouts, bombs, and a spy, that determines the outcome when two pieces battle. Since piece
              identities are hidden, the game combines <strong>strategy</strong>, <strong>memory</strong>,
              and <strong>bluffing</strong> to outsmart your opponent.
            </p>
          </div>

          <h3>Object of the Game</h3>
          <p>Capture your opponent's Flag.</p>

          <h3>To Start the Game</h3>
          <ol>
            <li>Place the board between players so STRATEGO faces each contestant.</li>
            <li>One player takes Red pieces, the other Blue. Red starts first.</li>
            <li>Each player gets an army of 40 pieces: 1 Marshal, 1 General, 2 Colonels, 3 Majors, 4 Captains, 4 Lieutenants, 4 Sergeants, 5 Miners, 8 Scouts, 1 Spy, 6 Bombs, and 1 Flag.</li>
            <li>Fill your half of the board — 10 per row, 4 rows deep. The two middle rows start empty.</li>
            <li>Pieces face you so the opponent cannot see their rank.</li>
          </ol>

          <h3>Piece Rankings (High → Low)</h3>
          <table className="rules-table">
            <thead><tr><th>Rank</th><th>Piece</th><th>Count</th></tr></thead>
            <tbody>
              {[
                [10,"Marshal",1],[9,"General",1],[8,"Colonel",2],[7,"Major",3],
                [6,"Captain",4],[5,"Lieutenant",4],[4,"Sergeant",4],[3,"Miner",5],
                [2,"Scout",8],["S","Spy",1],["B","Bomb",6],["F","Flag",1],
              ].map(([rank, name, count]) => (
                <tr key={rank}><td>{rank}</td><td>{name}</td><td>×{count}</td></tr>
              ))}
            </tbody>
          </table>

          <h3>Movement Rules</h3>
          <ol>
            <li>Turns alternate — Red first, then Blue.</li>
            <li>Pieces move one square at a time: forward, backward, or sideways — <strong>not diagonally</strong>.</li>
            <li>Two lakes in the center have no squares — pieces must move around them.</li>
            <li>Two pieces cannot occupy the same square.</li>
            <li>A piece cannot move through or jump over another piece.</li>
            <li>Only one piece may be moved per turn.</li>
            <li>The Flag and Bombs <strong>cannot be moved</strong> once placed.</li>
            <li>The <strong>Scout</strong> may move any number of open squares in a straight line.</li>
            <li>Once a piece is moved is is the other player's turn.</li>
            <li>A player <strong>must</strong> either move or strike on their turn.</li>
          </ol>

          <h3>Strike / Attack Rules</h3>
          <ol>
            <li>When opposing pieces occupy adjoining squares (not diagonal), either player may strike on their turn.</li>
            <li>The attacker reveals their rank; the defender responds with their own rank.</li>
            <li>The <strong>lower-ranked piece is removed</strong>. The winner moves into the empty square.</li>
            <li>Equal ranks: <strong>both pieces are removed</strong>.</li>
            <li>The <strong>Spy</strong> can only defeat the Marshal — and only if the Spy strikes first. If the Marshal strikes first, the Spy is removed.</li>
            <li>Any piece (except a Miner) that strikes a <strong>Bomb</strong> is lost. The Bomb stays. A Miner defuses a Bomb and moves into its square.</li>
            <li>Bombs and the Flag can never strike — they must be struck.</li>
          </ol>

          <h3>Ending the Game</h3>
          <p>The game ends when:</p>
          <ul>
            <li>A player captures the opponent's Flag, OR</li>
            <li>A player has no pieces that can move (all movable pieces are trapped or eliminated)</li>
          </ul>

          <h3>Strategy Tips</h3>
          <ul>
            <li>Surround your Flag with Bombs, but place some Bombs away from the Flag to mislead your opponent.</li>
            <li>Keep a few high-ranking pieces in your front lines — but don't lose them quickly.</li>
            <li>Scouts are great for probing enemy positions early.</li>
            <li>Save your Miners for the end game to defuse hidden Bombs near the Flag.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}