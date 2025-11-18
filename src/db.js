const { MongoClient } = require("mongodb");

let db = null;

module.exports = {
  connect: async (callback) => {
    const host = process.env.MONGO_HOST;
    const port = process.env.MONGO_PORT;
    const user = process.env.MONGO_USER;
    const pass = process.env.MONGO_PASS;
    const database = process.env.MONGO_DB;

    const uri = `mongodb://${user}:${pass}@${host}:${port}/${database}?authSource=${database}`;

    const client = new MongoClient(uri);

    try {
      await client.connect();
      db = client.db(database);
      callback();
    } catch (err) {
      callback(err);
    }
  },

  get: () => db
};
