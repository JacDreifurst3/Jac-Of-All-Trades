class Player{
    constructor(color){
        this.color = color;
        this.availablePieces = this.startingPieces();
        this.layout = Array.from({ length: 4 }, () => new Array(10).fill(null));
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
        let availableSpaces = [];
        for(let i = 0; i < this.layout.length; i++){
            for(let j = 0; j < this.layout[i].length; j++){
                if(this.layout[i][j] == null){
                    availableSpaces.push({ x: i, y: j });
                }
            }
        }
        
        return availableSpaces;
    }

    placePiece(x, y, rank){
        if(this.availablePieces.get(rank) != null){
            if(this.availablePieces.get(rank) == 1){
                this.availablePieces.delete(rank);
            } else {
                this.availablePieces.set(rank, this.availablePieces.get(rank) - 1);
            }
            this.layout[x][y] = rank;
        }
    }

    getLayout(){
        return this.layout;
    }
}


module.exports = Player;