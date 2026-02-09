import { Game } from "./Game";
import { Player } from "./Player";

import {
  describe,
  expect,
  test,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";

describe("Game", () => {
  let game;
  beforeEach(() => {
    game = new Game("game1", "Test Game", "Owner", "waiting", "normal");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createRand()", () => {
    test("should return a function that generates deterministic random numbers", () => {
      const randFunc1 = game.createRand();
      const randFunc2 = game.createRand();
      expect(randFunc1()).toBe(randFunc2());
      expect(randFunc1()).toBe(randFunc2());
      expect(randFunc1()).toBe(randFunc2());
    });
  });

  describe("forSend()", () => {
    test("should return a serializable object with game state", () => {
      const playerMock = { name: "Player1", lose: false, forSend: jest.fn() };
      game.players.push(playerMock);
      const sendObj = game.forSend();
      expect(sendObj).toHaveProperty("id", "game1");
      expect(sendObj).toHaveProperty("name", "Test Game");
      expect(sendObj).toHaveProperty("owner", "Owner");
      expect(sendObj).toHaveProperty("status", "waiting");
      expect(sendObj).toHaveProperty("mode", "normal");
      expect(sendObj.players).toHaveProperty("Player1");
    });
  });

  describe("update()", () => {
    test("gère le bonus quand next() retourne true", () => {
      const fakeWs = {
        send: jest.fn(),
        readyState: WebSocket.OPEN,
      };

      const player = new Player("Player1", fakeWs);
      player.lose = false;
      player.bonus = 2;
      player.currentPiece = {};

      player.movePiece = jest.fn();

      const other = new Player("Player2", fakeWs);
      other.lose = false;
      other.addMalus = jest.fn();

      game.players = [player, other];
      game.starting = true;

      game.update();

      expect(player.movePiece).toHaveBeenCalled();
      expect(other.addMalus).toHaveBeenCalledTimes(1);
      expect(player.bonus).toBe(0);
      expect(player.lose).toBe(false);
    });
  });

  describe("finish()", () => {
    test("should set the game status to 'finished'", () => {
      game.finish();
      expect(game.status).toBe("finished");
    });
  });

  describe("iscrazyMode()", () => {
    test("should return true if mode is 'crazyMode'", () => {
      const crazyGame = new Game(
        "game2",
        "Crazy Game",
        "Owner",
        "waiting",
        "crazyMode"
      );
      expect(crazyGame.iscrazyMode()).toBe(true);
    });
    test("should return false if mode is not 'crazyMode'", () => {
      expect(game.iscrazyMode()).toBe(false);
    });
  });

  describe("start()", () => {
    test("should set starting to true and start the game loop", () => {
      jest.useFakeTimers();
      game.start();
      expect(game.starting).toBe(true);
      expect(game.loop).not.toBeNull();
      jest.clearAllTimers();
    });
  });

  describe("restart()", () => {
    test("should reset game state and clear the game loop", () => {
      jest.useFakeTimers();
      game.start();
      game.restart();
      expect(game.status).toBe("waiting");
      expect(game.players).toEqual([]);
      expect(game.starting).toBe(true);
      expect(game.loser).toBe(0);
      expect(game.seed).toBe(new Date().getTime());
      expect(game.loop).not.toBeNull();
      jest.clearAllTimers();
    });
  });
});
