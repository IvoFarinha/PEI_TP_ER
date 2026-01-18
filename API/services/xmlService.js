const mongoose = require("mongoose");

async function saveInbox(doc) {
  return mongoose.connection.collection("xml_inbox").insertOne(doc);
}

module.exports = { saveInbox };
