import http from "http";
import { writeFile, readFile } from "fs/promises";

import { getInvoices } from "./invoices.js";
import supabase from "./database.js";

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  if (method === "GET" && url === "get") {
    const invoices = await getInvoices();
    await writeFile("data.json", JSON.stringify(invoices));
  }
});

const PORT = process.env.PORT || 3000;

server.listen(+PORT, () => {
  console.log("Server running on port 3000");
});

const lookUp = {
  "RUC y Razón social emisor": ["ruc", "entity"],
  "Tipo y serie de comprobante": "type_serie",
  "Clave de acceso / Nro. Autorización": "access_key",
  "Fecha y hora de autorización": "authorization_date",
  "Fecha emisión": "emit_date",
  "Valor sin impuestos": "value",
  IVA: "tax",
  "Importe Total": "total",
};

const main = async () => {
  const invoices = await readFile("data.json", "utf-8");
  const data = JSON.parse(invoices);
  const result = data.map((item) => {
    const newObj = {};
    for (const [key, value] of Object.entries(item)) {
      const newKey = lookUp[key];
      if (newKey) {
        if (Array.isArray(newKey)) {
          const ruc = value.slice(0, 13);
          const entity = value.slice(13).trim();

          newObj[newKey[0]] = ruc;
          newObj[newKey[1]] = entity;
        } else {
          newObj[newKey] = ["value", "tax", "total"].includes(newKey)
            ? parseFloat(value)
            : newKey.includes("date")
            ? new Date(value).toISOString().slice(0, 22)
            : value;
        }
      }
    }

    return newObj;
  });

  const r = await supabase.from("invoices").select();
  console.log(r);
  // console.log(result);
  // const r = await supabase.from("invoices").insert(result);

  // console.log(r);
};

main();
