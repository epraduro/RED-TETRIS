import { addUser, getUser, getGame, createGame, updateGame } from './db.js'
import express  from 'express';
import cors from 'cors'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import http from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const games = new Map();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

const JWT_SECRET = 'coucou';

// Middleware pour vérifier le token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Required Token' , redirect: '/login'});
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Incorrect Token'});
      req.user = user;
      next();
  });
};

app.post('/api/register', async (req, res) => {
  const { name, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  if (!name || name.length < 2) {
    return res.status(200).json({ error: 'The name must be at least 2 characters long.' });
  }
  if (!password || password.length < 6) {
    return res.status(200).json({ error: 'The password must contain at least 6 characters.' });
  }

  const user = await addUser(name, hashedPassword);
  if (user) {
    const token = jwt.sign(
      { name },
      JWT_SECRET,
      { expiresIn: '1h'}
    );
    // res.json({token});
    // res.json({ token, redirect: '/home' });
    return res.json({ message: 'The player is successfully register', user, token });
  } else {
    return res.json({ error: 'These identifiers are already in use.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { name, password } = req.body;

  if (!name || name.length < 2) {
    return res.status(200).json({ error: 'The name must be at least 2 characters long.' });
  }
  if (!password || password.length < 6) {
    return res.status(200).json({ error: 'The password must contain at least 6 characters.' });
  }

  const user = await getUser(name);
  if (user) {
    const validPassword = bcrypt.compareSync(password, user.password);
    // console.log(validPassword);
    if (validPassword === false || validPassword === undefined) return res.status(200).json({ error: "Incorrect password"});
    // res.json({ message: 'Connexion réussie', redirect: '/home' });
    if (validPassword === true) return res.json({ message: 'The player is successfully connected', redirect: '/home' });
  } else {
    return res.json({ error: 'An error has uncurred' });
  }
});

app.get('/api/username', async (req, res) => {
  const user = await getUser()
});

// Route protégée pour la page d'accueil
app.get('/api/home', authenticateToken, (req, res) => {
  res.json({ message: 'Welcome to the home page', user: req.user });
});

app.post('/games/:room/:player_name', async (req, res) => {
    const { room, player_name } = req.params;
    console.log(room, player_name);
    try {
      
        let player = await getUser(player_name);
        if (!player) { return res.status(400).json({ error: 'Player not found!' });}
        
        let game = await getGame(room);
        if (!game) {
          // Créer une nouvelle partie avec player1
          game = await createGame(player_name, room);
          console.log(`New game created : ID ${game.name}`);
        } else {
            // Rejoindre comme player2 si disponible
            if (game.player1 === player.name) {
                return res.status(400).json({ error: 'Vous êtes déjà player1 dans cette partie' });
            }
            if (game.player2) {
                return res.status(409).json({ error: 'La partie est pleine' });
            }
            game.player2 = player.name;
            game.status = 'active';
            game = await updateGame(player.id, player.name);
            console.log(`Joueur ${player_name} rejoint la partie ${game.id} comme player2`);
        }

        res.status(201).json({ ...game.room, player_name }); // Retourne game_id et player_name
    } catch (error) {
        res.status(500).json({ error: `Erreur serveur : ${error.message}` });
    }
});

server.on('upgrade', (request, socket, head) => {
  const host = request.headers['host'] || 'localhost:4000';
  const url = new URL(request.url, `http://${host}`);
  const gameName = url.pathname.split('/games/')[1];

  if (!gameName || !url.pathname.startsWith('/games/')) {
    socket.destroy();
    return;
  }

  if (!games.has(gameName)) {
    games.set(gameName, new Set());
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request, gameName);
  });
});

wss.on('connection', (ws, request, gameName) => {
  const gameClients = games.get(gameName);

  // Ajouter le client au jeu
  gameClients.add(ws);
  console.log(`Client connecté au jeu: ${gameName}. Total: ${gameClients.size}`);

  // Message de bienvenue
  ws.send(JSON.stringify({ type: 'connected', message: 'Bienvenue !' }));

  // Réception de messages
  ws.on('message', (data) => {
    const message = JSON.parse(data);

    // Diffuser à tous les joueurs du même jeu
    gameClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          ...message,
          from: 'someone', // ou ajoute un ID joueur
        }));
      }
    });
  });

  // Déconnexion
  ws.on('close', () => {
    gameClients.delete(ws);
    console.log(`Client déconnecté du jeu: ${gameName}. Restants: ${gameClients.size}`);

    // Optionnel : nettoyer le jeu s'il est vide
    if (gameClients.size === 0) {
      games.delete(gameName);
      console.log(`Jeu ${gameName} supprimé (vide)`);
    }
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server start at http://localhost:${PORT}`);
});