import sqlite3 from 'sqlite3';

// Créer ou ouvrir une base de données (fichier 'mabdd.db')
export const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Erreur lors de la connexion à la base de données :', err.message);
  } else {
    console.log('Connecté à la base de données SQLite.');
  }
});

// Créer une table (exemple : utilisateurs)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1 TEXT,
    player2 TEXT,
    owner TEXT NOT NULL
  )`);
});

export async function createGame(player1) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO games (owner, player1) VALUES (?, ?)`, [player1, player1], function (err) {
      if (err) {
        resolve(null)
      } else {
        db.get("SELECT * FROM users WHERE id = ? ", [this.lastID], (err, row) => {
          if (err) {
            resolve(null)
          } else {
            console.log(row)
            resolve(row)
          }
        })
      }
    });
  })
}

export async function addUser(name, password) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO users (name, password) VALUES (?, ?)`, [name, password], function (err) {
      if (err) {
        resolve(null)
      } else {
        db.get("SELECT * FROM users WHERE id = ? ", [this.lastID], (err, row) => {
          if (err) {
            resolve(null)
          } else {
            console.log(row)
            resolve(row)
          }
        })
      }
    });
  })
}

export async function getUser(name) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, name FROM users WHERE name=?`, [name], (err, row) => {
      if (err) {
        resolve(null)
      } else {
        resolve(row)
      }
    });
  })
}

export function closeDatabase() {
    db.close()
}