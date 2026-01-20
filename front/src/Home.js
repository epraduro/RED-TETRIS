import { useEffect, useState } from "react";
import axios from "axios";
import { showToast } from "./Toasts";
import { useNavigate } from "react-router-dom";

function Home() {
  const [gameName, setGameName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const navigate = useNavigate();
  const [gameList, setGameList] = useState([]);

  const createGame = async () => {
    navigate(`/games/${gameName}/${playerName}`);
  };

  const connectUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("error", "Aucun token trouvé. Veuillez vous connecter.");
      navigate("/login");
      return;
    }
    try {
      const response = await axios.get(
        `http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/api/home`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPlayerName(response.data.user.name);
      showToast("success", "Connexion réussie !");
    } catch (error) {
      if (error.response) {
        showToast(
          "error",
          error.response.data.error || "Erreur lors de la connexion22"
        );
        if (error.response.status === 401 || error.response.status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } else {
        showToast("error", "Erreur réseau");
        console.error("Erreur réseau:", error);
      }
    }
  };

  const listAllGames = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("error", "Aucun token trouvé. Veuillez vous connecter.");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(
        `http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/api/allgames`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setGameList(response.data);
    } catch (error) {
      if (error.response) {
        showToast(
          "error",
          error.response.data.error || "Erreur lors de la connexion22"
        );
        if (error.response.status === 401 || error.response.status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } else {
        showToast("error", "Erreur réseau");
        console.error("Erreur réseau:", error);
      }
    }
  };

  useEffect(() => {
    connectUser();
  }, []);

  useEffect(() => {
	const interval = setInterval(listAllGames, 8000);
	return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-indigo-800 rounded-lg opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-24 h-24 bg-violet-800 rounded-lg opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-blue-800 rounded-lg opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mt-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-caesar text-7xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 pb-4 drop-shadow-2xl">
            RED-TETRIS
          </h1>
          <div className="inline-block bg-indigo-900/60 backdrop-blur-md border-2 border-indigo-400/50 rounded-lg px-8 py-3 mt-4 shadow-lg shadow-indigo-500/30">
            <p className="text-xl text-indigo-200">
              Bienvenue <span className="font-bold text-violet-300">{playerName}</span>
            </p>
          </div>
        </div>

        {/* Games List */}
        <div className="mb-8 bg-slate-900/80 backdrop-blur-md border-2 border-indigo-500/50 rounded-2xl p-6 shadow-2xl shadow-indigo-900/50">
          <h3 className="text-2xl font-bold mb-4 text-indigo-200 flex items-center gap-2">
            <svg className="w-6 h-6 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
            Parties disponibles
          </h3>
          {gameList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-indigo-300 text-lg">Aucune partie pour le moment...</p>
            </div>
          ) : (
            <ul className="space-y-3 max-h-64 overflow-y-auto">
              {gameList.map((game, index) => (
                <li
                  onClick={() => navigate(`/games/${game.name}/${playerName}`)}
                  key={index}
                  className="bg-gradient-to-r from-indigo-900/60 to-violet-900/60 hover:from-indigo-800/80 hover:to-violet-800/80 p-4 rounded-xl border-2 border-indigo-500/30 hover:border-violet-400/60 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-violet-500/30 transform hover:scale-102"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-indigo-100 text-lg">{game.name}</span>
                    <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-400/50 px-3 py-1 rounded-full">
                      <svg className="w-4 h-4 text-violet-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                      </svg>
                      <span className="text-sm text-indigo-200 font-medium">
                        {game.players?.length || 0}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Create Game Form */}
        <div className="bg-slate-900/80 backdrop-blur-md border-2 border-violet-500/50 rounded-2xl p-8 shadow-2xl shadow-violet-900/50">
          <h3 className="text-2xl font-bold mb-6 text-indigo-200 text-center">Créer une nouvelle partie</h3>
          <div className="flex flex-col gap-4">
            <input
              className="w-full bg-slate-950/80 backdrop-blur-sm border-2 border-indigo-400/50 rounded-xl px-6 py-4 text-indigo-100 placeholder-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all text-lg"
              maxLength={10}
              placeholder="Nom de la partie..."
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
            />
            <button
              onClick={createGame}
              disabled={!gameName || !playerName}
              className="w-full bg-gradient-to-r from-indigo-700 to-violet-700 hover:from-indigo-600 hover:to-violet-600 disabled:from-slate-800 disabled:to-slate-700 disabled:cursor-not-allowed text-indigo-100 font-bold py-4 px-6 rounded-xl border-2 border-indigo-400/50 hover:border-violet-400 disabled:border-slate-600 transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-violet-500/50 text-lg"
            >
              {!gameName || !playerName ? "Remplissez le champ" : "Créer la partie"}
            </button>
          </div>
        </div>

        {/* Profile Link */}
        <div className="mt-8 text-center">
          <a
            href={`/profile/${playerName}`}
            className="inline-flex items-center gap-2 text-indigo-200 hover:text-violet-300 transition-colors duration-300 text-lg font-medium group border-2 border-indigo-500/50 hover:border-violet-400/80 px-6 py-2 bg-slate-900/60 backdrop-blur-sm rounded-lg"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
            </svg>
            Voir mon profil
          </a>
        </div>
      </div>
    </div>
  );
}

export default Home;