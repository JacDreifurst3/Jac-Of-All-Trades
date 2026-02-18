const Piece = require("./Piece");

class Space{
    constructor(x, y, terrain){
        this.x = x;
        this.y = y;
        this.terrain = terrain;
        this.piece = null;
    }

    isOccupied(){
        return this.piece !== null || this.terrain != "LAND";
    }

    placePiece(piece){
        this.piece = piece;
    }

    removePiece(){
        // return removed Piece, maybe to allow for putting in "jail" or wherever players will see defeated pieces
        const removedPiece = this.piece;
        this.piece = null;
        return removedPiece;
    }
}

module.exports = Space;