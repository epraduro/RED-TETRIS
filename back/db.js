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
    token TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    owner TEXT NOT NULL,
    status TEXT
  )`);
});

export async function updateGame(query, value, id) {
  return new Promise((resolve, reject) => {
    db.run(query,[value, id], function (err){
      if (err) {
        reject(err)
      } else {
        db.get("SELECT * FROM games WHERE id = ? ", [id], (err, row) => {
          if (err) {
            reject(err)
          } else {
            //console.log(row)
            resolve(row)
          }
        })
      }
    });
  })
}

export async function delGame(id, player_name) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM games WHERE id = ?`, [id], function (err) {
      if (err) {
        reject(err)
      } else {
        db.get("SELECT * FROM users WHERE id = ? ", [player_name], (err, row) => {
          if (err) {
            reject(err)
          } else {
            //console.log(row)
            resolve(row)
          }
        })
      }
    });
  })
}

export async function createGame(player1, name) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO games (name, owner, status) VALUES (?, ?, ?)`, [name, player1, 'waiting'], function (err) {
      if (err) {
        reject(err)
      } else {
        db.get("SELECT * FROM games WHERE id = ? ", [this.lastID], (err, row) => {
          if (err) {
            reject(err)
          } else {
            //console.log(row)
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
    db.get(`SELECT id, name, password, token FROM users WHERE name=?`, [name], (err, row) => {
      if (err) {
        resolve(null)
      } else {
        resolve(row)
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
          
          const token = jwt.sign({ name: user.name, id: user.id }, secret, {
            expiresIn: "1h",
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
    db.get(`DELETE token FROM users WHERE name=?`, [name], (err, row) => {
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
    db.get(`SELECT * FROM games WHERE name=?`, [name], (err, row) => {
      if (err) {
        resolve(null)
      } else {
        resolve(row)
      }
    });
  })
}