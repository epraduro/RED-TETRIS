import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // <- IMPORTANT

function Game() {
  const { gameName, playerName } = useParams(); 
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!gameName || socket) return;
    const newSocket = new WebSocket(`ws://localhost:4000/games/${gameName}`);
    
    newSocket.onopen = () => {
        newSocket.send(JSON.stringify({ type: 'join', player: playerName }));
    };

    newSocket.onmessage = (event) => {
    };

    newSocket.onclose = () => {
    };

    setSocket(newSocket);

    return () => {
    //   newSocket.close();
    };
  }, [gameName, socket]);

  return <div>Jeu: {gameName}</div>;
}

export default Game;