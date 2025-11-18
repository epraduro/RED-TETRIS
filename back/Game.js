export class Game {
	constructor(id, name, players, owner, status) {
		this.id = id;
		this.name = name;
		this.players = [];
		this.owner = owner;
		this.status = status;
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