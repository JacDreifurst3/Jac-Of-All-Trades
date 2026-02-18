class Move{
    constructor(playerID, fromX, fromY, toX, toY, piece, battle = false, pieceCaptured = null ){
        this.playerID = playerID;
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toX;
        this.toY = toY;
        this.piece = piece;
        this.battle = battle;
        this.pieceCaptured = pieceCaptured;
        this.timestamp = Date.now();
    }
}
module.exports(Move);