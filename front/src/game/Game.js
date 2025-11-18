import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom'; // <- IMPORTANT
import Grid from "./Grid";

function Game() {
  const { gameName, playerName } = useParams(); 
  const [gameStatus, setGameStatus] = useState('waiting');
  const [gameOwner, setGameOwner] = useState("");
  const wsRef = useRef(null);

  useEffect(() => {
    if (!gameName || !playerName) return;

    if (!wsRef.current){
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
          console.log('Partie commencée !');
        }
      };

      newSocket.onclose = () => {
      };
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
    <div className='flex flex-center justify-center items-center flex-col w-full h-full bg-gray-500'>
      <div>Jeu: {gameName}, player: {playerName}</div>


      {gameOwner === playerName && gameStatus === 'waiting' && (
        <button onClick={startGame}>Démarrer la partie</button>
      )}

      {gameStatus === 'started' && (
        <Grid/>
        // <p style={{ color: 'green' }}>La partie est en cours !</p>
      )}
    </div>
    </>
);
}

export default Game;