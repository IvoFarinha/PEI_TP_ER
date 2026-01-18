function build({ n = 10, temp = 35, level = "distrito" } = {}) {
  const region = level === "concelho" ? "$localizacao.concelho" : "$localizacao.distrito";

  return [
    { $match: { meteo: { $ne: null }, "meteo.temp_max": { $gt: temp } } },
    { $group: { _id: region, num_incendios: { $sum: 1 } } },
    { $sort: { num_incendios: -1 } },
    { $limit: n },
    { $project: { _id: 0, regiao: "$_id", num_incendios: 1 } }
  ];
}

if (typeof module !== "undefined" && module.exports) module.exports = build;

if (typeof db !== "undefined") {
  const params = (typeof QPARAMS !== "undefined") ? QPARAMS : {};
  printjson(db.incendios.aggregate(build(params)).toArray());
}