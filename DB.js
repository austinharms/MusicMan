const sqlite = require("sqlite3");
const fs = require("fs");
const fsPromises = fs.promises;

const DB = function(path) {
  this.db = null;
  this.connected = false;
  this.dbPath = path; 
};

DB.prototype.open = async function() {
  if (this.connected) {
    this.close();
  }

  return new Promise(async (resolve, reject) => { 
    const fileExists = await fsPromises.access(this.dbPath, fs.constants.W_OK).then(() => true).catch(() => false);
    const db = new sqlite.Database(this.dbPath, err => {
      if(err)
        reject(err.message);
    });
  
    if(!fileExists && recreateFunc !== undefined) {
      //recreate db here
      console.log("Database not found, Recreated");
    }
    
    this.db = db;
    this.connected = true;
    resolve(db);
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

DB.prototype.query = async (queryString, params = []) => new Promise((resolve, reject) => {
  if (!this.connected) {
    reject("DB not Connected");
    return;
  }

  this.db.all(queryString, params, (err, rows) => {
    if (err) reject(err);
    resolve(rows);
  });
});

DB.prototype.insert = async (insertString, params = []) => new Promise((resolve, reject) => {
  if (!this.connected) {
    reject("DB not Connected");
    return;
  }

  db.run(insertString, params, err => {
    if (err) reject(err);
    resolve(true);
  });
})

module.exports = new DB("./bot.db");