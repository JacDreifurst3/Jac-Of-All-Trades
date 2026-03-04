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
        if ((row == 4 || row == 5) && (col == 2 || col == 3 || col == 6 || col == 7)) {
          currentRow.push(new Space(row, col, "WATER"));
        } else {
          currentRow.push(new Space(row, col, "LAND"));
        }
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

  
  getAvailableMoves(currentSpace){
    let availableMoves = [];
    let currentX = currentSpace.getX();
    let currentY = currentSpace.getY();
    let maxRange = currentSpace.piece.isScout() ? this.size - 1 : 1;

    // Check right
    for(let i = 1; i <= maxRange; i++){
      let possibleSpace = this.getSpace(currentX + i, currentY);
      if(this.validateMove(currentSpace, possibleSpace)) {
        availableMoves.push({ x: currentX + i, y: currentY });
        if(possibleSpace.isOccupied()){
          break;
        }
      } else {
        break; // Stop this direction if blocked
      }
    }

    // Check left
    for(let i = 1; i <= maxRange; i++){
      let possibleSpace = this.getSpace(currentX - i, currentY);
      if(this.validateMove(currentSpace, possibleSpace)) {
        availableMoves.push({ x: currentX - i, y: currentY });
        if(possibleSpace.isOccupied()){
          break;
        }
      } else {
        break; // Stop this direction if blocked
      }
    }

    // Check down
    for(let i = 1; i <= maxRange; i++){
      let possibleSpace = this.getSpace(currentX, currentY + i);
      if(this.validateMove(currentSpace, possibleSpace)) {
        availableMoves.push({ x: currentX, y: currentY + i });
        if(possibleSpace.isOccupied()){
          break;
        }
      } else {
        break; // Stop this direction if blocked
      }
    }

    // Check up
    for(let i = 1; i <= maxRange; i++){
      let possibleSpace = this.getSpace(currentX, currentY - i);
      if(this.validateMove(currentSpace, possibleSpace)) {
        availableMoves.push({ x: currentX, y: currentY - i });
        if(possibleSpace.isOccupied()){
          break;
        }
      } else {
        break; // Stop this direction if blocked
      }
    }

    return availableMoves;
  }

  validateMove(currentSpace, possibleSpace){
    if (!possibleSpace) return false;
    
    if (possibleSpace.terrain === "WATER") return false;
    
    if (!possibleSpace.piece) return true;
    
    // Has a piece
    if (possibleSpace.piece.getOwner() === currentSpace.piece.getOwner()) return false;
    
    return true;
  }

  generateMove(fromX, fromY, toX, toY) {
    const fromSpace = this.getSpace(fromX, fromY);
    const toSpace = this.getSpace(toX, toY);

    if (!fromSpace || !toSpace || !fromSpace.piece || (toSpace.isOccupied() && toSpace.piece.getOwner() == fromSpace.piece.getOwner())) {
      throw new Error("Invalid move");
    }

    const attacker = fromSpace.piece;
    const defender = toSpace.piece;

    return { fromSpace, toSpace, attacker, defender };
  }


  executeMove(fromSpace, toSpace) {
    toSpace.placePiece(fromSpace.removePiece());
  }

  //this formats board for react
  serialize() {
    return this.grid.map(row =>
      row.map(space => {
        // We call the serialize method we just added to the Space class
        return space.serialize();
      })
    );
  }

}

module.exports = Board;