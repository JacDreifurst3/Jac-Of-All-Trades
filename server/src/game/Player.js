class Player{
    constructor(color){
        this.color = color;
        this.availablePieces = this.startingPieces();
        this.layout = Array.from({ length: 10 }, () => new Array(10).fill(null));
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
    
    validSpaces(){
        for(const integer of this.layout){
            
        }
    }

    placePiece(){

    }
}


module.exports = Player;