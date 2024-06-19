const sql = require("mssql");
require("dotenv").config();

const config = {
  user: "swb4",
  password: "swb4",
  server: "ITNT0005",
  database: "SWB_DB2_Projekt",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function getConnection() {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error("No connection to the database!", err);
    throw err;
  }
}

module.exports = {
  getConnection,
  sql,
};
