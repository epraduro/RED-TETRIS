import { addUser, getUser, addToken, deleteToken, verifyToken } from "./db.js";
import express from "express";
import cors from "cors";

const app = express();
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { pieces, piecesColors } from "./Pieces.js";

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

const JWT_SECRET = "71dac283b6f89a9e6251c597c3f5e3c0";

// Middleware pour vérifier le token
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

app.get("/api/pieces", (req, res) => {
  res.json({ pieces, piecesColors });
});

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
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ajouter l'utilisateur
    const user = await addUser(name, hashedPassword);

    // Générer le token JWT
    const token = jwt.sign({ name: user.name, id: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Mettre à jour le token dans la base
    await addToken(token, user.name);

    // Renvoyer le token et une indication pour le frontend
    res.status(201).json({
      message: "Utilisateur enregistré avec succès",
      user: { id: user.id, name: user.name },
      token,
      redirect: "/home", // Pour React Router
    });
  } catch (error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Ce nom est déjà utilisé." });
    }
    console.error("Erreur serveur:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement." });
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
      if (user.token === null)
      {
        const token = jwt.sign({ name: user.name, id: user.id }, JWT_SECRET, {
          expiresIn: "1h",
        });

        await addToken(token, user.name);

        return res.status(201).json({
          message: "The player is successfully connected2",
          user: { id: user.id, name: user.name},
          token
        });
      } else {
        await verifyToken(user, JWT_SECRET);
        const updateUser = await getUser(name);
        return res.status(201).json({
            message: "The player is successfully connected",
            updateUser: { id: updateUser.id, name: updateUser.name},
            token: updateUser.token
          });
      }
    }
  } else {
    return res.json({ error: "An error has uncurred" });
  }
});

app.get("/api/home", authenticateToken, (req, res) => {
  res.json({ message: "Welcome to the home page", user: req.user });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server start at http://localhost:${PORT}`);
});
