class Piece{
    // Constructs piece of certain rank and owner, defaults to not being revealed
    constructor(rank, owner){
        this.rank = rank;
        this.owner = owner;
        // Refers to if piece is revealed to opponent
        this.isRevealed = false;
    }

    // Returns true if piece is a movable rank
    canMove(){
        return (this.rank > 0 && this.rank < 11);
    }

    // Returns true if piece is bomb
    isBomb() {
        return this.rank === 0;
    }

    // Returns true if piece is flag
    isFlag() {
        return this.rank === 11;
    }

    // Returns true if piece is miner
    isMiner() {
        return this.rank === 3;
    }

    // Returns true if piece is spy
    isSpy() {
        return this.rank === 1;
    }

    // Returns true if piece is scout
    isScout(){
        return this.rank === 2;
    }

    // Reveals piece to opponent
    reveal() {
        this.isRevealed = true;
    }

    // Hides piece from opponent
    hide(){
        this.isRevealed = false;
    }

    getIsRevealed(){
        return this.isRevealed === true;
    }

    // Returns rank of piece
    getRank(){
        return this.rank;
    }

    // Returns owner of piece
    getOwner(){
        return this.owner;
    }
}

module.exports = Piece;