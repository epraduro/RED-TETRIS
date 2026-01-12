import { addUser, getUser, addToken, deleteToken, verifyToken, saveGame, getUserGames } from "./db.js";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import http, { get } from 'http';
import { WebSocketServer } from 'ws';
import { Player } from './Player.js';
import { Game } from "./Game.js";
import { games, getGameValue } from "./game/GameManagment.js";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
// const games = new Map();

// import { pieces, piecesColors } from "./Pieces.js";
import { removePlayer } from "./game/PlayerManagment.js";

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
    // console.log(room, player_name);
    try {
      
        let player = await getUser(player_name);
        if (!player) { return res.status(400).json({ error: 'Player not found!' });}
        
        let game = getGameValue(room);
        if (!game) {
          const id = games.size > 0 ? Math.max(...[...games].map(g => g.id)) + 1 : 1;
          game = new Game(id, room, player_name, 'waiting');
          if (game.id)
            games.add(game);
        }
        res.status(201).json({ ...game.room, player_name });
    } catch (error) {
        res.status(500).json({ error: `Erreur serveur : ${error.message}` });
    }
});


server.on('upgrade', async (request, socket, head) => {
  const host = request.headers['host'] || '10.18.192.97:4000';
  const url = new URL(request.url, `http://${host}`);
  const parts = url.pathname.split('/');
  let players = [];

  if (parts.length !== 4 || parts[1] !== 'games')
  {
    // console.log('URL invalide:', url.pathname);
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
  const game = getGameValue(gameName);
  if (!game) 
  {
    // console.log('Partie inexistante');
    socket.destroy();
    return;
  }
  
  if (!game.id)
  {
    // console.log("Error with the id!");
    socket.destroy();
    return; 
  }

  // players = games.get(game.id) || [];
  // const existingPlayer = players.find(p => p.name === playerName);
  // if (existingPlayer) {
  //   ws.send(JSON.stringify({
  //     type: 'error',
  //     message: 'Already connected to the game!'
  //   }));
  //   ws.close(1008, 'Already connected');
  //   console.log(`Connexion refusée: ${playerName} déjà dans la partie`);
  //   return;
  // }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request, players, game, playerName);
  });
});

wss.on('connection', (ws, request, players, game, playerName) => {
  const status = game.status;
  if (status === 'started'){
    ws.send(JSON.stringify({ type: 'error', message: 'Game has already started!' }));
    ws.close(1008);
    return;
  }
  players = game.players;
  const existing = [...players].find(p => p.name === playerName);
  if (existing) {
    ws.send(JSON.stringify({ type: 'error', message: 'Player already connected to this game!' }));
    ws.close(1008);
    return;
  }
  let player = new Player(playerName, ws, game.createRand());
  game.players.push(player);

  // console.log(`Client connecté au jeu: ${game.name}. Total: ${game.players.length}`);
  ws.send(JSON.stringify({ type: 'connected', message: 'Bienvenue !', owner: `${game.owner}` }));

  ws.on('message', async (data) => {
    const msg = JSON.parse(data);

    if (msg.type === 'startGame')
    {
      game.status = "started";
      game.broadcast("started", { data: game.forSend() })
      game.start()
    }
    if (msg.type === "move") {
      player.movePiece(msg.x, msg.y)
    }
    if (msg.type === "rotate") {
      player.drawRotatedPiece()
    }
    if (msg.type === "restart") {
      // console.log("restart")
      game.restart()
    }
    if (msg.type === "spacebar") {
      player.spacebar()
    }
  });

  ws.on('close', () => {
    game = getGameValue(game.name);
    // console.log('CLOSE DÉCLENCHÉ !');

    game.players = removePlayer(players, playerName);
    // console.log(`Client déconnecté du jeu: ${game.name}. Restants: ${game.players.length}`);

  
    if (game.players.length > 0 && game.players[0]) {
      game.owner = game.players[0].name;
      game.broadcast('owner', {message: `${game.owner}`})
    }

    if (game.players.length === 0) {
      games.delete(game);
      // console.log(`Jeu ${game.name} supprimé (vide)`);
    }
  });
});

app.post('/api/savegame', authenticateToken, async (req, res) => {
  const { name, score, gameName } = req.body;

  let user_id = (await getUser(name)).id;

  if (!user_id || !score) {
    return res.status(400).json({ error: 'Missing user_id or score' });
  }

  try {
    await saveGame(user_id, score, gameName);
    res.status(201).json({ message: 'Game saved successfully' });
  } catch (error) {
    console.error('Error saving game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/getgames', authenticateToken, async (req, res) => {
  const { name } = req.query;

  console.log("Fetching games for user:", name);

  const user = await getUser(name);

  if (!user?.id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }
  const games = await getUserGames(user?.id);

  if (!games) {
    return res.status(400).json({ error: 'No games found for this user' });
  }
  res.status(200).json({ games });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server start at http://10.18.192.97:${PORT}`);
});
