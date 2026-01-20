import { useParams } from "react-router-dom";
import axios from "axios";
import { showToast } from "../Toasts";
import { useEffect, useState } from "react";

function Profile() {

	const { playerName } = useParams();
	const [userGames, setUserGames] = useState([]);

	const getUserGames = async () => {
		try {
			const response = await axios.get(`http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/api/getgames?name=${playerName}`, {
				headers: {
					'Authorization': `Bearer ${localStorage.getItem("token")}`
				}
			});
			setUserGames(response.data.games);
		} catch (error) {
			showToast("error", "Failed to fetch user games!");
		}
	}

	useEffect(() => {
		getUserGames();
	}, []);

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-20 left-10 w-32 h-32 bg-indigo-800 rounded-lg opacity-20 animate-pulse"></div>
				<div className="absolute bottom-32 right-20 w-24 h-24 bg-violet-800 rounded-lg opacity-20 animate-pulse"></div>
				<div className="absolute top-1/2 right-1/4 w-20 h-20 bg-blue-800 rounded-lg opacity-20 animate-pulse"></div>
			</div>

			<div className="relative z-10 w-full max-w-4xl">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="font-caesar text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 pb-4 drop-shadow-2xl">
						RED-TETRIS
					</h1>
					<div className="inline-block bg-indigo-900/60 backdrop-blur-md border-2 border-indigo-400/50 rounded-lg px-8 py-3 mt-4 shadow-lg shadow-indigo-500/30">
						<p className="text-xl text-indigo-200">
							Profil de <span className="font-bold text-violet-300">{playerName}</span>
						</p>
					</div>
				</div>

				{/* Profile Content */}
				<div className="bg-slate-900/80 backdrop-blur-md border-2 border-violet-500/50 rounded-2xl p-8 shadow-2xl shadow-violet-900/50">
					<h3 className="text-2xl font-bold text-indigo-200 mb-6 text-center">Parties Sauvegardées</h3>
					
					{userGames.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-indigo-200 text-lg">Aucune partie sauvegardée trouvée.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full border-collapse">
								<thead>
									<tr className="border-b-2 border-violet-500/50">
										<th className="px-4 py-3 text-left text-indigo-200 font-semibold">Nom de la partie</th>
										<th className="px-4 py-3 text-left text-indigo-200 font-semibold">Score</th>
										<th className="px-4 py-3 text-left text-indigo-200 font-semibold">Date</th>
									</tr>
								</thead>
								<tbody>
									{userGames.map((game, index) => (
										<tr 
											key={game.id} 
											className={`border-b border-violet-500/30 hover:bg-slate-800/50 transition-colors ${
												index % 2 === 0 ? 'bg-slate-950/30' : 'bg-slate-900/30'
											}`}
										>
											<td className="px-4 py-3 text-indigo-100">{game.name}</td>
											<td className="px-4 py-3 text-indigo-100">{game.score}</td>
											<td className="px-4 py-3 text-indigo-100">{new Date(game.date).toLocaleString()}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Back to Home Link */}
				<div className="inline-block mt-8 text-center bg-slate-900/60 backdrop-blur-sm border-2 border-indigo-500/50 rounded-lg p-4">
					<a
						href="/home"
						className="inline-flex items-center gap-2 text-violet-300 hover:text-violet-200 transition-colors duration-300 font-medium underline"
					>
						← Retour à la page d'accueil
					</a>
				</div>
			</div>
		</div>
	)

}

export default Profile;