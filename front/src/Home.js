import { useState } from 'react';

function Home() {
	const [gameName, setGameName] = useState('');
	const [playerName, setPlayerName] = useState('');
	const [socket, setSocket] = useState(null);

	

	return (
		<div class="w-full flex flex-col items-center justify-center">
			<p class="font-caesar flex text-[80px]">
				RED-TETRIS
			</p>
			<div class="flex flex-col items-center">
				<input class="flex flex-col gap-3 w-[40%] text-center" maxLength="10" placeholder="Entrer a name for create the game room" value={gameName} onChange={(e) => setGameName(e.target.value)} />
				<button onClick={() => (window.location.href = `/${gameName}/${playerName}`)}> Creer </button>
			</div>
		</div>
	);
}

export default Home;