const { XMLParser } = require("fast-xml-parser");
const express = require("express");
const validator = require("xsd-schema-validator");
const path = require("path");

const parser = new XMLParser({
  explicitArray: false,
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  numberParseOptions: { hex: true, leadingZeros: false }
});

const xmlMiddleware = [
  express.text({ type: ["application/xml", "text/xml"] }),

  async (req, res, next) => {
    const ct = req.get("Content-Type") || "";

    if (ct.includes("xml") && typeof req.body === "string") {
      const absoluteSchemaPath = path.join(__dirname, "..", "schemas", "wildfirestats.xsd");
      const schemaPath = path.relative(process.cwd(), absoluteSchemaPath);

      try {
        await validator.validateXML(req.body.trim(), schemaPath);
        const parsed = parser.parse(req.body);

        req.body = parsed;
        return next();
      } catch (err) {
        return res.status(400).json({
          status: "error",
          message: "Falha na validação do esquema XSD / processamento do XML",
          details: err.message,
          validationErrors: err.messages || null
        });
      }
    }

    return next();
  }
];

module.exports = xmlMiddleware;