import { useEffect, useState } from 'react';
import axios from "axios";
import { showToast } from "./Toasts";
import { useNavigate } from "react-router-dom";


function Home() {
	const [gameName, setGameName] = useState('');
	const [playerName, setPlayerName] = useState("");
	const [socket, setSocket] = useState(null);
	const [isConnected, setIsConnected] = useState(null);
	const navigate = useNavigate();

	const connectUser = async (e) => {
		try {
			const reponse = await axios.get('http://localhost:4000/api/home');
			if (reponse.status === 200)
			{
				showToast("success", "youhou");
			}
		}
		catch(error)
		{
			if (error.status === 401 || error.status === 403)
			{
				showToast("error", error.message);
				navigate('/login');
			}
		}
	}

	const createGame = async (e) => {
		console.log(playerName);
		try 
		{
			const reponse = await axios.post(`http://localhost:4000/games/${gameName}/${playerName}`);
			if (reponse.status === 201)
				navigate(`/games/${gameName}/${playerName}`);
		}
		catch(error)
		{
			showToast("error", error.message);
		}
	}

	useEffect(() => 
	{
		setPlayerName('pooba');
		// connectUser();
	}, [setPlayerName]);

	return (
		<div className="w-full flex flex-col items-center justify-center">
			<p className="font-caesar flex text-[80px]">
				RED-TETRIS
			</p>
			<div className="flex flex-col items-center">
				<input className="flex flex-col gap-3 w-[40%] text-center" maxLength="10" placeholder="Entrer a name for create the game room" value={gameName} onChange={(e) => setGameName(e.target.value)} />
				<button onClick={createGame}> Creer </button>
			</div>
		</div>
	);
}

export default Home;