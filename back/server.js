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
  
  if (!token) return res.status(401).json({ error: 'Required Token' , redirect: '/login'});
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Incorrect Token'});
      req.user = user;
      next();
  });
};

app.post('/api/register', async (req, res) => {
  const { name, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  if (!name || name.length < 2) {
    return res.status(200).json({ error: 'The name must be at least 2 characters long.' });
  }
  if (!password || password.length < 6) {
    return res.status(200).json({ error: 'The password must contain at least 6 characters.' });
  }

  const user = await addUser(name, hashedPassword);
  if (user) {
    const token = jwt.sign(
      { name },
      JWT_SECRET,
      { expiresIn: '1h'}
    );
    // res.json({token});
    // res.json({ token, redirect: '/home' });
    return res.json({ message: 'The player is successfully register', user, token });
  } else {
    return res.json({ error: 'These identifiers are already in use.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { name, password } = req.body;

  if (!name || name.length < 2) {
    return res.status(200).json({ error: 'The name must be at least 2 characters long.' });
  }
  if (!password || password.length < 6) {
    return res.status(200).json({ error: 'The password must contain at least 6 characters.' });
  }

  const user = await getUser(name);
  if (user) {
    const validPassword = bcrypt.compareSync(password, user.password);
    // console.log(validPassword);
    if (validPassword === false || validPassword === undefined) return res.status(200).json({ error: "Incorrect password"});
    // res.json({ message: 'Connexion réussie', redirect: '/home' });
    if (validPassword === true) return res.json({ message: 'The player is successfully connected', redirect: '/home' });
  } else {
    return res.json({ error: 'An error has uncurred' });
  }
});

// Route protégée pour la page d'accueil
app.get('/api/home', authenticateToken, (req, res) => {
  res.json({ message: 'Welcome to the home page', user: req.user });
});

// Démarrer le serveur
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server start at http://localhost:${PORT}`);
});