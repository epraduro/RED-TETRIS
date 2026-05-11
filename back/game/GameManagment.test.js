import { games, getGameValue } from "./GameManagment.js";
import { Game } from "../Game.js";
import {
  describe,
  expect,
  test,
  beforeEach,
  afterEach,
} from "@jest/globals";

describe("GameManagement", () => {
  beforeEach(() => {
    games.clear();
  });

  afterEach(() => {
    games.clear();
  });

  describe("games", () => {
    test("should be a Set", () => {
      expect(games instanceof Set).toBe(true);
    });

    test("should start empty after clear", () => {
      expect(games.size).toBe(0);
    });

    test("should allow adding games", () => {
      const game1 = new Game("game1", "Test Game 1", "Player1", "waiting", "normal");
      games.add(game1);
      expect(games.size).toBe(1);
      expect(games.has(game1)).toBe(true);
    });

    test("should allow multiple games", () => {
      const game1 = new Game("game1", "Test Game 1", "Player1", "waiting", "normal");
      const game2 = new Game("game2", "Test Game 2", "Player2", "waiting", "normal");
      games.add(game1);
      games.add(game2);
      expect(games.size).toBe(2);
    });

    test("should not add duplicate games", () => {
      const game1 = new Game("game1", "Test Game 1", "Player1", "waiting", "normal");
      games.add(game1);
      games.add(game1);
      expect(games.size).toBe(1);
    });
  });

  describe("getGameValue()", () => {
    test("should return null when no games exist", () => {
      const result = getGameValue("nonexistent");
      expect(result).toBeNull();
    });

    test("should return null when game name doesn't match", () => {
      const game1 = new Game("game1", "Test Game 1", "Player1", "waiting", "normal");
      games.add(game1);
      const result = getGameValue("nonexistent");
      expect(result).toBeNull();
    });

    test("should return the game when name matches", () => {
      const game1 = new Game("game1", "Test Game 1", "Player1", "waiting", "normal");
      games.add(game1);
      const result = getGameValue("Test Game 1");
      expect(result).toBe(game1);
      expect(result.name).toBe("Test Game 1");
    });

    test("should return the correct game when multiple games exist", () => {
      const game1 = new Game("game1", "Test Game 1", "Player1", "waiting", "normal");
      const game2 = new Game("game2", "Test Game 2", "Player2", "waiting", "normal");
      const game3 = new Game("game3", "Test Game 3", "Player3", "waiting", "normal");
      games.add(game1);
      games.add(game2);
      games.add(game3);
      
      const result = getGameValue("Test Game 2");
      expect(result).toBe(game2);
      expect(result.name).toBe("Test Game 2");
    });

    test("should return the first matching game if multiple games have the same name", () => {
      const game1 = new Game("game1", "Same Name", "Player1", "waiting", "normal");
      const game2 = new Game("game2", "Same Name", "Player2", "waiting", "normal");
      games.add(game1);
      games.add(game2);
      
      const result = getGameValue("Same Name");
      expect(result).toBe(game1);
    });

    test("should handle empty string name", () => {
      const game1 = new Game("game1", "", "Player1", "waiting", "normal");
      games.add(game1);
      
      const result = getGameValue("");
      expect(result).toBe(game1);
    });

    test("should be case sensitive", () => {
      const game1 = new Game("game1", "Test Game", "Player1", "waiting", "normal");
      games.add(game1);
      
      const result = getGameValue("test game");
      expect(result).toBeNull();
    });

    test("should return game with special characters in name", () => {
      const game1 = new Game("game1", "Test-Game_123!@#", "Player1", "waiting", "normal");
      games.add(game1);
      
      const result = getGameValue("Test-Game_123!@#");
      expect(result).toBe(game1);
    });
  });
});
