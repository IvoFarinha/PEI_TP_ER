function normDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function build({ start, end, level = "distrito" } = {}) {
  const region = level === "concelho" ? "$localizacao.concelho" : "$localizacao.distrito";
  const startDate = normDate(start) || new Date("2024-01-01");
  const endDate = normDate(end) || new Date("2025-01-01");

  return [
    { $match: { data: { $gte: startDate, $lt: endDate }, meteo: { $ne: null } } },
    {
      $group: {
        _id: region,
        temp_media: { $avg: "$meteo.temp_mean" },
        temp_max: { $max: "$meteo.temp_max" },
        temp_min: { $min: "$meteo.temp_min" }
      }
    },
    {
      $project: {
        _id: 0,
        regiao: "$_id",
        temp_media: { $round: ["$temp_media", 2] },
        temp_max: 1,
        temp_min: 1
      }
    },
    { $sort: { regiao: 1 } }
  ];
}

if (typeof module !== "undefined" && module.exports) module.exports = build;

if (typeof db !== "undefined") {
  const params = (typeof QPARAMS !== "undefined") ? QPARAMS : {};
  printjson(db.incendios.aggregate(build(params)).toArray());
}