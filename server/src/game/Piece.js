class Piece{
    constructor(rank, owner){
        this.rank = rank;
        this.owner = owner;
        this.isRevealed = false;
    }

    canMove(){
        return (this.rank > 0 && this.rank < 11);
    }

    isBomb() {
        return this.rank === 0;
    }

    isFlag() {
        return this.rank === 11;
    }

    isMiner() {
        return this.rank === 3;
    }

    isSpy() {
        return this.rank === 1;
    }

    isScout(){
        return this.rank === 2;
    }

    reveal() {
        this.isRevealed = true;
    }

    hide(){
        this.isRevealed = false;
    }

    getRank(){
        return this.rank;
    }
}

module.exports = Piece;