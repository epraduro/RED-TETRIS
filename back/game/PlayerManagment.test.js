import { removePlayer } from "./PlayerManagment.js";
import { Player } from "../Player.js";
import {
  describe,
  expect,
  test,
  beforeEach,
  jest,
} from "@jest/globals";

describe("PlayerManagement", () => {
  let mockWs;
  let mockRandom;

  beforeEach(() => {
    mockWs = { send: jest.fn().mockResolvedValue(undefined) };
    mockRandom = jest.fn().mockReturnValue(0.5);
  });

  describe("removePlayer()", () => {
    test("should return the same array when player doesn't exist", () => {
      const player1 = new Player("Player1", mockWs, mockRandom, "normal");
      const player2 = new Player("Player2", mockWs, mockRandom, "normal");
      const players = [player1, player2];

      const result = removePlayer(players, "NonExistentPlayer");
      
      expect(result).toEqual(players);
      expect(result.length).toBe(2);
    });

    test("should remove player from the beginning of the array", () => {
      const player1 = new Player("Player1", mockWs, mockRandom, "normal");
      const player2 = new Player("Player2", mockWs, mockRandom, "normal");
      const player3 = new Player("Player3", mockWs, mockRandom, "normal");
      const players = [player1, player2, player3];

      const result = removePlayer(players, "Player1");
      
      expect(result.length).toBe(2);
      expect(result).toEqual([player2, player3]);
      expect(result.find(p => p.name === "Player1")).toBeUndefined();
    });

    test("should remove player from the middle of the array", () => {
      const player1 = new Player("Player1", mockWs, mockRandom, "normal");
      const player2 = new Player("Player2", mockWs, mockRandom, "normal");
      const player3 = new Player("Player3", mockWs, mockRandom, "normal");
      const players = [player1, player2, player3];

      const result = removePlayer(players, "Player2");
      
      expect(result.length).toBe(2);
      expect(result).toEqual([player1, player3]);
      expect(result.find(p => p.name === "Player2")).toBeUndefined();
    });

    test("should remove player from the end of the array", () => {
      const player1 = new Player("Player1", mockWs, mockRandom, "normal");
      const player2 = new Player("Player2", mockWs, mockRandom, "normal");
      const player3 = new Player("Player3", mockWs, mockRandom, "normal");
      const players = [player1, player2, player3];

      const result = removePlayer(players, "Player3");
      
      expect(result.length).toBe(2);
      expect(result).toEqual([player1, player2]);
      expect(result.find(p => p.name === "Player3")).toBeUndefined();
    });

    test("should handle single player array", () => {
      const player1 = new Player("Player1", mockWs, mockRandom, "normal");
      const players = [player1];

      const result = removePlayer(players, "Player1");
      
      expect(result.length).toBe(0);
      expect(result).toEqual([]);
    });

    test("should return new array instance (immutability)", () => {
      const player1 = new Player("Player1", mockWs, mockRandom, "normal");
      const player2 = new Player("Player2", mockWs, mockRandom, "normal");
      const players = [player1, player2];

      const result = removePlayer(players, "Player1");
      
      // Vérifie que c'est un nouveau tableau
      expect(result).not.toBe(players);
      expect(Array.isArray(result)).toBe(true);
    });

    test("should handle empty array", () => {
      const players = [];
      
      const result = removePlayer(players, "Player1");
      
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    test("should be case sensitive", () => {
      const player1 = new Player("Player1", mockWs, mockRandom, "normal");
      const player2 = new Player("Player2", mockWs, mockRandom, "normal");
      const players = [player1, player2];

      const result = removePlayer(players, "player1");
      
      expect(result.length).toBe(2);
      expect(result).toEqual([player1, player2]);
    });

    test("should only remove the first matching player", () => {
      const player1 = new Player("SameName", mockWs, mockRandom, "normal");
      const player2 = new Player("SameName", mockWs, mockRandom, "normal");
      const player3 = new Player("Player3", mockWs, mockRandom, "normal");
      const players = [player1, player2, player3];

      const result = removePlayer(players, "SameName");
      
      expect(result.length).toBe(2);
      expect(result[0]).toBe(player2);
      expect(result[1]).toBe(player3);
    });

    test("should handle player with special characters in name", () => {
      const player1 = new Player("Player-1_Test!@#", mockWs, mockRandom, "normal");
      const player2 = new Player("Player2", mockWs, mockRandom, "normal");
      const players = [player1, player2];

      const result = removePlayer(players, "Player-1_Test!@#");
      
      expect(result.length).toBe(1);
      expect(result).toEqual([player2]);
    });

    test("should preserve original array when player not found", () => {
      const player1 = new Player("Player1", mockWs, mockRandom, "normal");
      const player2 = new Player("Player2", mockWs, mockRandom, "normal");
      const players = [player1, player2];
      const originalLength = players.length;

      const result = removePlayer(players, "Player3");
      
      expect(result.length).toBe(originalLength);
      expect(result).toEqual(players);
    });
  });
});
