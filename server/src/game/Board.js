// Older type of import is needed despite what VSCode may suggest as we are using CommonJS accoring to the package.json file
const Space = require("./Space");

class Board {
  constructor(size = 10) {
    this.size = size;
    this.grid = this.initializeGrid();
  }

  initializeGrid() {
    const grid = [];

    for (let row = 0; row < this.size; row++) {
      const currentRow = [];
      for (let col = 0; col < this.size; col++) {
        currentRow.push(new Space(row, col));
      }
      grid.push(currentRow);
    }

    return grid;
  }

  getSpace(x, y) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) {
      return null;
    }
    return this.grid[x][y];
  }

  movePiece(fromX, fromY, toX, toY) {
    const fromSpace = this.getSpace(fromX, fromY);
    const toSpace = this.getSpace(toX, toY);

    if (!fromSpace || !toSpace || !fromSpace.piece) {
      throw new Error("Invalid move");
    }
    if(toSpace.isOccupied){
        this.resolveCombat(fromSpace, toSpace)
    } else {
        toSpace.placePiece(fromSpace.removePiece());
    }
  }

  // Currently missing reveal logic
  resolveCombat(attacker, defender){
    if(attacker.piece.getRank() > defender.piece.getRank()){
        defender.removePiece();
        defender.placePiece((attacker.removePiece()));
    } else if (attacker.piece.getRank() < defender.piece.getRank()){
        attacker.removePiece();
    }
  }

}

module.exports(Board);