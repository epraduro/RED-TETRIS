import { addUser, getUser, addToken, deleteToken, verifyToken, saveGame, getUserGames, updateUserMode, deleteUser } from "./db.js";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import http from "http";
import { Server } from "socket.io";
import { Player } from "./Player.js";
import { Game } from "./Game.js";
import { games, getGameValue } from "./game/GameManagment.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
import { removePlayer } from "./game/PlayerManagment.js";

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// Servir les fichiers statiques du front-end
app.use(express.static(path.join(__dirname, "../front/build")));

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ error: "Required Token", redirect: "/login" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Incorrect Token" });
    req.user = user;
    next();
  });
};

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
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await addUser(name, hashedPassword);

    if (user === null) {
      return res.status(200).json({ error: "This username is already taken." });
    }

    const token = jwt.sign({ name: user.name, id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7h",
    });

    await addToken(token, user.name);

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, name: user.name },
      token,
      redirect: "/home",
    });
  } catch (error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "This username is already taken." });
    }
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error during registration." });
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
      if (user.token === null) {
        const token = jwt.sign({ name: user.name, id: user.id }, process.env.JWT_SECRET, {
          expiresIn: "7h",
        });

        await addToken(token, user.name);

        return res.status(201).json({
          message: "The player is successfully connected",
          user: { id: user.id, name: user.name },
          token,
        });
      } else {
        await verifyToken(user, process.env.JWT_SECRET);
        const updateUser = await getUser(name);
        return res.status(201).json({
          message: "The player is successfully connected",
          updateUser: { id: updateUser.id, name: updateUser.name },
          token: updateUser.token,
        });
      }
    }
  } else {
    return res.json({
      error: "You don't have an account yet, please register.",
    });
  }
});

app.post("/api/logout", authenticateToken, async (req, res) => {
  try {
    const userName = req.user.name;
    await deleteToken(userName);

    res.status(200).json({
      message: "Déconnexion réussie",
      redirect: "/login",
    });
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    res.status(500).json({ error: "Erreur serveur lors de la déconnexion" });
  }
});

app.get("/api/home", authenticateToken, (req, res) => {
  res.json({ message: "Welcome to the home page", user: req.user });
});

app.post("/api/savegame", authenticateToken, async (req, res) => {
  const { name, score, gameName } = req.body;

  let user_id = (await getUser(name)).id;

  if (!user_id || score === null) {
    return res.status(400).json({ error: "Missing user_id or score" });
  }

  try {
    await saveGame(user_id, score, gameName, name);
    res.status(201).json({ message: "Game saved successfully" });
  } catch (error) {
    console.error("Error saving game:", error);
    res.status(500).json({    error: "Internal server error" });
  }
});

// Handler partagé pour la création de room/game
const roomPlayerHandler = async (req, res) => {
  const { room, player_name } = req.params;

  const { normalMode, ghostMode, crazyMode } = req.body;

  try {
    let player = await getUser(player_name);
    let isFictive = false;

    // Check authorization header to identify the connected user
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let connectedUser = null;
    
    if (token) {
      try {
        connectedUser = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        // Token invalide, on continue sans utilisateur connecté
        console.log("Invalid token:", err.message);
      }
    }

    if (player) {
      // Player exists in DB
      if (!connectedUser || connectedUser.name !== player_name) {
        // The player exists but is not the connected user -> error
        return res.status(403).json({ error: "This username belongs to another registered user. Please use your own username." });
      }
      // The player exists and is the connected user -> OK
    } else {
      // Player does not exist in DB -> create a fictive user
      const fictivePassword = "fictive_" + Date.now();
      const bcryptHash = await bcrypt.hash(fictivePassword, 10);
      player = await addUser(player_name, bcryptHash);
      if (!player) {
        return res.status(400).json({ error: "Failed to create temporary user." });
      }
      isFictive = true;
    }

    let game = getGameValue(room);
    if (!game) {
      const id =
        games.size > 0 ? Math.max(...[...games].map((g) => g.id)) + 1 : 1;
      if (normalMode === true) {
        await updateUserMode(player_name, "normalMode");
        game = new Game(id, room, player_name, "waiting", "normalMode");
      } else if (ghostMode === true) {
        await updateUserMode(player_name, "ghostMode");
        game = new Game(id, room, player_name, "waiting", "ghostMode");
      } else if (crazyMode === true) {
        await updateUserMode(player_name, "crazyMode");
        game = new Game(id, room, player_name, "waiting", "crazyMode");
      } else {
        await updateUserMode(player_name, "normalMode");
        game = new Game(id, room, player_name, "waiting", "normalMode");
      }
      if (game.id) games.add(game);
    }
    res
      .status(201)
      .json({ ...game.room, player_name, normalMode, ghostMode, crazyMode, isFictive });
  } catch (error) {
    res.status(500).json({ error: `Error server: ${error.message}` });
  }
};

app.post("/api/:room/:player_name", roomPlayerHandler);

app.get("/api/allgames", authenticateToken, (req, res) => {
  try {
    const gamesArray = Array.from(games).map((game) => game.forSend());
    res.json(gamesArray);
  } catch (error) {
    res.status(500).json({ error: `Error server: ${error.message}` });
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  const { gameName, playerName } = socket.handshake.query;
  
  if (!gameName || !playerName) {
    socket.emit("error", { message: "Missing gameName or playerName" });
    socket.disconnect();
    return;
  }

  const game = getGameValue(gameName);
  if (!game) {
    socket.emit("error", { message: "Game not found!" });
    socket.disconnect();
    return;
  }

  const status = game.status;
  if (status === "started") {
    socket.emit("error", { message: "Game has already started!" });
    socket.disconnect();
    return;
  }

  const existing = game.players.find((p) => p.name === playerName);
  if (existing) {
    socket.emit("error", { message: "Player already connected to this game!" });
    socket.disconnect();
    return;
  }

  const player = new Player(playerName, socket, game.createRand(), game.mode);
  game.players.push(player);

  // Track if this player is fictive (not in DB with a token)
  let isFictivePlayer = false;
  (async () => {
    const dbUser = await getUser(playerName);
    if (dbUser && !dbUser.token) {
      isFictivePlayer = true;
    }
  })();

  socket.emit("connected", {
    message: "Welcome!",
    owner: game.owner,
  });

  socket.on("startGame", async () => {
    game.status = "started";
    game.broadcast("started", { data: game.forSend() });
    game.start();
  });

  socket.on("move", (data) => {
    if (game.status !== "finished") player.movePiece(data.x, data.y);
  });

  socket.on("rotate", () => {
    if (game.status !== "finished") player.drawRotatedPiece();
  });

  socket.on("restart", () => {
    game.restart();
  });

  socket.on("spacebar", () => {
    player.spacebar();
  });

  socket.on("disconnect", async () => {
    const currentGame = getGameValue(game.name);
    if (!currentGame) return;

    currentGame.players = removePlayer(currentGame.players, playerName);

    if (currentGame.players.length > 0 && currentGame.players[0]) {
      currentGame.owner = currentGame.players[0].name;
      currentGame.broadcast("owner", { message: currentGame.owner });
    }

    if (currentGame.players.length === 0) {
      games.delete(currentGame);
    }

    // Clean up fictive user from DB
    if (isFictivePlayer) {
      try {
        await deleteUser(playerName);
        console.log(`Fictive user '${playerName}' deleted from DB.`);
      } catch (err) {
        console.error(`Error deleting fictive user '${playerName}':`, err);
      }
    }
  });
});

app.get("/api/getgames", authenticateToken, async (req, res) => {
  const { name } = req.query;

  const user = await getUser(name);

  if (!user?.id) {
    return res.status(400).json({ error: "Missing user_id" });
  }
  const games = await getUserGames(user?.id);

  if (!games) {
    return res.status(400).json({ error: "No games found for this user" });
  }
  res.status(200).json({ games });
});

// Route catch-all pour le SPA (doit être après les routes API)
// Cette route ne doit servir l'HTML que pour les routes valides du frontend
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../front/build", "index.html"));
});

// Proxy route pour servir la route game sans /api dans l'URL
// Doit être après la route catch-all GET
app.post("/:room/:player_name", roomPlayerHandler);

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server start at http://${process.env.HOST}:${PORT}`);
});
