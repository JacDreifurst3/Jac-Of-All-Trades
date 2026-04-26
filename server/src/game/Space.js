class Space {
  // Constructs space with given coordinates and terrain (land or water), sets current piece to null
  // as spaces are only constucted upon board initialization
  constructor(x, y, terrain) {
    this.x = x;
    this.y = y;
    this.terrain = terrain;
    this.piece = null;
  }

  // Returns true if piece is occupied by other piece or water
  isOccupied() {
    return this.piece != null || this.terrain != "LAND";
  }

  // Sets space's piece value to given piece
  placePiece(piece) {
    this.piece = piece;
  }

  // Removes piece from space
  removePiece() {
    const removedPiece = this.piece;
    this.piece = null;
    return removedPiece;
  }

  // Gets space's x value
  getX(){
    return this.x;
  }

  // Gets space's y value
  getY(){
    return this.y;
  }
  
  //formats space for frontend
  serialize() {
    return {
      x: this.x,
      y: this.y,
      terrain: this.terrain,
      piece: this.piece ? {
        rank: this.piece.rank,
        owner: this.piece.owner,
        revealed: this.piece.isRevealed
      } : null
    };
  }
}

module.exports = Space;
