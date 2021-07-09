module.exports = module.exports = {
  query: query,
};

const Pool = require("pg").Pool;

function query(quyerString, cbFunc) {
  const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "api",
    password: "Nhtminh09032002",
    port: 5432,
  });

  pool.query(quyerString, (error, result) => {
    cbFunc(setResponse(error, result));
  });
}

function setResponse(error, results) {
  return {
    error: error,
    results: results ? results : null,
  };
}
