function build({ level = "distrito" } = {}) {
  const region = level === "concelho" ? "$localizacao.concelho" : "$localizacao.distrito";

  return [
    {
      $addFields: {
        estacao: {
          $cond: [
            { $in: [{ $month: "$data" }, [6, 7, 8]] }, "Verão",
            { $cond: [{ $in: [{ $month: "$data" }, [12, 1, 2]] }, "Inverno", "Outra"] }
          ]
        }
      }
    },
    { $match: { estacao: { $in: ["Verão", "Inverno"] } } },
    {
      $group: {
        _id: { regiao: region, estacao: "$estacao" },
        duracao_media: { $avg: "$duracao_horas" }
      }
    },
    {
      $project: {
        _id: 0,
        regiao: "$_id.regiao",
        estacao: "$_id.estacao",
        duracao_media_horas: { $round: ["$duracao_media", 2] }
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