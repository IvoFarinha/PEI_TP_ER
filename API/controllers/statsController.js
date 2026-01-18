const mongoose = require("mongoose");

const q1 = require("../../mongo-scripts/03_queries/q1");
const q2 = require("../../mongo-scripts/03_queries/q2");
const q3 = require("../../mongo-scripts/03_queries/q3");
const q4 = require("../../mongo-scripts/03_queries/q4");
const q5 = require("../../mongo-scripts/03_queries/q5");
const q6 = require("../../mongo-scripts/03_queries/q6");

function col(name) {
  return mongoose.connection.db.collection(name);
}

async function run(res, collectionName, pipeline) {
  const out = await col(collectionName).aggregate(pipeline).toArray();
  res.json({ ok: true, count: out.length, data: out });
}

exports.q1 = async (req, res) => {
  try {
    // params: month=7 | season=Verao
    const month = req.query.month ? Number(req.query.month) : null;
    const season = req.query.season || null;
    return run(res, "incendios", q1({ month, season }));
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

exports.q2 = async (req, res) => {
  try {
    // params: minArea=50
    const minArea = req.query.minArea ? Number(req.query.minArea) : 50;
    return run(res, "incendios", q2({ minArea }));
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

exports.q3 = async (req, res) => {
  try {
    // params: level=distrito|concelho
    const level = req.query.level || "distrito";
    return run(res, "incendios", q3({ level }));
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

exports.q4 = async (req, res) => {
  try {
    // params: n=10 | temp=35 | level=distrito|concelho
    const n = req.query.n ? Number(req.query.n) : 10;
    const temp = req.query.temp ? Number(req.query.temp) : 35;
    const level = req.query.level || "distrito";
    return run(res, "incendios", q4({ n, temp, level }));
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

exports.q5 = async (req, res) => {
  try {
    return run(res, "incendios", q5());
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

exports.q6 = async (req, res) => {
  try {
    // params: start=2024-01-01&end=2025-01-01&level=distrito|concelho
    const start = req.query.start ? new Date(req.query.start) : new Date("2024-01-01");
    const end = req.query.end ? new Date(req.query.end) : new Date("2025-01-01");
    const level = req.query.level || "distrito";
    return run(res, "incendios", q6({ start, end, level }));
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
