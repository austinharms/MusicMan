const sqlite = require("sqlite3");
const fs = require("fs");
const fsPromises = fs.promises;

const DB = function(path) {
  this.db = null;
  this.connected = false;
  this.dbPath = path; 
};

DB.prototype.open = function() {
  if (this.connected) {
    this.close();
  }

  return new Promise(async (resolve, reject) => { 
    try {
      const fileExists = await fsPromises.access(this.dbPath, fs.constants.W_OK).then(() => true).catch(() => false);
      const db = new sqlite.Database(this.dbPath, err => {
        if(err)
          reject(err.message);
      });
        
      this.db = db;
      this.connected = true;
      if(!fileExists) {
        this.insert( `CREATE TABLE IF NOT EXISTS CommandPermissions (
          commandId INTEGER NOT NULL,
          guildId TEXT NOT NULL,
          disabled INTEGER,
          disabledMessage TEXT,
          permissionLevel INTEGER,
          permissionMessage TEXT,
          PRIMARY KEY ( commandId, guildId)
          );`);
          this.insert( `CREATE TABLE IF NOT EXISTS UserPermissions (
            userId INTEGER NOT NULL,
            guildId TEXT NOT NULL,
            permissionLevel INTEGER NOT NULL,
            PRIMARY KEY ( userId, guildId)
            );`);
        console.log("Database not found, Recreated");
      }

      resolve(db);
    } catch(e) {
      reject(e);
    }
  });
};

DB.prototype.close = function() {
  try {
    if (this.connected) {
      this.db.close();
      this.connected = false;
      this.db = null;
    }
  } catch(e) {
    console.log("Error Closing DB: " + e);
  }
};

DB.prototype.query = function(queryString, params = []) {
  return new Promise((resolve, reject) => {
    if (!this.connected) {
      reject("DB not Connected");
      return;
    }

    this.db.all(queryString, params, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

DB.prototype.insert = function(insertString, params = []) { 
  return new Promise((resolve, reject) => {
    if (!this.connected) {
      reject("DB not Connected");
      return;
    }

    this.db.run(insertString, params, err => {
      if (err) reject(err);
      resolve(true);
    });
  });
};

module.exports = new DB("./bot.db");