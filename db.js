const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/TP_ER_PEI");
    console.log("MongoDB ligado com sucesso!");
  } catch (err) {
    console.error("Erro ao ligar ao MongoDB:", err);
    process.exit(1);
  }
}

module.exports = connectDB;