import { describe, expect, test, beforeEach, afterEach, jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Mock des dépendances
jest.unstable_mockModule("./db.js", () => ({
  addUser: jest.fn(),
  getUser: jest.fn(),
  addToken: jest.fn(),
  deleteToken: jest.fn(),
  verifyToken: jest.fn(),
  saveGame: jest.fn(),
  getUserGames: jest.fn(),
  updateUserMode: jest.fn(),
}));

jest.unstable_mockModule("./game/GameManagment.js", () => ({
  games: new Set(),
  getGameValue: jest.fn(),
}));

jest.unstable_mockModule("./Player.js", () => ({
  Player: jest.fn(),
}));

jest.unstable_mockModule("./Game.js", () => ({
  Game: jest.fn(),
}));

const db = await import("./db.js");
const { games, getGameValue } = await import("./game/GameManagment.js");

const JWT_SECRET = "71dac283b6f89a9e6251c597c3f5e3c0";

const app = express();
app.use(express.json());

// Middleware d'authentification
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
    const user = await db.addUser(name, hashedPassword);

    if (user === null) {
      return res.status(200).json({ error: "This username is already taken." });
    }

    const token = jwt.sign({ name: user.name, id: user.id }, JWT_SECRET, {
      expiresIn: "7h",
    });

    await db.addToken(token, user.name);

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

  const user = await db.getUser(name);
  if (user) {
    const validPassword = bcrypt.compareSync(password, user.password);

    if (validPassword === false || validPassword === undefined)
      return res.status(200).json({ error: "Incorrect password" });
    if (validPassword === true) {
      if (user.token === null) {
        const token = jwt.sign({ name: user.name, id: user.id }, JWT_SECRET, {
          expiresIn: "7h",
        });

        await db.addToken(token, user.name);

        return res.status(201).json({
          message: "The player is successfully connected",
          user: { id: user.id, name: user.name },
          token,
        });
      } else {
        await db.verifyToken(user, JWT_SECRET);
        const updateUser = await db.getUser(name);
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
    await db.deleteToken(userName);

    res.status(200).json({
      message: "Déconnexion réussie",
      redirect: "/login",
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur lors de la déconnexion" });
  }
});

app.get("/api/home", authenticateToken, (req, res) => {
  res.json({ message: "Welcome to the home page", user: req.user });
});

app.get("/api/allgames", authenticateToken, (req, res) => {
  try {
    const gamesArray = Array.from(games).map((game) => game.forSend());
    res.json(gamesArray);
  } catch (error) {
    res.status(500).json({ error: `Error server: ${error.message}` });
  }
});

app.post("/api/savegame", authenticateToken, async (req, res) => {
  const { name, score, gameName } = req.body;

  let user_id = (await db.getUser(name))?.id;

  if (!user_id || score === null) {
    return res.status(400).json({ error: "Missing user_id or score" });
  }

  try {
    await db.saveGame(user_id, score, gameName, name);
    res.status(201).json({ message: "Game saved successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/getgames", authenticateToken, async (req, res) => {
  const { name } = req.query;

  const user = await db.getUser(name);

  if (!user?.id) {
    return res.status(400).json({ error: "Missing user_id" });
  }
  const gamesList = await db.getUserGames(user?.id);

  if (!gamesList) {
    return res.status(400).json({ error: "No games found for this user" });
  }
  res.status(200).json({ games: gamesList });
});

describe("Server API Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/register", () => {
    test("should register a new user successfully", async () => {
      const mockUser = { id: 1, name: "testuser" };
      db.addUser.mockResolvedValue(mockUser);
      db.addToken.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/register")
        .send({ name: "testuser", password: "password123" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "User registered successfully");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toEqual({ id: 1, name: "testuser" });
      expect(db.addUser).toHaveBeenCalled();
      expect(db.addToken).toHaveBeenCalled();
    });

    test("should reject registration with short name", async () => {
      const response = await request(app)
        .post("/api/register")
        .send({ name: "a", password: "password123" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("error", "The name must be at least 2 characters long.");
    });

    test("should reject registration with short password", async () => {
      const response = await request(app)
        .post("/api/register")
        .send({ name: "testuser", password: "123" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("error", "The password must contain at least 6 characters.");
    });

    test("should reject registration with existing username", async () => {
      db.addUser.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/register")
        .send({ name: "existinguser", password: "password123" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("error", "This username is already taken.");
    });
  });

  describe("POST /api/login", () => {
    test("should login successfully with valid credentials", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const mockUser = {
        id: 1,
        name: "testuser",
        password: hashedPassword,
        token: null,
      };

      db.getUser.mockResolvedValue(mockUser);
      db.addToken.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/login")
        .send({ name: "testuser", password: "password123" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "The player is successfully connected");
      expect(response.body).toHaveProperty("token");
    });

    test("should reject login with incorrect password", async () => {
      const hashedPassword = await bcrypt.hash("correctpassword", 10);
      const mockUser = {
        id: 1,
        name: "testuser",
        password: hashedPassword,
        token: null,
      };

      db.getUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post("/api/login")
        .send({ name: "testuser", password: "wrongpassword" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("error", "Incorrect password");
    });

    test("should reject login with non-existent user", async () => {
      db.getUser.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/login")
        .send({ name: "nonexistent", password: "password123" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("error", "You don't have an account yet, please register.");
    });

    test("should handle existing token on login", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const existingToken = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
      const mockUser = {
        id: 1,
        name: "testuser",
        password: hashedPassword,
        token: existingToken,
      };

      db.getUser.mockResolvedValue(mockUser);
      db.verifyToken.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/login")
        .send({ name: "testuser", password: "password123" });

      expect(response.status).toBe(201);
      expect(db.verifyToken).toHaveBeenCalled();
    });
  });

  describe("POST /api/logout", () => {
    test("should logout successfully with valid token", async () => {
      const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
      db.deleteToken.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Déconnexion réussie");
      expect(response.body).toHaveProperty("redirect", "/login");
      expect(db.deleteToken).toHaveBeenCalledWith("testuser");
    });

    test("should reject logout without token", async () => {
      const response = await request(app).post("/api/logout");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Required Token");
    });

    test("should reject logout with invalid token", async () => {
      const response = await request(app)
        .post("/api/logout")
        .set("Authorization", "Bearer invalidtoken");

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error", "Incorrect Token");
    });
  });

  describe("GET /api/home", () => {
    test("should access home page with valid token", async () => {
      const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);

      const response = await request(app)
        .get("/api/home")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Welcome to the home page");
      expect(response.body.user).toHaveProperty("name", "testuser");
    });

    test("should reject home access without token", async () => {
      const response = await request(app).get("/api/home");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Required Token");
    });
  });

  describe("GET /api/allgames", () => {
    test("should return all games with valid token", async () => {
      const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
      const mockGames = [
        { forSend: jest.fn().mockReturnValue({ id: 1, name: "Game1" }) },
        { forSend: jest.fn().mockReturnValue({ id: 2, name: "Game2" }) },
      ];

      games.clear();
      mockGames.forEach((g) => games.add(g));

      const response = await request(app)
        .get("/api/allgames")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    test("should reject allgames access without token", async () => {
      const response = await request(app).get("/api/allgames");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/savegame", () => {
    test("should save game successfully", async () => {
      const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
      db.getUser.mockResolvedValue({ id: 1, name: "testuser" });
      db.saveGame.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/savegame")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "testuser", score: 1000, gameName: "TestGame" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "Game saved successfully");
      expect(db.saveGame).toHaveBeenCalledWith(1, 1000, "TestGame", "testuser");
    });

    test("should reject save game with missing data", async () => {
      const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
      db.getUser.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/savegame")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "testuser", score: 1000 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Missing user_id or score");
    });
  });

  describe("GET /api/getgames", () => {
    test("should get user games successfully", async () => {
      const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
      const mockGames = [
        { id: 1, score: 1000, gameName: "Game1" },
        { id: 2, score: 2000, gameName: "Game2" },
      ];

      db.getUser.mockResolvedValue({ id: 1, name: "testuser" });
      db.getUserGames.mockResolvedValue(mockGames);

      const response = await request(app)
        .get("/api/getgames?name=testuser")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("games");
      expect(response.body.games.length).toBe(2);
    });

    test("should reject get games without user_id", async () => {
      const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
      db.getUser.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/getgames?name=testuser")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Missing user_id");
    });

    test("should handle no games found", async () => {
      const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
      db.getUser.mockResolvedValue({ id: 1, name: "testuser" });
      db.getUserGames.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/getgames?name=testuser")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "No games found for this user");
    });
  });
});
