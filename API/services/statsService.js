const mongoose = require("mongoose");

async function aggIncendios(pipeline) {
  return mongoose.connection.collection("incendios").aggregate(pipeline).toArray();
}

module.exports = { aggIncendios };
