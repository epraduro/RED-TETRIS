import { addUser, getUser } from './db.js'
import express  from 'express';
import cors from 'cors'

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Route pour enregistrer un utilisateur
// app.post('/api/register', async (req, res) => {
//   const { name, password } = req.body;

//   if (!name || name.length < 2) {
//     return res.status(200).json({ error: 'Le prénom doit contenir au moins 2 caractères.' });
//   }
//   if (!password || password.length < 6) {
//     return res.status(200).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
//   }

//   const user = await addUser(name, password);
//   if (user) {
//     return res.json({ message: 'Utilisateur enregistré avec succès', user });
//   } else {
//     return res.json({ error: 'Utilisateur deja utilise' });
//   }
// });

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
    return res.json({ message: 'Utilisateur enregistré avec succès', user });
  } else {
    return res.json({ error: 'Probleme' });
  }
});

app.get('/test', (req, res) => {
  res.json({ message: 'Serveur accessible' });
});

// Démarrer le serveur
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});