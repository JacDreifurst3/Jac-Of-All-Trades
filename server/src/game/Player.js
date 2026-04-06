class Player{
    constructor(color){
        this.color = color;
        this.availablePieces = this.startingPieces();
        this.layout = Array.from({ length: 4 }, () => new Array(10).fill(null));
        this.setup = "INCOMPLETE"
    }

    startingPieces(){
        const startingPieces = new Map([
            [0, 1],
            [1, 1],
            [2, 8],
            [3, 5],
            [4, 4],
            [5, 4],
            [6, 4],
            [7, 3],
            [8, 2],
            [9, 1],
            [10, 1],
        ]);

        return startingPieces;
    }

    isSetupComplete(){
        return this.availablePieces == null;
    }

    placePiece(x, y, rank){
        if(this.isSetupComplete()){
            this.setup = "COMPLETE";
        } else if(this.layout[x][y] == null){
            if(this.availablePieces.get(rank) != null){
                if(this.availablePieces.get(rank) == 1){
                    this.availablePieces.delete(rank);
                } else {
                    this.availablePieces.set(rank, this.availablePieces.get(rank) - 1);
                }
                this.layout[x][y] = rank;
            } else {
                throw new Error("No more pieces of rank: " + rank + " available!");
            }
        } else {
            throw new Error("Space not available");
        }
    }

    getLayout(){
        return this.layout;
    }

    getAvailablePieces(){
        return this.availablePieces;
    }
}


module.exports = Player;