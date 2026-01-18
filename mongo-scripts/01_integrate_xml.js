// mongosh "mongodb://127.0.0.1:27017/TP_ER_PEI" mongo-scripts/01_integrate_xml.js

function toNum(v) {
  if (v === null || v === undefined) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function upper(v) {
  return v ? String(v).toUpperCase() : null;
}

let nOcc = 0, nMet = 0, nAlo = 0;

db.xml_inbox.find({ processedAt: { $exists: false } }).forEach(msg => {
  const type = msg.type;
  const payload = msg.payload || {};

  if (type === "ocorrencia") {
    const o = payload.ocorrencia;
    if (!o) return;

    const doc = {
      id_incendio: String(o.codigoIncidente),
      data: toDate(o.inicio),
      duracao_horas: toNum(o.duracaoHoras),
      areaTotal_ha: toNum(o.areaArdidaHa),

      localizacao: {
        distrito: o.localizacao?.distrito || null,
        concelho: o.localizacao?.concelho || null,
        freguesia: o.localizacao?.freguesia || null
      },

      causa: o.causaProvavel ? { descricao: String(o.causaProvavel) } : null,
      estado: o.estado || null,

      // garantir campos usados nas queries
      areaPov_ha: 0,
      areaMato_ha: 0,
      areaAgric_ha: 0
    };

    db.incendios.updateOne(
      { id_incendio: doc.id_incendio },
      { $set: doc },
      { upsert: true }
    );

    nOcc++;
  }

  if (type === "meteorologia") {
    const m = payload.meteorologia;
    if (!m) return;

    const doc = {
      location_id: String(m.estacaoId),
      data: toDate(m.data),

      temp_max: toNum(m.temperaturaMax),
      temp_mean: toNum(m.temperaturaMedia),
      temp_min: toNum(m.temperaturaMin),

      wind_max: toNum(m.ventoVelocidadeMax),
      gust_max: toNum(m.ventoRafadaMax),

      precipitacao: toNum(m.precipitacaoSoma),
      pressao: toNum(m.pressaoAtmosferica),
      radiacao: toNum(m.radiacao),
      insolacao: toNum(m.insolacao)
    };

    db.metereologia.updateOne(
      { location_id: doc.location_id, data: doc.data },
      { $set: doc },
      { upsert: true }
    );

    nMet++;
  }

  if (type === "alocacaoMeios") {
    const a = payload.alocacaoMeios;
    if (!a) return;

    const municipio = upper(a.regiao?.municipio);
    const ano = a.ano ? String(a.ano) : null;

    const doc = {
      ano,
      municipio,
      freguesia: a.regiao?.freguesia || null,
      capacidade_bombeiros: Number(a.capacidadeBombeiros)
    };

    db.alocacao_meios.updateOne(
      { ano: doc.ano, municipio: doc.municipio },
      { $set: doc },
      { upsert: true }
    );

    // opcional mas útil para Q5 (se quiseres alimentar bombeiros por XML)
    db.bombeiros.updateOne(
      { municipio: doc.municipio },
      { $set: { municipio: doc.municipio, numero_bombeiros: doc.capacidade_bombeiros } },
      { upsert: true }
    );

    nAlo++;
  }

  db.xml_inbox.updateOne(
    { _id: msg._id },
    { $set: { processedAt: new Date() } }
  );
});

print(`OK integrate_xml -> ocorrencias:${nOcc} meteorologia:${nMet} alocacao:${nAlo}`);

db.xml_inbox.createIndex({ processedAt: 1, type: 1, receivedAt: -1 });
db.incendios.createIndex({ id_incendio: 1 });
db.metereologia.createIndex({ location_id: 1, data: 1 });
db.alocacao_meios.createIndex({ ano: 1, municipio: 1 });