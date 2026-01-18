const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const statsRoutes = require("./API/routes/statsRoutes");
const xmlRoutes = require("./API/routes/xmlRoutes"); // se já tens

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/stats", statsRoutes);
app.use("/api", xmlRoutes); // opcional

const PORT = 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`API a correr em http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("Erro a ligar ao MongoDB:", err);
    process.exit(1);
  });