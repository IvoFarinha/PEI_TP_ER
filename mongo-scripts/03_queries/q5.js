function build() {
  return [
    { $match: { bombeiros: { $ne: null } } },
    {
      $group: {
        _id: "$bombeiros.municipio",
        num_incendios: { $sum: 1 },
        numero_bombeiros: { $first: "$bombeiros.numero_bombeiros" }
      }
    },
    {
      $addFields: {
        incendios_por_100_bombeiros: {
          $cond: [
            { $gt: ["$numero_bombeiros", 0] },
            { $round: [{ $multiply: [{ $divide: ["$num_incendios", "$numero_bombeiros"] }, 100] }, 2] },
            null
          ]
        }
      }
    },
    {
      $project: {
        _id: 0,
        municipio: "$_id",
        num_incendios: 1,
        numero_bombeiros: 1,
        incendios_por_100_bombeiros: 1
      }
    },
    { $sort: { num_incendios: -1 } }
  ];
}

if (typeof module !== "undefined" && module.exports) module.exports = build;

if (typeof db !== "undefined") {
  printjson(db.incendios.aggregate(build()).toArray());
}