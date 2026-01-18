function build({ month = null, season = null } = {}) {
  const match = {};

  if (month) match.$expr = { $eq: [{ $month: "$data" }, month] };

  if (season) {
    if (season === "Verao") match.$expr = { $in: [{ $month: "$data" }, [6, 7, 8]] };
    if (season === "Inverno") match.$expr = { $in: [{ $month: "$data" }, [12, 1, 2]] };
  }

  return [
    { $match: match },
    {
      $group: {
        _id: {
          distrito: "$localizacao.distrito",
          tipo_povoamento: {
            $cond: [
              { $gt: ["$areaMato_ha", 0] }, "Mato",
              { $cond: [{ $gt: ["$areaAgric_ha", 0] }, "Agrícola", "Florestal"] }
            ]
          }
        },
        media_area: { $avg: "$areaTotal_ha" }
      }
    },
    {
      $project: {
        _id: 0,
        distrito: "$_id.distrito",
        tipo_povoamento: "$_id.tipo_povoamento",
        media_area_ardida: { $round: ["$media_area", 2] }
      }
    },
    { $sort: { distrito: 1 } }
  ];
}

if (typeof module !== "undefined" && module.exports) module.exports = build;

if (typeof db !== "undefined") {
  const params = (typeof QPARAMS !== "undefined") ? QPARAMS : {};
  printjson(db.incendios.aggregate(build(params)).toArray());
}