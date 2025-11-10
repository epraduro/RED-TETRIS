import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios";
import { showToast } from "../Toasts";
import { useNavigate } from "react-router-dom";

function Game() {
  const { gameName, playerName } = useParams(); 
  const [gameStatus, setGameStatus] = useState('waiting');
  const [gameOwner, setGameOwner] = useState("");
  const [message, setMessage] = useState("");
  const wsRef = useRef(null);
  const navigate = useNavigate();

  const createGame = async () => {
    try {
			const reponse = await axios.post(`http://localhost:4000/games/${gameName}/${playerName}`);
			if (reponse.status == 201)
        console.log('game created.');
		}
		catch {
			showToast('error', 'An error has occured!');
		}
  }

  useEffect(() => {
    if (!gameName || !playerName) return;

    if (!wsRef.current){
      createGame().then(() => {
        const newSocket = new WebSocket(`ws://localhost:4000/games/${gameName}/${playerName}`);
        wsRef.current = newSocket;
  
        newSocket.onopen = () => {
            newSocket.send(JSON.stringify({ type: 'join', player: playerName }));
        };
  
        newSocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log(data);
          if (data.type === 'connected')
            setGameOwner(data.owner);
          else if (data.type === 'started') {
            setGameStatus('started');
            setMessage(data.message);
            console.log('Partie commencée !');
          }
        };
  
        newSocket.onclose = () => {
        };
      });
    }

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [gameName, playerName]);

  const startGame = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'startGame' }));
    }
  };

  return (
    <>
      <div>Jeu: {gameName}, player: {playerName}</div>


      {gameOwner === playerName && gameStatus === 'waiting' && (
        <button onClick={startGame}>Démarrer la partie</button>
      )}

      {gameStatus === 'started' && (
        <p style={{ color: 'green' }}>{message}</p>
      )}
    </>
);
}

export default Game;