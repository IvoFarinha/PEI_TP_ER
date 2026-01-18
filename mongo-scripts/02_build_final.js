// mongosh "mongodb://127.0.0.1:27017/TP_ER_PEI" mongo-scripts/02_build_final.js

function toNumber(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  const s = String(v).trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toDate(v) {
  if (!v) return null;

  if (v instanceof Date) {
    return isNaN(v.getTime()) ? null : v;
  }

  const s = String(v).trim();
  if (!s) return null;

  // 0) YYYYMMDD (ex: 20240102)  ✅ ESTE ERA O TEU PROBLEMA
  if (/^\d{8}$/.test(s)) {
    const y = Number(s.slice(0, 4));
    const m = Number(s.slice(4, 6)) - 1;
    const d = Number(s.slice(6, 8));
    const dt = new Date(Date.UTC(y, m, d));
    return isNaN(dt.getTime()) ? null : dt;
  }

  // 1) tenta Date direto
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  // 2) "YYYY-MM-DD HH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(s)) {
    d = new Date(s.replace(" ", "T") + "Z");
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function ymd(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function pickCollection(names) {
  const cols = db.getCollectionNames();
  for (const n of names) {
    if (cols.includes(n)) return db.getCollection(n);
  }
  throw new Error("Nenhuma coleção encontrada: " + names.join(", "));
}

// fontes (no teu caso raw_metereologia não existe, então MET_SRC vira metereologia)
const INC_SRC = pickCollection(["raw_incendios", "incendios_raw"]);
const LOC_SRC = pickCollection(["raw_localizacao", "localizacao_raw", "localizacao"]);
const CAU_SRC = pickCollection(["raw_causa", "causa_raw", "causa"]);
const MET_SRC = pickCollection(["raw_metereologia", "metereologia_raw", "metereologia"]);
const BOM_SRC = pickCollection(["raw_bombeiros", "bombeiros_raw", "bombeiros"]);

// bombeiros: campos reais do teu CSV
function getBomMunicipio(b) {
  return b.municipio ?? b["Concelho/municipio"] ?? null;
}
function getBomNumero(b) {
  return b.numero_bombeiros ?? b["Numero_Bombeiros"] ?? null;
}

// 1) MAPAS: localizacao + causa
const locMap = {};
LOC_SRC.find().forEach(l => {
  const id = String(l.id_localizacao);
  locMap[id] = {
    id_localizacao: id,
    distrito: l.distrito,
    concelho: l.concelho,
    freguesia: l.freguesia,
    latitude: toNumber(l.latitude),
    longitude: toNumber(l.longitude)
  };
});

const causaMap = {};
CAU_SRC.find().forEach(c => {
  const id = String(c.id_causa);
  causaMap[id] = {
    id_causa: id,
    grupo: c.grupo_causa,
    tipo: c.tipo_causa,
    descricao: c.descricao_causa
  };
});

// 2) MAPA bombeiros (por município/concelho em UPPER)
const bomMap = {};
BOM_SRC.find().forEach(b => {
  const muni = getBomMunicipio(b);
  if (!muni) return;
  const k = String(muni).toUpperCase().trim();
  bomMap[k] = { municipio: k, numero_bombeiros: toNumber(getBomNumero(b)) };
});

// 3) MAPA meteo por (location_id|YYYY-MM-DD) + lista de stations por dia
const metMap = {};       // "438|2024-01-05" -> subset meteo
const dayStations = {};  // "2024-01-05" -> ["129","438","2953",...]

MET_SRC.find().forEach(m => {
  const st = String(m.location_id);
  const d = toDate(m.data);
  const day = ymd(d);
  if (!st || !day) return;

  const key = `${st}|${day}`;

  metMap[key] = {
    location_id: st,
    data: d,
    temp_max: toNumber(m.temp_max),
    temp_mean: toNumber(m.temp_mean),
    temp_min: toNumber(m.temp_min),
    wind_max: toNumber(m.wind_max),
    gust_max: toNumber(m.gust_max)
  };

  if (!dayStations[day]) dayStations[day] = [];
  dayStations[day].push(st);
});

// ordenar stations por dia (determinístico)
Object.keys(dayStations).forEach(day => dayStations[day].sort());

print(`DEBUG: INC_SRC=${INC_SRC.getName()}  LOC_SRC=${LOC_SRC.getName()}  CAU_SRC=${CAU_SRC.getName()}`);
print(`DEBUG: MET_SRC=${MET_SRC.getName()}  metDocs=${MET_SRC.countDocuments()}  metKeys=${Object.keys(metMap).length}`);

// 4) recriar coleções finais (incendios/metereologia/bombeiros)
db.incendios.drop();
db.metereologia.drop();
db.bombeiros.drop();

// metereologia final (normalizada, copiando do MET_SRC)
const bulkMet = [];
let nMet = 0;

MET_SRC.find().forEach(m => {
  bulkMet.push({
    insertOne: {
      document: {
        ...m,
        location_id: String(m.location_id),
        data: toDate(m.data),
        temp_max: toNumber(m.temp_max),
        temp_mean: toNumber(m.temp_mean),
        temp_min: toNumber(m.temp_min),
        wind_max: toNumber(m.wind_max),
        gust_max: toNumber(m.gust_max),
        wind_dir: toNumber(m.wind_dir),
        precip_sum: toNumber(m.precip_sum),
        radiation: toNumber(m.radiation),
        sunshine: toNumber(m.sunshine)
      }
    }
  });
  nMet++;
  if (bulkMet.length === 2000) {
    db.metereologia.bulkWrite(bulkMet);
    bulkMet.length = 0;
  }
});
if (bulkMet.length) db.metereologia.bulkWrite(bulkMet);

print(`OK: metereologia -> ${nMet} docs`);

// bombeiros final (normalizado)
const bulkBom = [];
let nBom = 0;

BOM_SRC.find().forEach(b => {
  const muni = getBomMunicipio(b);
  if (!muni) return;

  bulkBom.push({
    insertOne: {
      document: {
        municipio: String(muni).toUpperCase().trim(),
        numero_bombeiros: toNumber(getBomNumero(b))
      }
    }
  });

  nBom++;
  if (bulkBom.length === 2000) {
    db.bombeiros.bulkWrite(bulkBom);
    bulkBom.length = 0;
  }
});
if (bulkBom.length) db.bombeiros.bulkWrite(bulkBom);

print(`OK: bombeiros -> ${nBom} docs`);

// 5) incendios final com Subset Pattern + meteo preenchida por DIA (sem lookup)
const bulkInc = [];
let nInc = 0;
let withMeteo = 0;
let withBom = 0;

INC_SRC.find().forEach(i => {
  const locId = String(i.id_localizacao);
  const causaId = String(i.id_causa);

  const dataInc = toDate(i.data);
  const day = ymd(dataInc);

  // escolhe uma estação REAL que exista nesse dia (determinístico pelo id_localizacao)
  let station_id = null;
  let meteo = null;

  if (day && dayStations[day] && dayStations[day].length) {
    const idx = Math.abs(parseInt(locId, 10)) % dayStations[day].length;
    station_id = dayStations[day][idx];
    meteo = metMap[`${station_id}|${day}`] || null;
  }

  const concelhoUpper = locMap[locId]?.concelho
    ? String(locMap[locId].concelho).toUpperCase().trim()
    : null;

  const bombeiros = concelhoUpper ? (bomMap[concelhoUpper] || null) : null;

  const doc = {
    id_incendio: String(i.id_incendio),
    data: dataInc,
    hora: String(i.hora),
    duracao_horas: toNumber(i.duracao_horas),

    areaTotal_ha: toNumber(i.areaTotal_ha),
    areaPov_ha: toNumber(i.areaPov_ha),
    areaMato_ha: toNumber(i.areaMato_ha),
    areaAgric_ha: toNumber(i.areaAgric_ha),

    localizacao: locMap[locId] || null,
    causa: causaMap[causaId] || null,

    // gerado (porque não existe no CSV de incêndios)
    station_id,

    // ubset meteo (agora deixa de ser sempre null)
    meteo,

    // ubset bombeiros
    bombeiros
  };

  if (meteo) withMeteo++;
  if (bombeiros) withBom++;

  bulkInc.push({ insertOne: { document: doc } });
  nInc++;

  if (bulkInc.length === 2000) {
    db.incendios.bulkWrite(bulkInc);
    bulkInc.length = 0;
  }
});
if (bulkInc.length) db.incendios.bulkWrite(bulkInc);

print(`OK: incendios -> ${nInc} docs | com meteo: ${withMeteo} | com bombeiros: ${withBom}`);

// 6) índices
db.incendios.createIndex({ id_incendio: 1 });
db.incendios.createIndex({ data: 1 });
db.incendios.createIndex({ "localizacao.distrito": 1, data: 1 });
db.incendios.createIndex({ station_id: 1, data: 1 });
db.incendios.createIndex({ "meteo.temp_max": 1 });
db.incendios.createIndex({ "bombeiros.municipio": 1 });

db.metereologia.createIndex({ location_id: 1, data: 1 });
db.bombeiros.createIndex({ municipio: 1 });

print("\nBUILD FINAL: concluído.");