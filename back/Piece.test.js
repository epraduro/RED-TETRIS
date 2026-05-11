import { Piece } from "./Piece.js";
import { describe, expect, test } from "@jest/globals";

describe("Piece", () => {
  describe("constructor", () => {
    test("crée correctement une pièce I", () => {
      const piece = new Piece("I");
      expect(piece.color).toBe("I");
      expect(piece.x).toBe(0);
      expect(piece.y).toBe(3);
      expect(piece.shape).toEqual([
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
    });

    test("crée correctement une pièce O", () => {
      const piece = new Piece("O");
      expect(piece.color).toBe("O");
      expect(piece.shape).toEqual([
        [1, 1],
        [1, 1],
      ]);
    });

    test("crée correctement une pièce T", () => {
      const piece = new Piece("T");
      expect(piece.shape).toEqual([
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ]);
    });
  });

  describe("rotateMatrix90", () => {
    test("la pièce O ne change pas après rotation", () => {
      const piece = new Piece("O");
      const original = piece.shape.map((row) => [...row]);

      const rotated = piece.rotateMatrix90();

      expect(rotated).toEqual(original);
      expect(piece.shape).toEqual(original);
    });

    test("rotation de la pièce I (horizontal → vertical)", () => {
      const piece = new Piece("I");
      const rotated = piece.rotateMatrix90();

      expect(rotated).toEqual([
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ]);
    });

    test("rotation de la pièce T", () => {
      const piece = new Piece("T");
      const original = piece.shape.map((row) => [...row]);

      // 1ère rotation
      let rotated = piece.rotateMatrix90();
	  piece.shape = rotated;
      expect(piece.shape).toEqual([
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ]);

      // 2ème rotation
      rotated = [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ];
	  piece.shape = rotated;
      expect(piece.shape).toEqual([
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ]);

      // 3ème rotation
      rotated = [
        [0, 1, 0],
        [1, 1, 0],
        [0, 1, 0],
      ];
	  piece.shape = rotated;
      expect(piece.shape).toEqual([
        [0, 1, 0],
        [1, 1, 0],
        [0, 1, 0],
      ]);

      // 4ème rotation → doit revenir à l'original
      rotated = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ];
	  piece.shape = rotated;
      expect(piece.shape).toEqual([
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ]);

      expect(piece.shape).toEqual(original);
    });

    test("rotation de la pièce S", () => {
      const piece = new Piece("S");
      const original = piece.shape.map((row) => [...row]);

      let rotated1 = piece.rotateMatrix90();
	  piece.shape = rotated1;
      expect(rotated1).toEqual([
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 1],
      ]);

      rotated1 = [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ]; 
	  piece.shape = rotated1;
      expect(rotated1).toEqual([
		[0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ]);

	  expect(piece.shape).toEqual(original);
    });

    test("rotation de J → vérification des 4 états", () => {
      const piece = new Piece("J");

      // État 0 (initial)
      expect(piece.shape).toEqual([
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ]);

      // État 1
      let rotated = piece.rotateMatrix90();
      expect(rotated).toEqual([
        [0, 1, 1],
        [0, 1, 0],
        [0, 1, 0],
      ]);

      // État 2
      rotated = [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 1],
      ];

      // État 3
      rotated = [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0],
      ];
    });
  });

  // Bonus : test d'intégrité globale (toutes les pièces tournent sans erreur)
  test("toutes les pièces peuvent être tournées sans erreur", () => {
    const types = ["I", "O", "J", "L", "T", "S", "Z"];

    types.forEach((type) => {
      const piece = new Piece(type);
      expect(() => {
        piece.rotateMatrix90();
        piece.rotateMatrix90();
        piece.rotateMatrix90();
        piece.rotateMatrix90();
      }).not.toThrow();
    });
  });
});
