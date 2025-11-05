export const removePlayer = (players, playerName) => {
    const index = players.findIndex(player => player.name === playerName);
  
    if (index !== -1) {
      const [removed] = players.splice(index, 1);
      console.log(`${removed.name} supprimé`);
      return [...players];
    }
  
    return players;
  };

  export const addPlayer = (players, playerName, ws) => {
    const player = { name: playerName, ws: ws };
    console.log(`${playerName} ajouté. Total: ${players.length + 1}`);
  
    return [...players, player];
  };