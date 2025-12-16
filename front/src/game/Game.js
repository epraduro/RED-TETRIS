import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { showToast } from "../Toasts";
import { useNavigate } from "react-router-dom";
import Grid from "./Grid";

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
        `http://localhost:4000/games/${gameName}/${playerName}`
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
          `ws://localhost:4000/games/${gameName}/${playerName}`
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

  const keydown = (e) => {
    if (e.code === "ArrowRight") {
      movePiece(0, 1);
    } else if (e.code === "ArrowLeft") {
      movePiece(0, -1);
    } else if (e.code === "ArrowDown") {
      movePiece(1, 0);
    } else if (e.code === "ArrowUp") {
      rotate();
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
            {console.log("GAMESTATUS:", gameStatus)}
            <Grid
              grid={dataGame.players[playerName].grid}
              playerBag={dataGame.players[playerName].bag}
            />
          </>
        )}

        {dataGame &&
          gameStatus === "finished" &&
          dataGame?.players[playerName]?.lose && <p> You loose the game !</p>}

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
