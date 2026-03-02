import sqlite3 from 'sqlite3';
import jwt from "jsonwebtoken";

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
    token TEXT,
    mode TEXT DEFAULT 'normalMode'
  )`);

  // Table pour sauvegarder l'historique des parties
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    userName TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
});

export async function addUser(name, password, mode = 'normalMode') {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO users (name, password, mode) VALUES (?, ?, ?)`, [name, password, mode], function (err) {
      if (err) {
        resolve(null)
      } else {
        db.get("SELECT * FROM users WHERE id = ? ", [this.lastID], (err, row) => {
          if (err) {
            resolve(null)
          } else {
            resolve(row)
          }
        })
      }
    });
  })
}

export async function getUser(name) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, name, password, token, mode FROM users WHERE name=?`, [name], (err, row) => {
      if (err) {
        resolve(null)
      } else {
        resolve(row)
      }
    });
  })
}

export async function updateUserMode(name, mode) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET mode = ? WHERE name = ?`, [mode, name], function (err) {
      if (err) {
        reject(err)
      } else {
        resolve(this.changes)
      }
    });
  })
}

export async function verifyToken(user, secret) {
  return new Promise((resolve, reject) => {
    jwt.verify(user.token, secret, async (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          await deleteToken(user.name)
          await updateUserMode(user.name, 'normalMode');
          const token = jwt.sign({ name: user.name, id: user.id }, secret, {
            expiresIn: "7h",
          });

          await addToken(token, user.name);
        }
      }
      resolve()
    })
  });
}

export async function deleteToken(name) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE users SET token = NULL WHERE name = ?`, [name], function (err) {
      if (err) {
        reject(err)
      } else {
        resolve(this.changes)
      }
    });
  })
}

export async function addToken(token, name) {
  return new Promise((resolve, reject) => {
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

export async function saveGame(userId, score, name, userName) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO games (user_id, score, name, userName, date) VALUES (?, ?, ?, ?, datetime('now', 'localtime'))`, [userId, score, name, userName], function (err) {
      if (err) {
        resolve(null)
      } else {
        db.get("SELECT * FROM games WHERE id = ?", [this.lastID], (err, row) => {
          if (err) {
            resolve(null)
          } else {
            resolve(row)
          }
        })
      }
    });
  })
}

export async function getUserGames(userId) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, score, date, name FROM games WHERE user_id = ? ORDER BY date DESC`, [userId], (err, rows) => {
      if (err) {
        resolve([])
      } else {
        resolve(rows)
      }
    });
  })
}

export async function getBestScores(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT u.name, g.score, g.date 
      FROM games g
      JOIN users u ON g.user_id = u.id
      ORDER BY g.score DESC
      LIMIT ?
    `, [limit], (err, rows) => {
      if (err) {
        resolve([])
      } else {
        resolve(rows)
      }
    });
  })
}

export async function deleteUser(name) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM users WHERE name = ?`, [name], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

export function closeDatabase() {
    db.close()
}
