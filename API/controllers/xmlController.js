const { saveInbox } = require("../services/xmlService");

function detectType(parsed) {
  if (parsed?.ocorrencia) return "ocorrencia";
  if (parsed?.meteorologia) return "meteorologia";
  if (parsed?.alocacaoMeios) return "alocacaoMeios";
  return "unknown";
}

module.exports = {
  ingest: async (req, res) => {
    const type = detectType(req.body);
    if (type === "unknown") return res.status(400).json({ ok: false, message: "Raiz XML desconhecida" });

    await saveInbox({
      type,
      receivedAt: new Date(),
      payload: req.body
    });

    res.json({ ok: true, message: "XML válido e guardado", type });
  }
};
