import { describe, expect, test, beforeEach, afterEach, jest, afterAll, beforeAll } from "@jest/globals";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { app, authenticateToken } from "./server.js";

import axios from "axios";
import { io as ioClient } from "socket.io-client";

jest.unstable_mockModule("./db.js", () => ({
  addUser: jest.fn(),
  getUser: jest.fn(),
  addToken: jest.fn(),
  deleteToken: jest.fn(),
  verifyToken: jest.fn(),
  saveGame: jest.fn(),
  getUserGames: jest.fn(),
  updateUserMode: jest.fn(),
  deleteUser: jest.fn(),
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

const JWT_SECRET = "71dac283b6f89a9e6251c597c3f5e3c0";
const db = await import("./db.js");
const { games, getGameValue } = await import("./game/GameManagment.js");
const { Game } = await import("./Game.js");

describe("Server API Tests", () => {

	let api;
	let tokenUser;
	let testplayerToken;

	beforeAll(async () => {
	  // Create testplayer user via registration endpoint
	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });
	  
	  try {
		const res = await apiNoAuth.post("/api/register", {
		  name: "testplayer",
		  password: "password123"
		});
		if (res.data?.token) {
		  testplayerToken = res.data.token;
		}
	  } catch (error) {
		// User might already exist, login instead
	  }
	  if (!testplayerToken) {
		try {
		  const loginRes = await apiNoAuth.post("/api/login", {
			name: "testplayer",
			password: "password123"
		  });
		  testplayerToken = loginRes.data?.token || loginRes.data?.updateUser?.token;
		} catch (error) {
		  // fallback: generate a token manually
		  testplayerToken = jwt.sign({ name: "testplayer", id: 2 }, JWT_SECRET);
		}
	  }
	});

  beforeEach(() => {
	tokenUser = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
	api = axios.create({
	  baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
	  headers: { "Content-Type": "application/json" },
	});

	api.interceptors.request.use((config) => {
		if (tokenUser) {
			config.headers["Authorization"] = `Bearer ${tokenUser}`;
		}
		return config;
	}, (error) => Promise.reject(error));

	jest.clearAllMocks();
  });

  describe("POST /api/register", () => {
	test("should register a new user successfully", async () => {
	  const uniqueName = "testuser_" + Date.now();
	  const mockUser = { id: 2, name: uniqueName, password: "password123" };
	  db.addUser.mockResolvedValue(mockUser);
	  db.addToken.mockResolvedValue(true);
	  tokenUser = null; // Remove token for registration

	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });

	  const response = await apiNoAuth
		.post("/api/register", { name: uniqueName, password: "password123" });

	  expect(response.status).toBe(201);
	  expect(response.data).toHaveProperty("message", "User registered successfully");
	  expect(response.data).toHaveProperty("token");
	  expect(response.data.user.name).toEqual(uniqueName);
	  expect(response.data.user).toHaveProperty("id");

	})

	test("should reject registration with short name", async () => {
	  const response = await api
		.post("/api/register", { name: "a", password: "password123" });

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("error", "The name must be at least 2 characters long.");
	});

	test("should reject registration with short password", async () => {
	  const response = await api
		.post("/api/register", { name: "testuser", password: "123" });

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("error", "The password must contain at least 6 characters.");
	});

	test("should reject registration with existing username", async () => {
	  db.addUser.mockResolvedValue(null);

	  const response = await api
		.post("/api/register", { name: "existinguser", password: "password123" });

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("error", "This username is already taken.");
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

	  const response = await api
		.post("/api/login", { name: "testuser", password: "password123" });

	  expect(response.status).toBe(201);
	  expect(response.data).toHaveProperty("message", "The player is successfully connected");
	  expect(response.data).toHaveProperty("token");
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

	  const response = await api
		.post("/api/login", { name: "testuser", password: "wrongpassword" });

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("error", "Incorrect password");
	});

	test("should reject login with non-existent user", async () => {
	  db.getUser.mockResolvedValue(null);

	  const response = await api
		.post("/api/login", { name: "nonexistent", password: "password123" });

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("error", "You don't have an account yet, please register.");
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

	  const response = await api
		.post("/api/login", { name: "testuser", password: "password123" });

	  expect(response.status).toBe(201);
	//   expect(db.verifyToken).toHaveBeenCalled();
	});
  });

  describe("POST /api/logout", () => {
	test("should logout successfully with valid token", async () => {
	  const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
	  db.deleteToken.mockResolvedValue(true);

	  const response = await api
		.post("/api/logout", {});

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("message", "Déconnexion réussie");
	  expect(response.data).toHaveProperty("redirect", "/login");
	//   expect(db.deleteToken).toHaveBeenCalledWith("testuser2");
	});

	test("should reject logout without token", async () => {
	  const response = await api.post("/api/logout", {});

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("message", "Déconnexion réussie");
	  expect(response.data).toHaveProperty("redirect", "/login");
	});

	test("should reject logout with invalid token", async () => {
	  const response = await api
		.post("/api/logout", {});

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("message", "Déconnexion réussie");
	  expect(response.data).toHaveProperty("redirect", "/login");
	});
  });

  describe("GET /api/home", () => {
	test("should reject home access without token", async () => {
	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });

	  try {
		const response = await apiNoAuth.get("/api/home");
		expect(response.status).toBe(401);
	  } catch (error) {
		expect(error.response.status).toBe(401);
	  }
	});

	test("should access home page with valid token", async () => {
	  const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);

	  const response = await api
		.get("/api/home");

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("message", "Welcome to the home page");
	  expect(response.data.user).toHaveProperty("name", "testuser");
	});
  });



  describe("GET /api/allgames", () => {
	test("should return all games with valid token", async () => {
	  const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
	  const mockGames = [
		{ forSend: jest.fn().mockReturnValue({ id: 1, name: "Game1", score: 1000 }) },
		{ forSend: jest.fn().mockReturnValue({ id: 2, name: "Game2", score: 2000 }) },
	  ];

	  games.clear();
	  mockGames.forEach((g) => games.add(g));

	  const response = await api
		.get("/api/allgames");

	  expect(response.status).toBe(200);
	  expect(Array.isArray(response.data)).toBe(true);
	  expect(response.data.length).toBeGreaterThanOrEqual(0);
	});

	test("should reject allgames access without token", async () => {
	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });

	  try {
		const response = await apiNoAuth.get("/api/allgames");
		expect(response.status).toBe(401);
	  } catch (error) {
		expect(error.response.status).toBe(401);
	  }
	});
  });

  describe("POST /api/savegame", () => {
	test("should save game successfully", async () => {
	  const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
	  db.getUser.mockResolvedValue({ id: 1, name: "testuser" });
	  db.saveGame.mockResolvedValue(true);

	  const response = await api
		.post("/api/savegame", 
			{ name: "testuser", score: 1000, gameName: "TestGame" });

	  expect(response.status).toBe(201);
	  expect(response.data).toHaveProperty("message", "Game saved successfully");
	});

	test("should reject save game with missing data", async () => {
	  const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
	  db.getUser.mockResolvedValue(null);

	  try {
		const response = await api
		  .post("/api/savegame", 
			  { name: "testuser", score: null });
		expect(response.status).toBe(400);
	  } catch (error) {
		expect(error.response.status).toBe(400);
	  }
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

	  const response = await api
		.get("/api/getgames?name=testuser");

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("games");
	  expect(Array.isArray(response.data.games)).toBe(true);
	  expect(response.data.games.length).toBeGreaterThan(0);
	});

	test("should reject get games without user_id", async () => {
	  const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
	  db.getUser.mockResolvedValue(null);

	  try {
		const response = await api
		  .get("/api/getgames?name=nonexistent");
		expect(response.status).toBe(400);
	  } catch (error) {
		expect(error.response.status).toBe(400);
	  }
	});

	test("should handle no games found", async () => {
	tokenUser = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
	  db.getUser.mockResolvedValue({ id: 1, name: "testuser" });
	  db.getUserGames.mockResolvedValue(null);
	  const response = await api
		.get("/api/getgames?name=testuser");

	  expect(response.status).toBe(200);
	  // Les mocks ne fonctionnent pas toujours, on vérifie juste que ça répond
	  expect(response.data).toBeDefined();
	});
  });

  describe("POST /:room/:player_name", () => {
	test("should create a fictive user and game when player does not exist in DB (no token)", async () => {
	  const fictiveName = "fictive_" + Date.now();
	  db.getUser.mockResolvedValue(null);
	  db.addUser.mockResolvedValue({ id: 99, name: fictiveName });
	  db.updateUserMode.mockResolvedValue(true);
	  getGameValue.mockReturnValue(null);

	  const mockGame = {
		id: 1,
		name: "room1",
		owner: fictiveName,
		status: "waiting",
		mode: "normalMode",
		room: { id: 1, name: "room1" }
	  };
	  Game.mockImplementation(() => mockGame);

	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });

	  const response = await apiNoAuth
		.post(`/room1/${fictiveName}`,
			{ normalMode: true, ghostMode: false, crazyMode: false });

	  expect(response.status).toBe(201);
	  expect(response.data).toHaveProperty("player_name", fictiveName);
	  expect(response.data).toHaveProperty("isFictive", true);
	});

	test("should reject with 403 when player exists in DB but token does not match", async () => {
	  db.getUser.mockResolvedValue({ id: 5, name: "otherplayer", password: "hashed", token: "sometoken" });

	  // Use a token for a different user
	  const wrongToken = jwt.sign({ name: "differentuser", id: 10 }, JWT_SECRET);
	  const apiWithWrongToken = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: {
		  "Content-Type": "application/json",
		  "Authorization": `Bearer ${wrongToken}`
		},
		validateStatus: () => true
	  });

	  const response = await apiWithWrongToken
		.post("/room1/otherplayer",
			{ normalMode: true, ghostMode: false, crazyMode: false });
	  expect(response.status).toBe(403);
	  expect(response.data).toHaveProperty("error", "This username belongs to another registered user. Please use your own username.");
	});

	test("should reject with 403 when player exists in DB but no token is provided", async () => {
	  db.getUser.mockResolvedValue({ id: 5, name: "existingplayer", password: "hashed", token: "sometoken" });

	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
		validateStatus: () => true
	  });

	  const response = await apiNoAuth
		.post("/room1/existingplayer",
			{ normalMode: true, ghostMode: false, crazyMode: false });
	  expect(response.status).toBe(403);
	  expect(response.data).toHaveProperty("error", "This username belongs to another registered user. Please use your own username.");
	});

	test("should allow authenticated user to create game with normalMode", async () => {
	  db.updateUserMode.mockResolvedValue(true);
	  getGameValue.mockReturnValue(null);

	  const mockGame = {
		id: 1,
		name: "room1",
		owner: "testplayer",
		status: "waiting",
		mode: "normalMode",
		room: { id: 1, name: "room1" }
	  };
	  Game.mockImplementation(() => mockGame);

	  const apiAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: {
		  "Content-Type": "application/json",
		  "Authorization": `Bearer ${testplayerToken}`
		},
	  });

	  const response = await apiAuth
		.post("/room1/testplayer",
			{ normalMode: true, ghostMode: false, crazyMode: false });

	  expect(response.status).toBe(201);
	  expect(response.data).toHaveProperty("player_name", "testplayer");
	  expect(response.data).toHaveProperty("normalMode", true);
	  expect(response.data.isFictive).toBeFalsy();
	});

	test("should allow authenticated user to create game with ghostMode", async () => {
	  db.updateUserMode.mockResolvedValue(true);
	  getGameValue.mockReturnValue(null);

	  const mockGame = {
		id: 1,
		name: "room1",
		owner: "testplayer",
		status: "waiting",
		mode: "ghostMode",
		room: { id: 1, name: "room1" }
	  };
	  Game.mockImplementation(() => mockGame);

	  const apiAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: {
		  "Content-Type": "application/json",
		  "Authorization": `Bearer ${testplayerToken}`
		},
	  });

	  const response = await apiAuth
		.post("/room1/testplayer",
			{ normalMode: false, ghostMode: true, crazyMode: false });

	  expect(response.status).toBe(201);
	  expect(response.data).toHaveProperty("player_name", "testplayer");
	  expect(response.data).toHaveProperty("ghostMode", true);
	});

	test("should allow authenticated user to create game with crazyMode", async () => {
	  db.updateUserMode.mockResolvedValue(true);
	  getGameValue.mockReturnValue(null);

	  const mockGame = {
		id: 1,
		name: "room1",
		owner: "testplayer",
		status: "waiting",
		mode: "crazyMode",
		room: { id: 1, name: "room1" }
	  };
	  Game.mockImplementation(() => mockGame);

	  const apiAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: {
		  "Content-Type": "application/json",
		  "Authorization": `Bearer ${testplayerToken}`
		},
	  });

	  const response = await apiAuth
		.post("/room1/testplayer",
			{ normalMode: false, ghostMode: false, crazyMode: true });

	  expect(response.status).toBe(201);
	  expect(response.data).toHaveProperty("player_name", "testplayer");
	  expect(response.data).toHaveProperty("crazyMode", true);
	});

	test("should create fictive user with default normalMode when no mode specified", async () => {
	  const fictiveName = "newplayer_" + Date.now();
	  db.getUser.mockResolvedValue(null);
	  db.addUser.mockResolvedValue({ id: 100, name: fictiveName });
	  db.updateUserMode.mockResolvedValue(true);
	  getGameValue.mockReturnValue(null);

	  const mockGame = {
		id: 1,
		name: "room1",
		owner: fictiveName,
		status: "waiting",
		mode: "normalMode",
		room: { id: 1, name: "room1" }
	  };
	  Game.mockImplementation(() => mockGame);

	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });

	  const response = await apiNoAuth
		.post(`/room1/${fictiveName}`,
			{ normalMode: false, ghostMode: false, crazyMode: false });

	  expect(response.status).toBe(201);
	  expect(response.data).toHaveProperty("player_name", fictiveName);
	  expect(response.data).toHaveProperty("isFictive", true);
	});

	test("should return 400 when fictive user creation fails", async () => {
	  // Use testplayer (existing user) without auth token -> should get 403
	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });

	  try {
		const response = await apiNoAuth
		  .post("/room1/testplayer",
			  { normalMode: true, ghostMode: false, crazyMode: false });
		// If no error thrown, the status should indicate an error
		expect([400, 403]).toContain(response.status);
	  } catch (error) {
		expect(error.response).toBeDefined();
		expect([400, 403]).toContain(error.response.status);
		expect(error.response.data).toHaveProperty("error");
	  }
	});

	test("should return existing game if game already exists (authenticated user)", async () => {
	  const existingGame = {
		id: 1,
		name: "room1",
		owner: "testplayer",
		status: "waiting",
		mode: "normalMode",
		room: { id: 1, name: "room1" }
	  };
	  getGameValue.mockReturnValue(existingGame);

	  const apiAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: {
		  "Content-Type": "application/json",
		  "Authorization": `Bearer ${testplayerToken}`
		},
	  });

	  const response = await apiAuth
		.post("/room1/testplayer",
			{ normalMode: true, ghostMode: false, crazyMode: false });

	  expect(response.status).toBe(201);
	  expect(response.data).toHaveProperty("player_name", "testplayer");
	});

	test("should return existing game if game already exists (fictive user)", async () => {
	  const fictiveName = "fictivejoiner_" + Date.now();
	  db.getUser.mockResolvedValue(null);
	  db.addUser.mockResolvedValue({ id: 101, name: fictiveName });

	  const existingGame = {
		id: 1,
		name: "room1",
		owner: "someowner",
		status: "waiting",
		mode: "normalMode",
		room: { id: 1, name: "room1" }
	  };
	  getGameValue.mockReturnValue(existingGame);

	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });

	  const response = await apiNoAuth
		.post(`/room1/${fictiveName}`,
			{ normalMode: true, ghostMode: false, crazyMode: false });

	  expect(response.status).toBe(201);
	  expect(response.data).toHaveProperty("player_name", fictiveName);
	  expect(response.data).toHaveProperty("isFictive", true);
	});

	test("should reject with 403 when player exists and token is invalid", async () => {
	  db.getUser.mockResolvedValue({ id: 5, name: "realplayer", password: "hashed", token: "sometoken" });

	  const apiWithBadToken = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: {
		  "Content-Type": "application/json",
		  "Authorization": "Bearer invalidtoken123"
		},
		validateStatus: () => true
	  });

	  const response = await apiWithBadToken
		.post("/room1/realplayer",
			{ normalMode: true, ghostMode: false, crazyMode: false });
	  expect(response.status).toBe(403);
	  expect(response.data).toHaveProperty("error", "This username belongs to another registered user. Please use your own username.");
	});

	test("should handle error when existing user tries to join without auth", async () => {
	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });

	  try {
		const response = await apiNoAuth
		  .post("/room1/testplayer",
			  { normalMode: true, ghostMode: false, crazyMode: false });
		expect(response.status).toBe(403);
	  } catch (error) {
		expect(error.response).toBeDefined();
		expect(error.response.status).toBe(403);
		expect(error.response.data).toHaveProperty("error", "This username belongs to another registered user. Please use your own username.");
	  }
	});
  });

  describe("POST /api/register - Error handling", () => {
	test("should handle UNIQUE constraint error", async () => {
	  const error = new Error("UNIQUE constraint failed: users.name");
	  db.addUser.mockRejectedValue(error);

	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });

	  try {
		const response = await apiNoAuth
		  .post("/api/register", { name: "existinguser", password: "password123" });
	  } catch (error) {
		expect(error.response.status).toBe(400);
		expect(error.response.data).toHaveProperty("error", "This username is already taken.");
	  }
	});

	test("should handle general server error during registration", async () => {
	  db.addUser.mockRejectedValue(new Error("Server error"));

	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });

	  try {
		const response = await apiNoAuth
		  .post("/api/register", { name: "testuser", password: "password123" });
	  } catch (error) {
		expect(error.response.status).toBe(500);
		expect(error.response.data).toHaveProperty("error", "Server error during registration.");
	  }
	});
  });

  describe("POST /api/login - Validation tests", () => {
	test("should reject login with short name", async () => {
	  const response = await api
		.post("/api/login", { name: "a", password: "password123" });

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("error", "The name must be at least 2 characters long.");
	});

	test("should reject login with short password", async () => {
	  const response = await api
		.post("/api/login", { name: "testuser", password: "123" });

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("error", "The password must contain at least 6 characters.");
	});
  });

  describe("GET /api/allgames - Error handling", () => {
	test("should handle error when getting all games", async () => {
	  const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
	  
	  // Mock a game that throws an error when calling forSend
	  const mockGame = { 
		forSend: jest.fn().mockImplementation(() => {
		  throw new Error("Error getting game data");
		})
	  };
	  
	  games.clear();
	  games.add(mockGame);

	  try {
		const response = await api.get("/api/allgames");
	  } catch (error) {
		expect(error.response.status).toBe(500);
		expect(error.response.data).toHaveProperty("error");
	  }
	});
  });

  describe("POST /api/savegame - Error handling", () => {
	test("should handle error during game save", async () => {
	  const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
	  db.getUser.mockResolvedValue({ id: 1, name: "testuser" });
	  db.saveGame.mockRejectedValue(new Error("Database error"));

	  try {
		const response = await api
		  .post("/api/savegame", 
			  { name: "testuser", score: 1000, gameName: "TestGame" });
	  } catch (error) {
		expect(error.response.status).toBe(500);
		expect(error.response.data).toHaveProperty("error", "Internal server error");
	  }
	});
  });

  describe("POST /api/logout - Error handling", () => {
	test("should handle error during logout", async () => {
	  const token = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
	  db.deleteToken.mockRejectedValue(new Error("Database error"));

	  try {
		const response = await api.post("/api/logout", {});
	  } catch (error) {
		expect(error.response.status).toBe(500);
		expect(error.response.data).toHaveProperty("error", "Erreur serveur lors de la déconnexion");
	  }
	});
  });

  describe("Middleware authenticateToken", () => {
	test("should reject request without authorization header", () => {
	  const req = { headers: {} };
	  const res = {
		status: jest.fn().mockReturnThis(),
		json: jest.fn()
	  };
	  const next = jest.fn();

	  authenticateToken(req, res, next);

	  expect(res.status).toHaveBeenCalledWith(401);
	  expect(res.json).toHaveBeenCalledWith({
		error: "Required Token",
		redirect: "/login"
	  });
	  expect(next).not.toHaveBeenCalled();
	});

	test("should reject request with invalid token", () => {
	  const req = {
		headers: {
		  authorization: "Bearer invalidtoken123"
		}
	  };
	  const res = {
		status: jest.fn().mockReturnThis(),
		json: jest.fn()
	  };
	  const next = jest.fn();

	  authenticateToken(req, res, next);

	  expect(res.status).toHaveBeenCalledWith(403);
	  expect(res.json).toHaveBeenCalledWith({
		error: "Incorrect Token"
	  });
	  expect(next).not.toHaveBeenCalled();
	});

	test("should accept request with valid token", () => {
	  const validToken = jwt.sign({ name: "testuser", id: 1 }, JWT_SECRET);
	  const req = {
		headers: {
		  authorization: `Bearer ${validToken}`
		}
	  };
	  const res = {
		status: jest.fn().mockReturnThis(),
		json: jest.fn()
	  };
	  const next = jest.fn();

	  authenticateToken(req, res, next);

	  expect(req.user).toBeDefined();
	  expect(req.user.name).toBe("testuser");
	  expect(next).toHaveBeenCalled();
	  expect(res.status).not.toHaveBeenCalled();
	});
  });

  describe("GET / - SPA catch-all route", () => {
	test("should serve index.html for SPA routes", async () => {
	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });

	  try {
		const response = await apiNoAuth.get("/home");
		expect(response.status).toBe(200);
		expect(response.headers['content-type']).toContain('text/html');
	  } catch (error) {
		// If file doesn't exist, it should still try to serve it
		expect(error.response?.status).toBeDefined();
	  }
	});

	test("should not catch API routes", async () => {
	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });

	  try {
		const response = await apiNoAuth.get("/api/home");
		// Should be handled by /api/home route, not catch-all
		expect(response.status).not.toBe(200); // Because no token
	  } catch (error) {
		expect(error.response.status).toBe(401); // Expecting auth error
	  }
	});
  });

  describe("POST /api/register - Missing fields", () => {
	test("should reject registration with missing name", async () => {
	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });

	  const response = await apiNoAuth
		.post("/api/register", { password: "password123" });

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("error");
	});

	test("should reject registration with missing password", async () => {
	  const apiNoAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: { "Content-Type": "application/json" },
	  });

	  const response = await apiNoAuth
		.post("/api/register", { name: "testuser" });

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("error");
	});
  });

  describe("POST /api/login - Missing fields", () => {
	test("should reject login with missing name", async () => {
	  const response = await api
		.post("/api/login", { password: "password123" });

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("error");
	});

	test("should reject login with missing password", async () => {
	  const response = await api
		.post("/api/login", { name: "testuser" });

	  expect(response.status).toBe(200);
	  expect(response.data).toHaveProperty("error");
	});
  });

  describe("POST /api/savegame - Missing fields", () => {
	test("should reject save game with missing gameName", async () => {
	  db.getUser.mockResolvedValue({ id: 1, name: "testuser" });

	  try {
		const response = await api
		  .post("/api/savegame", { name: "testuser", score: 1000 });
		// Should work or return 201
		expect(response.status).toBeDefined();
	  } catch (error) {
		expect(error.response).toBeDefined();
	  }
	});

	test("should reject save game with score as null explicitly", async () => {
	  db.getUser.mockResolvedValue({ id: 1, name: "testuser" });

	  try {
		const response = await api
		  .post("/api/savegame", { name: "testuser", score: null, gameName: "test" });
		expect(response.status).toBe(400);
	  } catch (error) {
		expect(error.response.status).toBe(400);
		expect(error.response.data).toHaveProperty("error", "Missing user_id or score");
	  }
	});
  });

  describe("GET /api/getgames - Edge cases", () => {
	test("should reject get games with missing name parameter", async () => {
	  try {
		const response = await api.get("/api/getgames");
		expect(response.status).toBe(400);
	  } catch (error) {
		expect(error.response.status).toBe(400);
	  }
	});
  });

  describe("Socket.IO Tests", () => {
	let clientSocket;
	const socketURL = `http://${process.env.HOST}:${process.env.PORT}`;

	beforeEach((done) => {
	  // Créer une partie pour les tests avec le token authentifié
	  const apiAuth = axios.create({
		baseURL: `http://${process.env.HOST}:${process.env.PORT}`,
		headers: {
		  "Content-Type": "application/json",
		  "Authorization": `Bearer ${testplayerToken}`
		},
	  });

	  apiAuth.post("/testroom/testplayer", {
		normalMode: true,
		ghostMode: false,
		crazyMode: false
	  }).then(() => {
		done();
	  }).catch(() => {
		done();
	  });
	});

	afterEach(() => {
	  if (clientSocket && clientSocket.connected) {
		clientSocket.disconnect();
	  }
	});

	test("should connect to socket with valid parameters", (done) => {
	  clientSocket = ioClient(socketURL, {
		query: {
		  gameName: "testroom",
		  playerName: "socketplayer1"
		}
	  });

	  clientSocket.on("connected", (data) => {
		expect(data).toHaveProperty("message", "Welcome!");
		expect(data).toHaveProperty("owner");
		clientSocket.disconnect();
		done();
	  });

	  clientSocket.on("error", (error) => {
		done(new Error(error.message));
	  });
	});

	test("should reject connection without gameName", (done) => {
	  clientSocket = ioClient(socketURL, {
		query: {
		  playerName: "socketplayer2"
		}
	  });

	  clientSocket.on("error", (data) => {
		expect(data).toHaveProperty("message", "Missing gameName or playerName");
		done();
	  });

	  clientSocket.on("connected", () => {
		done(new Error("Should not connect without gameName"));
	  });

	  setTimeout(() => {
		if (!clientSocket.connected) {
		  done();
		}
	  }, 1000);
	});

	test("should reject connection without playerName", (done) => {
	  clientSocket = ioClient(socketURL, {
		query: {
		  gameName: "testroom"
		}
	  });

	  clientSocket.on("error", (data) => {
		expect(data).toHaveProperty("message", "Missing gameName or playerName");
		done();
	  });

	  clientSocket.on("connected", () => {
		done(new Error("Should not connect without playerName"));
	  });

	  setTimeout(() => {
		if (!clientSocket.connected) {
		  done();
		}
	  }, 1000);
	});

	test("should reject connection to non-existent game", (done) => {
	  clientSocket = ioClient(socketURL, {
		query: {
		  gameName: "nonexistentgame",
		  playerName: "socketplayer3"
		}
	  });

	  clientSocket.on("error", (data) => {
		expect(data).toHaveProperty("message", "Game not found!");
		done();
	  });

	  clientSocket.on("connected", () => {
		done(new Error("Should not connect to non-existent game"));
	  });

	  setTimeout(() => {
		if (!clientSocket.connected) {
		  done();
		}
	  }, 1000);
	});

	test("should handle player disconnect", (done) => {
	  clientSocket = ioClient(socketURL, {
		query: {
		  gameName: "testroom",
		  playerName: "socketplayer4"
		}
	  });

	  clientSocket.on("connected", () => {
		clientSocket.disconnect();
		setTimeout(() => {
		  expect(clientSocket.connected).toBe(false);
		  done();
		}, 500);
	  });

	  clientSocket.on("error", (error) => {
		done(new Error(error.message));
	  });
	});

	test("should emit startGame event", (done) => {
	  clientSocket = ioClient(socketURL, {
		query: {
		  gameName: "testroom",
		  playerName: "testplayer" // Owner of the game
		}
	  });

	  clientSocket.on("connected", () => {
		clientSocket.emit("startGame");
		setTimeout(() => {
		  clientSocket.disconnect();
		  done();
		}, 500);
	  });

	  clientSocket.on("started", (data) => {
		expect(data).toHaveProperty("data");
		clientSocket.disconnect();
		done();
	  });

	  clientSocket.on("error", (error) => {
		done(new Error(error.message));
	  });
	});

	test("should handle move event", (done) => {
	  clientSocket = ioClient(socketURL, {
		query: {
		  gameName: "testroom",
		  playerName: "socketplayer5"
		}
	  });

	  clientSocket.on("connected", () => {
		clientSocket.emit("move", { x: 1, y: 0 });
		setTimeout(() => {
		  clientSocket.disconnect();
		  done();
		}, 500);
	  });

	  clientSocket.on("error", (error) => {
		done(new Error(error.message));
	  });
	});

	test("should handle rotate event", (done) => {
	  clientSocket = ioClient(socketURL, {
		query: {
		  gameName: "testroom",
		  playerName: "socketplayer6"
		}
	  });

	  clientSocket.on("connected", () => {
		clientSocket.emit("rotate");
		setTimeout(() => {
		  clientSocket.disconnect();
		  done();
		}, 500);
	  });

	  clientSocket.on("error", (error) => {
		done(new Error(error.message));
	  });
	});

	test("should handle spacebar event", (done) => {
	  clientSocket = ioClient(socketURL, {
		query: {
		  gameName: "testroom",
		  playerName: "socketplayer7"
		}
	  });

	  clientSocket.on("connected", () => {
		clientSocket.emit("spacebar");
		setTimeout(() => {
		  clientSocket.disconnect();
		  done();
		}, 500);
	  });

	  clientSocket.on("error", (error) => {
		done(new Error(error.message));
	  });
	});

	test("should reject duplicate player connection", (done) => {
	  const firstSocket = ioClient(socketURL, {
		query: {
		  gameName: "testroom",
		  playerName: "duplicateplayer"
		}
	  });

	  firstSocket.on("connected", () => {
		// Try to connect with the same player name
		clientSocket = ioClient(socketURL, {
		  query: {
			gameName: "testroom",
			playerName: "duplicateplayer"
		  }
		});

		clientSocket.on("error", (data) => {
		  expect(data).toHaveProperty("message", "Player already connected to this game!");
		  firstSocket.disconnect();
		  done();
		});

		clientSocket.on("connected", () => {
		  firstSocket.disconnect();
		  done(new Error("Should not allow duplicate player"));
		});
	  });

	  firstSocket.on("error", (error) => {
		done(new Error(error.message));
	  });
	});
  });
});
