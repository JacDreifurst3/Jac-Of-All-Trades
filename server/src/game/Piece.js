class Piece{
    constructor(rank, owner){
        this.rank = rank;
        this.owner = owner;
        this.isRevealed = false;
    }

    canMove(){
        return (this.rank > 0 && this.rank < 11);
    }

    reveal() {
        this.isRevealed = true;
    }

    getRank(){
        return this.rank;
    }
}

module.exports = Piece;