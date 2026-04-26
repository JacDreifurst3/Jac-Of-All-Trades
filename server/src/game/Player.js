class Player{
    // Constructs a player with given color (red or blue) as well as info for setup phase
    constructor(color){
        this.color = color;
        this.availablePieces = this.startingPieces();
        this.layout = Array.from({ length: 4 }, () => new Array(10).fill(null));
        this.showConfirmation = false;
        this.setup = "INCOMPLETE"
    }

    // Map of piece values (key), and number of that piece left to be played (value)
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

    // Returns true if setup is complete
    isSetupComplete(){
        return this.setup === "COMPLETE";
    }

    // Marks setup complete once player confirms it
    markSetupComplete(){
        if (this.availablePieces.size !== 0) {
            throw new Error("Cannot confirm setup until all pieces are placed.");
        }
        this.setup = "COMPLETE";
    }

    // Places players piece into their layout during the setup phase
    placePiece(x, y, rank){
        // Checks that space is open
        if (this.layout[x][y] == null) {
            // Checks that piece is available to be placed
            if (this.availablePieces.get(rank) != null) {
                // If it is last piece of a rank to be placed, remove that rank from map, otherwise decrement value by one 
                if (this.availablePieces.get(rank) === 1) {
                    this.availablePieces.delete(rank);
                } else {
                    this.availablePieces.set(rank, this.availablePieces.get(rank) - 1);
                }
                // Places piece into layout
                this.layout[x][y] = rank;
                // Gives option for users to confirm their layout once all pieces are placed
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

    // On setup layout, moves piece to new space
    movePiece(srcX, srcY, dstX, dstY) {
        // Ensures user is moving actual piece
        if (this.layout[srcX][srcY] == null) {
            throw new Error("No piece to move at the source location.");
        }

        // Does nothing if user moves piece to same space
        if (srcX === dstX && srcY === dstY) {
            return;
        }

        const srcRank = this.layout[srcX][srcY];
        const dstRank = this.layout[dstX][dstY];

        // Moves piece to new space, swaps with other piece if space is occupied
        this.layout[dstX][dstY] = srcRank;
        this.layout[srcX][srcY] = dstRank === null ? null : dstRank;

        if (this.availablePieces.size === 0) {
            this.showConfirmation = true;
        }
    }

    // Randomizes layout
    randomizeLayout(){
        this.layout = Array.from({ length: 4 }, () => new Array(10).fill(null));
        this.availablePieces = this.startingPieces();

        // Reads in available pieces
        const pieces = [];
        for (const [rank, count] of this.availablePieces.entries()) {
            for (let i = 0; i < count; i++) {
                pieces.push(rank);
            }
        }

        // Shuffles all pieces using Fisher–Yates shuffle
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }

        // Puts shuffled pieces into layout
        let index = 0;
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 10; y++) {
                this.layout[x][y] = pieces[index++];
            }
        }

        // Clears avaible pieces and shows confirmation button as all pieces have been placed
        this.availablePieces.clear();
        this.showConfirmation = true;
    }

    // Returns layout
    getLayout(){
        return this.layout;
    }

    // Returns map of available pieces
    getAvailablePieces(){
        return this.availablePieces;
    }
}


module.exports = Player;