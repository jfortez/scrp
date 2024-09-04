import http from "http";

import { getInvoices } from "./invoices";
import supabase from "./database";
import { Tables } from "./database.types";
import { writeFile } from "fs/promises";

const lookUp: Record<string, string | string[]> = {
  "RUC y Razón social emisor": ["ruc", "entity"],
  "Tipo y serie de comprobante": "type_serie",
  "Clave de acceso / Nro. Autorización": "access_key",
  "Fecha y hora de autorización": "authorization_date",
  "Fecha emisión": "emit_date",
  "Valor sin impuestos": "value",
  IVA: "tax",
  "Importe Total": "total",
};

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  if (method === "GET") {
    if (url === "/load-invoices") {
      try {
        const invoices = await getInvoices();
        await writeFile("data.json", JSON.stringify(invoices));

        const data = invoices.map((item) => {
          const newObj: Record<string, any> = {};
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
                  ? new Date(value).toISOString()
                  : // ? new Date(value).toISOString().slice(0, 22)

                    value;
              }
            }
          }

          return newObj;
        }) as Tables<"invoices">[];
        const result = await supabase.from("invoices").insert(data);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify(error));
      }
    }

    if (url === "/invoices") {
      try {
        const invoices = await supabase.from("invoices").select("*");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(invoices));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify(error));
      }
    }
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello World\n");
  }
});

const PORT = process.env.PORT || 3000;

server.listen(+PORT, () => {
  console.log("Server running on port", PORT);
});
