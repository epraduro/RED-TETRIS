import './Home.css';
import { useState } from 'react';

function Home() {
	const [gameName, setGameName] = useState('');
	const [playerName, setPlayerName] = useState('');

	return (
		<>
		<div className="title">
			RED-TETRIS
		</div>
		<div className="create-game">
			<input className="game-name" maxLength="10" placeholder="Entrer a name for create the game room" value={gameName} onChange={(e) => setGameName(e.target.value)} />
			<input className="game-name" maxLength="10" placeholder="Entrer a name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
			<button className='create-game-btn' onClick={() => (window.location.href = `/${gameName}/${playerName}`)}> Creer </button>
		</div>
		</>
	);
}

export default Home;
