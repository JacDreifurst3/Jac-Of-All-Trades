class Player{
    constructor(color){
        this.color = color;
        this.availablePieces = this.startingPieces();
        this.layout = Array.from({ length: 4 }, () => new Array(10).fill(null));
        this.showConfirmation = false;
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
            [11, 6],
        ]);

        return startingPieces;
    }

    isSetupComplete(){
        return this.setup === "COMPLETE";
    }

    markSetupComplete(){
        if (this.availablePieces.size !== 0) {
            throw new Error("Cannot confirm setup until all pieces are placed.");
        }
        this.setup = "COMPLETE";
    }

    placePiece(x, y, rank){
        if (this.layout[x][y] == null) {
            if (this.availablePieces.get(rank) != null) {
                if (this.availablePieces.get(rank) === 1) {
                    this.availablePieces.delete(rank);
                } else {
                    this.availablePieces.set(rank, this.availablePieces.get(rank) - 1);
                }
                this.layout[x][y] = rank;
                if (this.availablePieces.size === 0) {
                    this.showConfirmation = true;
                }
            } else {
                throw new Error("No more pieces of rank: " + rank + " available!");
            }
        } else {
            throw new Error("Space not available");
        }
    }

    movePiece(srcX, srcY, dstX, dstY) {
        if (this.layout[srcX][srcY] == null) {
            throw new Error("No piece to move at the source location.");
        }

        if (srcX === dstX && srcY === dstY) {
            return;
        }

        const srcRank = this.layout[srcX][srcY];
        const dstRank = this.layout[dstX][dstY];

        this.layout[dstX][dstY] = srcRank;
        this.layout[srcX][srcY] = dstRank === null ? null : dstRank;

        if (this.availablePieces.size === 0) {
            this.showConfirmation = true;
        }
    }

    randomizeLayout(){
        this.layout = Array.from({ length: 4 }, () => new Array(10).fill(null));
        this.availablePieces = this.startingPieces();

        const pieces = [];
        for (const [rank, count] of this.availablePieces.entries()) {
            for (let i = 0; i < count; i++) {
                pieces.push(rank);
            }
        }

        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }

        let index = 0;
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 10; y++) {
                this.layout[x][y] = pieces[index++];
            }
        }

        this.availablePieces.clear();
        this.showConfirmation = true;
    }

    getLayout(){
        return this.layout;
    }

    getAvailablePieces(){
        return this.availablePieces;
    }
}


module.exports = Player;