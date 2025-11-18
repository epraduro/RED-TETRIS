class Game {
	constructor(name, players) {
		this.name = name;
		this.players = players;
	}

	update () {
		if (start && this.currentPiece.shape !== null) {
		  if (!movePiece(1, 0)) {
			if (grid[0].some((v) => v !== 0)) {
			  showToast("error", "GAME OVER");
			  setStart(false);
			} else newPiece();
		  }
		}
	  };
}