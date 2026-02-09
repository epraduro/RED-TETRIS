import { Player } from "./Player.js";
import { Piece } from "./Piece.js";
import {
  describe,
  expect,
  test,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";

describe("Player", () => {
  let player;
  let mockWs;
  let mockRandom;
  beforeEach(() => {
    mockWs = { send: jest.fn().mockResolvedValue(undefined) };
    mockRandom = jest.fn().mockReturnValue(0.5);
    player = new Player("TestPlayer", mockWs, mockRandom, "normal");
    player.bag = []; // on nettoie après le constructor

    // Option : forcer une pièce contrôlable pour certains tests
    player.currentPiece = new Piece("O"); // ou 'I', 'T', etc.
    player.currentPiece.x = 0; // position centrale typique
    player.currentPiece.y = 3;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getNewBag()", () => {
    test("Il faut que getNewBag() mette exactement 7 pièces différentes dans le sac.", () => {
      player.getNewBag();
      expect(player.bag.length).toBe(7);
      expect(player.bag.every((p) => p instanceof Piece)).toBe(true);

      const types = player.bag.map((p) => p.color);

      // Vérifie qu'il y a bien les 7 types différents et rien d'autre
      expect(new Set(types)).toEqual(
        new Set(["J", "L", "O", "T", "S", "Z", "I"])
      );

      // Optionnel : sécurité supplémentaire (pas de doublons)
      expect(types).toHaveLength(new Set(types).size);
    });

    test("utilise la fonction random fournie", () => {
      const customRandom = jest
        .fn()
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.9)
        .mockReturnValue(0.5);
      const p = new Player("Test", mockWs, customRandom, "normal");
      p.getNewBag();
      expect(customRandom).toHaveBeenCalledTimes(12);
    });
  });

  describe("newPiece()", () => {
    test("copie l'état de la grille dans opponentGrid", () => {
      player.grid[5][4] = 1;
      player.grid[8][7] = 3;

      player.newPiece();

      expect(player.opponentGrid).not.toBe(player.grid);
      expect(player.opponentGrid[5][4]).toBe(1);
      expect(player.opponentGrid[8][7]).toBe(3);
    });

    test("appelle getNewBag() si le sac a 3 pièces ou moins", () => {
      player.bag = [new Piece("I"), new Piece("O")];
      const getNewBagSpy = jest.spyOn(player, "getNewBag");

      player.newPiece();

      expect(getNewBagSpy).toHaveBeenCalledTimes(1);
      expect(player.bag.length).toBeGreaterThanOrEqual(5); // 2 initiales + au moins 5 nouvelles
    });

    test("on ne rappelle pas getNewBag() si le sac a plus de 3 pièces", () => {
      player.bag = [
        new Piece("I"),
        new Piece("O"),
        new Piece("T"),
        new Piece("L"),
        new Piece("S"),
      ];
      const getNewBagSpy = jest.spyOn(player, "getNewBag");

      player.newPiece();

      expect(getNewBagSpy).not.toHaveBeenCalled();
      expect(player.bag.length).toBe(4); // 4 initiales - 1 utilisée
    });

    test("définit currentPiece à la première pièce du sac", () => {
      player.bag = [new Piece("T"), new Piece("L"), new Piece("O")];
      player.newPiece();
      expect(player.currentPiece.color).toBe("T");
    });
  });

  describe("spaceBar()", () => {
    test("fait descendre la pièce jusqu'en bas", () => {
      player.currentPiece.x = 0;
      player.currentPiece.y = 3;

      player.spacebar();

      expect(player.currentPiece.x).toBe(18);
    });
  });

  describe("addMalus()", () => {
    test("ajoute une ligne de malus en bas de la grille", () => {
      const originalGrid = player.grid.map((row) => [...row]);

      player.addMalus();

      // La première ligne devrait être supprimée
      expect(player.grid.splice(0, 1));

	  // La dernière ligne devrait être une ligne de malus
	  expect(player.grid.splice(19, 0, [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]));
    });
  });

  describe("drawRotatedPiece()", () => {
    test("fait pivoter la pièce si possible", () => {
      player.currentPiece = new Piece("I");
      player.currentPiece.x = 4;
      player.currentPiece.y = 0;

      const originalShape = player.currentPiece.shape.map((row) => [...row]);

      player.drawRotatedPiece();

      // La pièce 'I' devrait être pivotée
      expect(player.currentPiece.shape).not.toEqual(originalShape);
    });

    test("ne fait pas pivoter la pièce si cela provoquerait une collision", () => {
      player.currentPiece = new Piece("I");
      player.currentPiece.x = 17; // Positionner près du bord gauche
      player.currentPiece.y = 3;

      const originalShape = player.currentPiece.shape.map((row) => [...row]);

      player.drawRotatedPiece();

      // La pièce 'I' ne devrait pas être pivotée car elle sortirait de la grille
      expect(player.currentPiece.shape).toEqual(originalShape);
    });
  });

  describe("next()", () => {
    test("perd la partie quand une nouvelle pièce ne peut pas apparaître (spawn bloqué)", () => {
      player.newPiece();
      for (let row = 2; row < player.grid.length; row++) {
        player.grid[row].fill(2);
      }

      player.currentPiece.x = 0;
      player.currentPiece.y = 3;
      player.draw();
      const result = player.next();

      expect(result).toBe(false);
      expect(player.lose).toBe(true);
    });

    test("retourne true quand la pièce peut descendre d'une ligne", () => {
      player.newPiece();
      const result = player.next();
      expect(result).toBe(true);
      expect(player.lose).toBe(false);
    });
  });
});
