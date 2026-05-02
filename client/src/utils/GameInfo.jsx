
// maps each rank number to its corresponding piece name

export const RANK_NAMES = {
  0: "Flag", 1: "Spy (1)", 2: "Scout (2)", 3: "Miner (3)", 4: "Sergeant (4)",
  5: "Lieutenant (5)", 6: "Captain (6)", 7: "Major (7)", 8: "Colonel (8)",
  9: "General (9)", 10: "Marshal (10)", 11: "Bomb"
};
// returns the full name of a piece based on its rank
export const rankName = (rank) => RANK_NAMES[rank] ?? `Rank ${rank}`;
// returns the label shown on the piece (special cases for bomb + flag)
export const rankLabel = (rank) => rank === 11 ? "11" : rank === 0 ? "0" : String(rank);
// converts board coordinates to setup layout coordinates depending on player side
export const toLayoutCoords = (space, playerColor) => {
  if (playerColor === "RED") return { x: space.x - 6, y: space.y };
  return { x: 3 - space.x, y: space.y };
};