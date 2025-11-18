import { addUser, getUser, getGame, createGame, updateGame, addToken, delGame, deleteToken, verifyToken } from "./db.js";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import http from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const games = new Map();

// import { pieces, piecesColors } from "./Pieces.js";
import { addPlayer, removePlayer } from "./game/PlayerManagment.js";

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

const JWT_SECRET = "71dac283b6f89a9e6251c597c3f5e3c0";

// Middleware pour vérifier le token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ error: "Required Token", redirect: "/login" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Incorrect Token" });
    req.user = user;
    next();
  });
};

// app.get("/api/pieces", (req, res) => {
//   res.json({ pieces, piecesColors });
// });

app.post("/api/register", async (req, res) => {
  const { name, password } = req.body;

  if (!name || name.length < 2) {
    return res
      .status(200)
      .json({ error: "The name must be at least 2 characters long." });
  }
  if (!password || password.length < 6) {
    return res
      .status(200)
      .json({ error: "The password must contain at least 6 characters." });
  }

  try {
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ajouter l'utilisateur
    const user = await addUser(name, hashedPassword);

    // Générer le token JWT
    const token = jwt.sign({ name: user.name, id: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Mettre à jour le token dans la base
    await addToken(token, user.name);

    // Renvoyer le token et une indication pour le frontend
    res.status(201).json({
      message: "Utilisateur enregistré avec succès",
      user: { id: user.id, name: user.name },
      token,
      redirect: "/home", // Pour React Router
    });
  } catch (error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Ce nom est déjà utilisé." });
    }
    console.error("Erreur serveur:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement." });
  }
});

app.post("/api/login", async (req, res) => {
  const { name, password } = req.body;

  if (!name || name.length < 2) {
    return res
      .status(200)
      .json({ error: "The name must be at least 2 characters long." });
  }
  if (!password || password.length < 6) {
    return res
      .status(200)
      .json({ error: "The password must contain at least 6 characters." });
  }

  const user = await getUser(name);
  if (user) {
    const validPassword = bcrypt.compareSync(password, user.password);

    if (validPassword === false || validPassword === undefined)
      return res.status(200).json({ error: "Incorrect password" });
    if (validPassword === true) {
      if (user.token === null)
      {
        const token = jwt.sign({ name: user.name, id: user.id }, JWT_SECRET, {
          expiresIn: "1h",
        });

        await addToken(token, user.name);

        return res.status(201).json({
          message: "The player is successfully connected2",
          user: { id: user.id, name: user.name},
          token
        });
      } else {
        await verifyToken(user, JWT_SECRET);
        const updateUser = await getUser(name);
        return res.status(201).json({
            message: "The player is successfully connected",
            updateUser: { id: updateUser.id, name: updateUser.name},
            token: updateUser.token
          });
      }
    }
  } else {
    return res.json({ error: "An error has uncurred" });
  }
});

app.get("/api/home", authenticateToken, (req, res) => {
  res.json({ message: "Welcome to the home page", user: req.user });
});

app.post('/games/:room/:player_name', async (req, res) => {
    const { room, player_name } = req.params;
    console.log(room, player_name);
    try {
      
        let player = await getUser(player_name);
        if (!player) { return res.status(400).json({ error: 'Player not found!' });}
        
        let game = await getGame(room);
        if (!game) {
          game = await createGame(player_name, room);
          console.log(`New game created : ID ${game.name}`);
          if (game.id)
            games.set(game.id, new Set());
        }
        res.status(201).json({ ...game.room, player_name });
    } catch (error) {
        res.status(500).json({ error: `Erreur serveur : ${error.message}` });
    }
});

const updateQueryGame = async (column, value, id) => 
{
  const query = `UPDATE games SET ${column} = ? WHERE id = ?`;
  const game = await updateGame(query, value, id);
  return game;
}

const getGameValue = async (gameName) => {
  const game = await getGame(gameName);
  return game
}

server.on('upgrade', async (request, socket, head) => {
  const host = request.headers['host'] || 'localhost:4000';
  const url = new URL(request.url, `http://${host}`);
  const parts = url.pathname.split('/');
  let players = [];

  if (parts.length !== 4 || parts[1] !== 'games')
  {
    console.log('URL invalide:', url.pathname);
    socket.destroy();
    return;
  }

  const gameName = parts[2];
  const playerName = parts[3];
  
  if (!gameName || !url.pathname.startsWith('/games/')) 
  {
    socket.destroy();
    return;
  }

  const game = await getGameValue(gameName);
  if (!game) 
  {
    console.log('Partie inexistante');
    socket.destroy();
    return;
  }
  
  if (!game.id)
  {
    console.log("Error with the id!");
    socket.destroy();
    return; 
  }
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request, players, game, playerName);
  });
});

wss.on('connection', (ws, request, players, game, playerName) => {
  // const gameClients = games.get(game.id);
  players = games.get(game.id);
  players = addPlayer(players, playerName, ws);
  games.set(game.id, players);

  // gameClients.add(ws);
  console.log(`Client connecté au jeu: ${game.name}. Total: ${players.length}`);
  console.log(games);
  ws.send(JSON.stringify({ type: 'connected', message: 'Bienvenue !', owner: `${game.owner}` }));

  ws.on('message', async (data) => {
    const msg = JSON.parse(data);

    if (msg.type === 'startGame')
    {
      await updateQueryGame('status', 'started', game.id);
      broadCastToGame(game.id, 'started', 'game has started');
    }

  });

  ws.on('close', async () => {
    game = await getGame(game.name);
    console.log('CLOSE DÉCLENCHÉ !');

    players = games.get(game.id);
    players = removePlayer(players, playerName);
    games.set(game.id, players);
    players = games.get(game.id);
    console.log(`Client déconnecté du jeu: ${game.name}. Restants: ${players.length}`);

  
    if (players.length > 0 && players[0]) {
      game = await updateQueryGame('owner', players[0].name, game.id);
    }

    if (players.length === 0) {
      await delGame(game.id, playerName);
      games.delete(game.id);
      console.log(`Jeu ${game.name} supprimé (vide)`);
    }

    // if (game.owner === playerName && game.player1 === playerName && game.player2 ){
    //   game = await updateQueryGame("owner", game.player2, 'waiting', game.id);
    // }
    // else if (game.owner == playerName && game.player2 == playerName && game.player1) {
    //   game = await updateQueryGame("owner", game.player1, 'waiting', game.id);
    // }
  
    // if (playerName === game.player1)
    //   game = await updateQueryGame("player1", null, 'waiting', game.id);
    // else if (playerName === game.player2)
    //   game = await updateQueryGame("player2", null, 'waiting', game.id);
  
    // if (!game.player1 && !game.player2) 
    // {
    //   delGame(game.id, playerName);
    //   games.delete(game.id);
    //   console.log(`Jeu ${gameName} supprimé (vide)`);
    // } 
  });

  // Déconnexion
});

export const broadCastToGame = (id, type, message) =>{
  const game = games.get(id);
  if (!game) return;

  game.forEach(player => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({type: `${type}`, message: `${message}`}));
    }
  });
}

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server start at http://localhost:${PORT}`);
});
