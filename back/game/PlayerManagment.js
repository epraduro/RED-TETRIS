import {Player} from '../Player.js';

export const removePlayer = (players, playerName) => {
    const index = players.findIndex(player => player.name === playerName);

    if (index !== -1) {
        const [removed] = players.splice(index, 1);
        // console.log(`${removed.name} supprimé`);
        return [...players];
    }

    return players;
};