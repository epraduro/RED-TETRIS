import { useEffect, useState } from 'react';
import axios from "axios";
import { showToast } from "./Toasts";
import { useNavigate } from "react-router-dom";


function Home() {
	const [gameName, setGameName] = useState('');
	const [playerName, setPlayerName] = useState("");
	const [isConnected, setIsConnected] = useState(null);
	const navigate = useNavigate();

	const createGame = async () => {
		navigate(`/games/${gameName}/${playerName}`);
	}

	const connectUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('error', 'Aucun token trouvé. Veuillez vous connecter.');
            navigate('/login');
            return;
        }

        try {
            const response = await axios.get('http://10.18.198.45:4000/api/home', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setPlayerName(response.data.user.name);
            showToast('success', 'Connexion réussie !');
        } catch (error) {
            if (error.response) {
                showToast('error', error.response.data.error || 'Erreur lors de la connexion22');
                if (error.response.status === 401 || error.response.status === 403) {
                    localStorage.removeItem("token");
                    navigate('/login');
                }
            } else {
                showToast('error', 'Erreur réseau');
                console.error('Erreur réseau:', error);
            }
        }
    };

	useEffect(() => 
	{
		connectUser();
	}, []);

	return (
		<>
		<div className="w-full flex flex-col items-center justify-center">
			<p className="font-caesar flex text-[80px]">
				RED-TETRIS
			</p>
			<div className="flex flex-col items-center">
				<input 
					className="flex flex-col gap-3 w-[40%] text-center" 
					maxLength="10" 
					placeholder="Entrer a name for create the game room" 
					value={gameName} 
					onChange={(e) => setGameName(e.target.value)} 
				/>
				<button
                    onClick={createGame} // Utiliser navigate au lieu de window.location.href
                    disabled={!gameName || !playerName}
                > 
					Creer 
				</button>
			</div>
		</div>
		<div>
			<a href='/profile'>Profile</a>
		</div>
		</>
	);
}

export default Home;