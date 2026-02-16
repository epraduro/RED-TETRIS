import { useEffect, useState } from "react";
import axios from "axios";
import { showToast } from "./Toasts";
import { useNavigate } from "react-router-dom";

function Home() {
  const [gameName, setGameName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const navigate = useNavigate();
  const [gameList, setGameList] = useState([]);
  const [normalMode, setNormalMode] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);
  const [crazyMode, setCrazyMode] = useState(false);
  const [selectedMode, setSelectedMode] = useState("normal");

  const modeDescriptions = {
    normal: "Le mode de jeu classique de Tetris. Jouez à votre rythme et empilez les pièces pour créer des lignes.",
    ghost: "Un mode de jeu où la pièce actuelle est invisible jusqu'à ce qu'elle touche le sol, ajoutant un défi supplémentaire !",
    crazy: "Un mode de jeu intense avec une vitesse de jeu accélérée !"
  };

  const createGame = async () => {
    navigate(
      `/${gameName}/${playerName}`, {
        state: {
          normalMode,
          ghostMode,
          crazyMode
        }
      }
    );
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

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await axios.post(
        `http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/api/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      localStorage.removeItem("token");
      showToast("success", "Déconnexion réussie");
      navigate("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Même en cas d'erreur, on déconnecte localement
      localStorage.removeItem("token");
      navigate("/login");
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
    <div className="h-full w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex flex-col items-center justify-center p-8 relative">
      {/* Animated background elements */}
      <div className="absolute h-full inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-indigo-800 rounded-lg opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-24 h-24 bg-violet-800 rounded-lg opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-blue-800 rounded-lg opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 h-full w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10 sm:mt-10 relative">
          <h1 className="font-caesar text-7xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 pb-8 drop-shadow-2xl">
            RED-TETRIS
          </h1>
          <div className="flex flex-col items-center mt-4 gap-10">
            <div className="inline-block bg-indigo-900/60 backdrop-blur-md border-2 border-indigo-400/50 rounded-lg px-8 py-3 mt-4 shadow-lg shadow-indigo-500/30">
              <p className="text-xl text-indigo-200">
                Bienvenue{" "}
                <span className="font-bold text-violet-300">{playerName}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href={`/profile/${playerName}`}
                className="inline-flex items-center gap-2 text-indigo-200 hover:text-violet-300 transition-colors duration-300 text-lg font-medium group border-2 border-indigo-500/50 hover:border-violet-400/80 px-3 py-2 bg-slate-900/60 backdrop-blur-sm rounded-lg"
              >
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                Voir mon profil
              </a>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-red-300 hover:text-red-400 transition-colors duration-300 text-lg font-medium group border-2 border-red-500/50 hover:border-red-400/80 px-3 py-2 bg-slate-900/60 backdrop-blur-sm rounded-lg"
              >
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                    clipRule="evenodd"
                  />
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        {/* Games List */}
        <div className="mb-8 bg-slate-900/80 backdrop-blur-md border-2 border-indigo-500/50 rounded-2xl p-6 shadow-2xl shadow-indigo-900/50">
          <h3 className="text-2xl font-bold mb-4 text-indigo-200 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-violet-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
            Parties disponibles
          </h3>
          {gameList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-indigo-300 text-lg">
                Aucune partie pour le moment...
              </p>
            </div>
          ) : (
            <ul className="space-y-3 max-h-64 overflow-y-auto">
              {gameList.map((game, index) => (
                <li
                  onClick={() => navigate(`/${game.name}/${playerName}`)}
                  key={index}
                  className="bg-gradient-to-r from-indigo-900/60 to-violet-900/60 hover:from-indigo-800/80 hover:to-violet-800/80 p-4 rounded-xl border-2 border-indigo-500/30 hover:border-violet-400/60 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-violet-500/30 transform hover:scale-102"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-indigo-100 text-lg">
                        {game.name}
                    </span>
                    <span className="text-sm text-white font-medium  tracking-wide">
                      {game.mode === 'normalMode' && 'Niveau: Normal'}
                      {game.mode === 'ghostMode' && ' Niveau: Ghost'}
                      {game.mode === 'crazyMode' && 'Niveau: Crazy'}
                    </span>
                    <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-400/50 px-3 py-1 rounded-full">
                      <svg
                        className="w-4 h-4 text-violet-300"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span className="text-sm text-indigo-200 font-medium">
                        {game.playerCount}
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
          <h3 className="text-2xl font-bold mb-6 text-indigo-200 text-center">
            Créer une nouvelle partie
          </h3>
          <div className="flex flex-col gap-4">
            <input
              className="w-full bg-slate-950/80 backdrop-blur-sm border-2 border-indigo-400/50 rounded-xl px-6 py-4 text-indigo-100 placeholder-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-all text-lg"
              maxLength={10}
              placeholder="Nom de la partie..."
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
            />
            
            {/* Custom Select Wrapper */}
            <div className="relative group">
              <select
                className="w-full bg-slate-950/80 border-2 border-indigo-400/50 rounded-xl px-6 py-4 pr-12 text-indigo-100 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 hover:border-indigo-400/80 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 text-lg cursor-pointer appearance-none font-semibold"
                value={selectedMode}
                onChange={(e) => {
                  const mode = e.target.value;
                  setSelectedMode(mode);

                  if (mode === "normal") {
                    setNormalMode(true);
                    setGhostMode(false);
                    setCrazyMode(false);
                  } else if (mode === "ghost") {
                    setGhostMode(true);
                    setNormalMode(false);
                    setCrazyMode(false);
                  } else if (mode === "crazy") {
                    setCrazyMode(true);
                    setNormalMode(false);
                    setGhostMode(false);
                  }
                }}
              >
                <option value="normal" className="bg-slate-900 text-indigo-100 py-3 hover:bg-indigo-800">Mode Normal</option>
                <option value="ghost" className="bg-slate-900 text-indigo-100 py-3 hover:bg-indigo-800">Mode Ghost</option>
                <option value="crazy" className="bg-slate-900 text-indigo-100 py-3 hover:bg-indigo-800">Mode Crazy</option>
              </select>
              
              {/* Custom Arrow Icon */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg 
                  className="w-6 h-6 text-violet-400 group-hover:text-violet-300 transition-colors duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Mode Description */}
            <div className="bg-indigo-950/40 backdrop-blur-sm border-2 border-indigo-400/30 rounded-xl px-6 py-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-indigo-200 text-sm leading-relaxed">
                  {modeDescriptions[selectedMode]}
                </p>
              </div>
            </div>
            <button
              onClick={createGame}
              disabled={!gameName || !playerName}
              className="w-full bg-gradient-to-r from-indigo-700 to-violet-700 hover:from-indigo-600 hover:to-violet-600 disabled:from-slate-800 disabled:to-slate-700 disabled:cursor-not-allowed text-indigo-100 font-bold py-4 px-6 rounded-xl border-2 border-indigo-400/50 hover:border-violet-400 disabled:border-slate-600 transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-violet-500/50 text-lg"
            >
              {!gameName || !playerName
                ? "Remplissez le champ"
                : "Créer la partie"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
