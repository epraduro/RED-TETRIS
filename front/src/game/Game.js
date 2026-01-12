import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { showToast } from "../Toasts";
import { useNavigate } from "react-router-dom";
import Grid from "./Grid";
import OpponentGrid from "./OpponentGrid";

function Game() {
  const { gameName, playerName } = useParams();
  const [gameStatus, setGameStatus] = useState("waiting");
  const [gameOwner, setGameOwner] = useState("");
  const [, setMessage] = useState("");
  const [dataGame, setDataGame] = useState(null);
  const wsRef = useRef(null);
  const navigate = useNavigate();

  const createGame = async () => {
    try {
      const reponse = await axios.post(
        `http://10.18.198.45:4000/games/${gameName}/${playerName}`
      );
      if (reponse.status === 201) console.log("game created.");
    } catch {
      showToast("error", "An error has occured!");
    }
  };

  useEffect(() => {
    if (!gameName || !playerName) return;

    if (!wsRef.current) {
      createGame().then(() => {
        const newSocket = new WebSocket(
          `ws://10.18.198.45:4000/games/${gameName}/${playerName}`
        );
        wsRef.current = newSocket;

        newSocket.onopen = () => {
          newSocket.send(JSON.stringify({ type: "join", player: playerName }));
        };

        newSocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "connected") setGameOwner(data.owner);
          else if (data.type === "started") {
            setGameStatus("started");
            setMessage(data.message);
            setDataGame(data.data);
          } else if (data.type === "update") {
            setDataGame(data.data);
          } else if (data.type === "error") {
            setMessage(data.message);
            showToast("error", data.message);
            navigate("/home");
          } else if (data.type === "owner") {
            setGameOwner(data.message);
          } else if (data.type === "updateMove") {
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
          } else if (data.type === "finished") {
            setGameStatus("finished");
            setDataGame(data.data);
          } else if (data.type === "waiting") {
            setGameStatus("waiting");
            setDataGame(data.data);
          }
        };

        newSocket.onclose = () => {};
      });
    }

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const startGame = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "startGame" }));
    }
  };

  const movePiece = (x, y) => {
    wsRef.current.send(JSON.stringify({ type: "move", x, y }));
  };

  const rotate = (z = 1) => {
    wsRef.current.send(JSON.stringify({ type: "rotate", z }));
  };

  const restart = () => {
    wsRef.current.send(JSON.stringify({ type: "restart" }));
  };

  const spacebar = () => {
    wsRef.current.send(JSON.stringify({ type: "spacebar" }));
  };

  const keydown = (e) => {
    // console.log("code:", e.code);
    if (e.code === "ArrowRight") {
      movePiece(0, 1);
    } else if (e.code === "ArrowLeft") {
      movePiece(0, -1);
    } else if (e.code === "ArrowDown") {
      movePiece(1, 0);
    } else if (e.code === "ArrowUp") {
      rotate();
    } else if (e.code === "Space") {
      spacebar();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
    };
  }, []);

  return (
    <>
      <div className="flex flex-center justify-center items-center flex-col w-full h-full bg-gray-500">
        <div>
          Jeu: {gameName}, player: {playerName}
        </div>

        {gameOwner !== playerName && gameStatus === "waiting" && (
          <p> Waiting for the game </p>
        )}

        {gameOwner === playerName && gameStatus === "waiting" && (
          <button onClick={startGame}>Démarrer la partie</button>
        )}

        {gameStatus !== "waiting" && dataGame && (
          <>
            <div className="flex justify-between gap-8">
              <Grid
                main={true}
                grid={dataGame.players[playerName].grid}
                playerBag={dataGame.players[playerName].bag}
                w="30px"
                h="30px"
              />

              {Object.entries(dataGame.players).map((obj) => {
                const [name, player] = obj;
                // console.log("player name:", name)
                if (name !== playerName) {
                  return (
                    <OpponentGrid
                      key={name}
                      playerName={name}
                      grid={player.opponentGrid}
                      w="10px"
                      h="10px"
                    />
                  );
                }
              })}
            </div>
          </>
        )}

        {dataGame &&
          gameStatus !== "waiting" &&
          dataGame?.players[playerName]?.lose && <p> You loose the game !</p>
        }

        {/* {dataGame &&
          gameStatus === "finished" &&
          dataGame?.players[playerName]?.lose && <p> You loose the game !</p>} */}

        {dataGame &&
          gameStatus === "finished" &&
          dataGame?.players[playerName]?.lose === false && (
            <p> You win the game !</p>
        )}

        {dataGame && gameStatus === "finished" && gameOwner === playerName && (
          <button onClick={restart}> Restart game ! </button>
        )}
      </div>
    </>
  );
}

export default Game;
