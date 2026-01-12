import { useParams } from "react-router-dom";
import axios from "axios";
import { showToast } from "../Toasts";
import { useEffect, useState } from "react";

function Profile() {

	const { playerName } = useParams();
	const [userGames, setUserGames] = useState([]);

	const getUserGames = async () => {
		try {
			const response = await axios.get(`http://10.18.192.97:4000/api/getgames?name=${playerName}`, {
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
		<div className="flex w-full h-full">
			<div className="flex flex-col w-full items-center">
				<h1 className="text-6xl font-caesar mb-8">Profile of {playerName}</h1>
				<h2 className="text-4xl font-caesar mb-4">Saved Games:</h2>
				{userGames.length === 0 ? (
					<p>No saved games found.</p>
				) : (
					<table className="table-auto border-collapse border border-gray-400">
						<thead>
							<tr>
								<th className="border border-gray-300 px-4 py-2">Game Name</th>
								<th className="border border-gray-300 px-4 py-2">Score</th>
								<th className="border border-gray-300 px-4 py-2">Date</th>
							</tr>
						</thead>
						<tbody>
							{userGames.map((game) => (
								<tr key={game.id}>
									<td className="border border-gray-300 px-4 py-2">{game.name}</td>
									<td className="border border-gray-300 px-4 py-2">{game.score}</td>
									<td className="border border-gray-300 px-4 py-2">{new Date(game.date).toLocaleString()}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	)

}

export default Profile;