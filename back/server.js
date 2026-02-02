import { addUser, getUser, addToken, deleteToken, verifyToken, saveGame, getUserGames, updateUserMode } from "./db.js";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import http from "http";
import { WebSocketServer } from "ws";
import { Player } from "./Player.js";
import { Game } from "./Game.js";
import { games, getGameValue } from "./game/GameManagment.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
import { removePlayer } from "./game/PlayerManagment.js";

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

const JWT_SECRET = "71dac283b6f89a9e6251c597c3f5e3c0";

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

    const token = jwt.sign({ name: user.name, id: user.id }, JWT_SECRET, {
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
        const token = jwt.sign({ name: user.name, id: user.id }, JWT_SECRET, {
          expiresIn: "7h",
        });

        await addToken(token, user.name);

        return res.status(201).json({
          message: "The player is successfully connected",
          user: { id: user.id, name: user.name },
          token,
        });
      } else {
        await verifyToken(user, JWT_SECRET);
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

app.post("/games/:room/:player_name", async (req, res) => {
  const { room, player_name } = req.params;

  const { normalMode, ghostMode, crazyMode } = req.body;

  console.log("crazyMode:", crazyMode);

  try {
    let player = await getUser(player_name);
    if (!player) {
      return res.status(400).json({ error: "Player not found!" });
    }

    let game = getGameValue(room);
    if (!game) {
      const id =
        games.size > 0 ? Math.max(...[...games].map((g) => g.id)) + 1 : 1;
      if (normalMode === true) {
        player = await updateUserMode(player_name, "normalMode");
        game = new Game(id, room, player_name, "waiting", "normalMode");
      } else if (ghostMode === true) {
        player = await updateUserMode(player_name, "ghostMode");
        game = new Game(id, room, player_name, "waiting", "ghostMode");
      } else if (crazyMode === true) {
        player = await updateUserMode(player_name, "crazyMode");
        game = new Game(id, room, player_name, "waiting", "crazyMode");
      }
      if (game.id) games.add(game);
    }
    res
      .status(201)
      .json({ ...game.room, player_name, normalMode, ghostMode, crazyMode });
  } catch (error) {
    res.status(500).json({ error: `Error server: ${error.message}` });
  }
});

app.get("/api/allgames", authenticateToken, (req, res) => {
  try {
    const gamesArray = Array.from(games).map((game) => game.forSend());
    res.json(gamesArray);
  } catch (error) {
    res.status(500).json({ error: `Error server: ${error.message}` });
  }
});

server.on("upgrade", async (request, socket, head) => {
  const host =
    request.headers["host"] || `${process.env.HOST}:${process.env.PORT}`;
  const url = new URL(request.url, `http://${host}`);
  const parts = url.pathname.split("/");
  let players = [];

  if (parts.length !== 4 || parts[1] !== "games") {
    socket.destroy();
    return;
  }

  const gameName = parts[2];
  const playerName = parts[3];

  if (!gameName || !url.pathname.startsWith("/games/")) {
    socket.destroy();
    return;
  }
  const game = getGameValue(gameName);
  if (!game) {
    socket.destroy();
    return;
  }

  if (!game.id) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request, players, game, playerName);
  });
});

wss.on("connection", (ws, request, players, game, playerName) => {
  const status = game.status;
  if (status === "started") {
    ws.send(
      JSON.stringify({ type: "error", message: "Game has already started!" })
    );
    ws.close(1008);
    return;
  }
  players = game.players;
  const existing = [...players].find((p) => p.name === playerName);
  if (existing) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Player already connected to this game!",
      })
    );
    ws.close(1008);
    return;
  }

  let player = new Player(playerName, ws, game.createRand(), game.mode);
  game.players.push(player);

  ws.send(
    JSON.stringify({
      type: "connected",
      message: "Welcome!",
      owner: `${game.owner}`,
    })
  );

  ws.on("message", async (data) => {
    const msg = JSON.parse(data);

    if (msg.type === "startGame") {
      game.status = "started";
      game.broadcast("started", { data: game.forSend() });
      game.start();
    }
    if (msg.type === "move") {
      if (game.status !== "finished") player.movePiece(msg.x, msg.y);
    }
    if (msg.type === "rotate") {
      if (game.status !== "finished") player.drawRotatedPiece();
    }
    if (msg.type === "restart") {
      game.restart();
    }
    if (msg.type === "spacebar") {
      player.spacebar();
    }
  });

  ws.on("close", () => {
    game = getGameValue(game.name);

    game.players = removePlayer(players, playerName);

    if (game.players.length > 0 && game.players[0]) {
      game.owner = game.players[0].name;
      game.broadcast("owner", { message: `${game.owner}` });
    }

    if (game.players.length === 0) {
      games.delete(game);
    }
  });
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
    res.status(500).json({ error: "Internal server error" });
  }
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

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server start at http://${process.env.HOST}:${PORT}`);
});
