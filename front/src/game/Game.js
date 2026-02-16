import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { showToast } from "../Toasts";
import { useNavigate, useLocation } from "react-router-dom";
import Grid from "./Grid";
import OpponentGrid from "./OpponentGrid";
import { io } from "socket.io-client";

function Game() {
  const { gameName, playerName } = useParams();
  const [gameStatus, setGameStatus] = useState("waiting");
  const [gameOwner, setGameOwner] = useState("");
  const [, setMessage] = useState("");
  const [dataGame, setDataGame] = useState(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  let keyPressedDownTime = null;
  let keyPressedSpaceTime = null;

  const { state } = useLocation();

  const normalMode = state?.normalMode
  const ghostMode = state?.ghostMode
  const crazyMode = state?.crazyMode

  const createGame = async () => {
    try {
      // const reponse = await axios.post(
      //   `http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/${gameName}/${playerName}`
      // );
      const response = await fetch(
        `http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/${gameName}/${playerName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            normalMode,
            ghostMode,
            crazyMode
          }),
        }
      );
      if (response.status === 201) console.log("game created.");
    } catch {
      showToast("error", "An error has occured!");
    }
  };

  useEffect(() => {
    if (!gameName || !playerName) return;

    if (!socketRef.current) {
      createGame().then(() => {
        const socket = io(`http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}`, {
          query: { gameName, playerName }
        });
        socketRef.current = socket;

        socket.on("connected", (data) => {
          setGameOwner(data.owner);
        });

        socket.on("started", (data) => {
          setGameStatus("started");
          setMessage(data.message);
          setDataGame(data.data);
          keyPressedDownTime = new Date().getTime();
          keyPressedSpaceTime = new Date().getTime();
        });

        socket.on("update", (data) => {
          setScore(data.data.players[playerName].score);
          setDataGame(data.data);
        });

        socket.on("error", (data) => {
          setMessage(data.message);
          showToast("error", data.message);
          navigate("/home");
        });

        socket.on("owner", (data) => {
          setGameOwner(data.message);
        });

        socket.on("updateMove", (data) => {
          setDataGame((prev) => {
            return {
              players: {
                ...(prev?.players ?? {}),
                [playerName]: data.data,
              },
              status: prev?.status,
              owner: prev?.owner,
            };
          });
        });

        socket.on("finished", async (data) => {
              try {
                await axios.post(
                  `http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/api/savegame`,
                  {
                    name: playerName,
                    score: data.data.players[playerName]?.score || 0,
                    gameName: gameName,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                  }
                );
                console.log("Game saved successfully when player lost");
              } catch (error) {
                console.error("Failed to save game:", error);
              }
            setGameStatus("finished");
            setDataGame(data.data);
        });

        socket.on("waiting", (data) => {
          setGameStatus("waiting");
          setDataGame(data.data);
        });
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const startGame = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("startGame");
    }
  };

  const movePiece = (x, y) => {
    socketRef.current.emit("move", { x, y });
  };

  const rotate = (z = 1) => {
    socketRef.current.emit("rotate", { z });
  };

  const restart = async () => {
    console.log("restart clicked");
    socketRef.current.emit("restart");
  };

  const spacebar = () => {
    socketRef.current.emit("spacebar");
  };

  const keydown = (e) => {
    // console.log("code:", e.code);
    if (e.code === "ArrowRight") {
      movePiece(0, 1);
    } else if (e.code === "ArrowLeft") {
      movePiece(0, -1);
    } else if (e.code === "ArrowDown") {
      // console.log("keyPressed:", keyPressedDownTime);
      if (Date.now() - keyPressedDownTime > 150) {
        movePiece(1, 0);
        keyPressedDownTime = Date.now();
        // console.log("Moved down at:", keyPressedDownTime);
      }
    } else if (e.code === "ArrowUp") {
      rotate();
    } else if (e.code === "Space") {
      if (Date.now() - keyPressedSpaceTime > 150) {
        spacebar();
        keyPressedSpaceTime = Date.now();
        // console.log("Spacebar pressed at:", keyPressedSpaceTime);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
    };
  }, [keydown]);

  const littleGame = (len) => {
    if (len <= 3) return true;
    else return false;
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-indigo-800 rounded-lg opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-24 h-24 bg-violet-800 rounded-lg opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-blue-800 rounded-lg opacity-20 animate-pulse"></div>
      </div>

      {/* Back to Home Link - Top Left */}
      <div className="absolute top-4 left-4 z-20">
        <a
          href="/home"
          className="inline-flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm border-2 border-indigo-500/50 rounded-lg px-4 py-2 text-violet-300 hover:text-violet-200 transition-colors duration-300 font-medium"
        >
          ← Retour à l'accueil
        </a>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-3">
          <p className="font-caesar text-4xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 pb-2 drop-shadow-2xl">
            RED-TETRIS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <div className="inline-block bg-indigo-900/60 backdrop-blur-md border-2 border-indigo-400/50 rounded-lg px-6 py-2 shadow-lg shadow-indigo-500/30">
              <p className="text-sm text-indigo-200">
                Nom de la salle: <span className="font-bold text-violet-300">{gameName}</span> | Joueur: <span className="font-bold text-violet-300">{playerName}</span>
              </p>
            </div>
            {gameStatus !== "waiting" && dataGame && (
              <div className="inline-block bg-indigo-900/60 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg px-4 py-2 shadow-lg shadow-yellow-500/30">
                <p className="text-sm font-bold text-yellow-400">
                  Score: {score}
                </p>
              </div>
            )}
          </div>
        </div>

        </div>

        {/* Game Content */}
        <div>
          {gameOwner !== playerName && gameStatus === "waiting" && (
            <div className="text-center py-12">
              <p className="text-2xl text-indigo-200 animate-pulse">En attente du démarrage de la partie...</p>
            </div>
          )}

          {gameOwner === playerName && gameStatus === "waiting" && (
            <div className="text-center py-12">
              <button 
                onClick={startGame}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-lg rounded-lg shadow-lg shadow-indigo-500/50 transition-all duration-300 transform hover:scale-105"
              >
                Démarrer la partie
              </button>
            </div>
          )}

          {gameStatus !== "waiting" && dataGame && (
            <div className="space-y-3">
              
              <div className="flex flex-col lg:flex-row gap-3 items-center lg:items-start justify-center">
                {/* OPPONENT GRIDS */}
                <div className="grid grid-cols-3 lg:grid-cols-2 gap-2 justify-items-center">
                  {Object.entries(dataGame.players).map((obj) => {
                    const [name, player] = obj;
                    if (name !== playerName) {
                      return (
                        <OpponentGrid
                          key={name}
                          playerName={name}
                          grid={player.opponentGrid}
                        />
                      );
                    }
                  })}
                </div>
                {/* PLAYER GRID */}
                <div className="relative">
                  <Grid
                    main={true}
                    grid={dataGame.players[playerName].grid}
                    playerBag={dataGame.players[playerName].bag}
                    mode={normalMode ? 'normalMode' : ghostMode ? 'ghostMode' : crazyMode ? 'crazyMode' : 'normalMode'}
                  />

                  {/* GAME OVER OVERLAY */}
                  {dataGame &&
                    gameStatus !== "waiting" &&
                    (dataGame?.players[playerName]?.lose || gameStatus === "finished") && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 rounded-2xl">
                        <div className="text-center space-y-6 p-4">
                          {dataGame?.players[playerName]?.lose ? (
                            <div className="bg-red-900/90 backdrop-blur-md border-2 border-red-500 rounded-2xl px-2 py-2 shadow-2xl shadow-red-500/50">
                              <p className="text-xl font-bold text-red-100">Vous avez perdu !</p>
                            </div>
                          ) : gameStatus === "finished" && dataGame?.players[playerName]?.lose === false ? (
                            <div className="bg-green-900/90 backdrop-blur-md border-2 border-green-500 rounded-2xl px-4 py-4 shadow-2xl shadow-green-500/50">
                              <p className="text-2xl font-bold text-green-100">Vous avez gagné !</p>
                            </div>
                          ) : null}

                          {gameStatus === "finished" && gameOwner === playerName && (
                            <button 
                              onClick={restart}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xl rounded-lg shadow-lg shadow-indigo-500/50 transition-all duration-300 transform hover:scale-105"
                            >
                              Redémarrer la partie !
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    // </div>
  );
}

export default Game;
