import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { showToast } from "../Toasts";
import { useEffect, useState } from "react";

function Profile() {
  const { playerName } = useParams();
  const [userGames, setUserGames] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const displayLimit = 5;

  const getUserGames = async () => {
    try {
      const response = await axios.get(
        `http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/api/getgames?name=${playerName}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setUserGames(response.data.games);
    } catch (error) {
      showToast("error", "Failed to fetch user games!");
    }
  };

  useEffect(() => {
    getUserGames();
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 pt-8 sm:pt-12 md:pt-16 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 sm:w-32 sm:h-32 bg-indigo-800 rounded-lg opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-16 h-16 sm:w-24 sm:h-24 bg-violet-800 rounded-lg opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 sm:w-20 sm:h-20 bg-blue-800 rounded-lg opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="font-caesar text-7xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 pb-4 drop-shadow-2xl">
            RED-TETRIS
          </h1>
          <div className="inline-block bg-indigo-900/60 backdrop-blur-md border-2 border-indigo-400/50 rounded-lg px-4 sm:px-6 md:px-8 py-2 sm:py-3 mt-4 shadow-lg shadow-indigo-500/30">
            <p className="text-lg text-indigo-200 break-words">
              Profil de{" "}
              <span className="font-bold text-violet-300">{playerName}</span>
            </p>
          </div>
        </div>

        {/* Profile Content */}
        <div className="bg-slate-900/80 backdrop-blur-md border-2 border-violet-500/50 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl shadow-violet-900/50">
          <h3 className="text-xl sm:text-2xl font-bold text-indigo-200 mb-4 sm:mb-6 text-center">
            Parties Sauvegardées
          </h3>

          {userGames.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-indigo-200 text-base sm:text-lg">
                Aucune partie sauvegardée trouvée.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-violet-500/50">
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-indigo-200 font-semibold text-sm sm:text-base">
                          Nom de la partie
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-indigo-200 font-semibold text-sm sm:text-base">
                          Score
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-indigo-200 font-semibold text-sm sm:text-base whitespace-nowrap">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(showAll
                        ? userGames
                        : userGames.slice(0, displayLimit)
                      ).map((game, index) => (
                        <tr
                          key={game.id}
                          className={`border-b border-violet-500/30 hover:bg-slate-800/50 transition-colors ${
                            index % 2 === 0
                              ? "bg-slate-950/30"
                              : "bg-slate-900/30"
                          }`}
                        >
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-indigo-100 text-sm sm:text-base break-words">
                            {game.name}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-indigo-100 text-sm sm:text-base">
                            {game.score}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-indigo-100 text-xs sm:text-sm whitespace-nowrap">
                            {new Date(game.date).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {userGames.length > displayLimit && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="inline-flex items-center gap-2 bg-violet-600/50 hover:bg-violet-600/70 text-indigo-100 font-medium px-4 py-2 rounded-lg transition-all duration-300 border border-violet-400/50 hover:border-violet-400"
                  >
                    {showAll ? (
                      <>
                        Voir moins
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </>
                    ) : (
                      <>
                        Voir tout ({userGames.length} parties)
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 sm:mt-8 text-center w-full">
          <div className="inline-block bg-slate-900/60 backdrop-blur-sm border-2 border-indigo-500/50 rounded-lg p-3 sm:p-4">
            <Link
              to="/home"
              className="inline-flex items-center gap-2 text-violet-300 hover:text-violet-200 transition-colors duration-300 font-medium underline text-sm sm:text-base"
            >
              ← Retour à la page d'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
