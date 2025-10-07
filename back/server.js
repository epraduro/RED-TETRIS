import { addUser, getUser } from './db.js'
import express  from 'express';
import cors from 'cors'

const app = express();
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

const JWT_SECRET = 'coucou';

// Middleware pour vérifier le token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Token requis' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Token invalide' });
      req.user = user;
      next();
  });
};

app.post('/api/register', async (req, res) => {
  const { name, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  if (!name || name.length < 2) {
    return res.status(200).json({ error: 'Le prénom doit contenir au moins 2 caractères.' });
  }
  if (!password || password.length < 6) {
    return res.status(200).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  const user = await addUser(name, hashedPassword);
  if (user) {
    const token = jwt.sign(
      { id: this.lastID, name },
      JWT_SECRET,
      { expiresIn: '1h'}
    );
    res.json({token});
    res.json({ token, redirect: '/home' });
    return res.json({ message: 'Utilisateur enregistré avec succès', user });
  } else {
    return res.json({ error: 'Utilisateur deja utilise' });
  }
});

app.post('/api/login', async (req, res) => {
  const { name, password } = req.body;

  if (!name || name.length < 2) {
    return res.status(200).json({ error: 'Le prénom doit contenir au moins 2 caractères.' });
  }
  if (!password || password.length < 6) {
    return res.status(200).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  const user = await getUser(name);
  if (user) {
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(200).json({ error: "Mot de passe incorrect"});
    res.json({ message: 'Connexion réussie', redirect: '/home' });
    return res.json({ message: 'Utilisateur enregistré avec succès', user });
  } else {
    return res.json({ error: 'Probleme lors de la connexion' });
  }
});

// Route protégée pour la page d'accueil
app.get('/api/home', authenticateToken, (req, res) => {
  res.json({ message: 'Bienvenue sur la page d\'accueil', user: req.user });
});

// Démarrer le serveur
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});