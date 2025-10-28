import sqlite3 from 'sqlite3';

// Créer ou ouvrir une base de données (fichier 'mabdd.db')
export const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error connecting to the database: ', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Créer une table (exemple : utilisateurs)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    token TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    player1 TEXT,
    owner TEXT NOT NULL,
    status TEXT,
    player2 TEXT
  )`);
});

export async function updateGame(query, player_name, status, id) {
  return new Promise((resolve, reject) => {
    db.run(query,[player_name, status, id], function (err){
      if (err) {
        reject(err)
      } else {
        db.get("SELECT * FROM games WHERE id = ? ", [id], (err, row) => {
          if (err) {
            reject(err)
          } else {
            console.log(row)
            resolve(row)
          }
        })
      }
    });
  })
}

export async function createGame(player1, name) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO games (name, player1, owner, status) VALUES (?, ?, ?, ?)`, [name, player1, player1, 'waiting'], function (err) {
      if (err) {
        reject(err)
      } else {
        db.get("SELECT * FROM games WHERE id = ? ", [this.lastID], (err, row) => {
          if (err) {
            reject(err)
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
    db.get(`SELECT id, name, password FROM users WHERE name=?`, [name], (err, row) => {
      if (err) {
        resolve(null)
      } else {
        resolve(row)
      }
    });
  })
}

export async function addToken(token, name) {
  return new Promise((resolve, reject) => {
    console.log("je suis le token dans la database:", token)
    db.run(`UPDATE users SET token = ? WHERE name = ?`, [token, name], function (err) {
      if (err) {
        return reject(err);
      }
      if (this.changes === 0) {
          return reject(new Error('Utilisateur non trouvé'));
      }
      resolve(token);
    })
  })
}

export function closeDatabase() {
    db.close()
}

export async function getGame(name) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, name, player1, player2, owner, status FROM games WHERE name=?`, [name], (err, row) => {
      if (err) {
        resolve(null)
      } else {
        resolve(row)
      }
    });
  })
}