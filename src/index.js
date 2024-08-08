import playwright from "playwright";
import http from "http";
import { writeFile } from "fs/promises";

const getRows = async (table) => {
  const rowsSelector = await table.locator("tbody > tr").all();

  const rows = [];
  for (const row of rowsSelector) {
    const cells = await row.locator("td").all();
    const rowData = [];
    for (const cell of cells) {
      const text = await cell.textContent();
      rowData.push(text);
    }
    rows.push(rowData);
  }

  return rows;
};
const main = async () => {
  /**
   * @type {playwright.LaunchOptions}
   */
  const launchOptions = {
    headless: false,
  };
  const browser = await playwright.firefox.launch(launchOptions);

  const page = await browser.newPage();
  await page.goto("https://srienlinea.sri.gob.ec/sri-en-linea/inicio/NAT");

  await page.getByText("Iniciar sesión").first().click();

  const rucInput = page.getByPlaceholder("1700000000001");

  await rucInput.fill(process.env.RUC);

  const passInput = page.getByPlaceholder("Clave");

  await passInput.fill(process.env.PASSWORD);

  const loginButton = page.getByText("Ingresar");

  await loginButton.click();

  await page.waitForTimeout(1000);

  const btnInvoice = page.getByTitle("Facturación Electrónica");
  await btnInvoice.click();

  const subBtn = page.getByText("Comprobantes electrónicos recibidos");
  await subBtn.click();

  await page.waitForSelector('[id="frmPrincipal:ano"]');

  // const yearCb = page.locator('[id="frmPrincipal:ano"]')
  // const monthCb = page.locator('[id="frmPrincipal:mes"]')
  const dayCb = page.locator('[id="frmPrincipal:dia"]');
  await dayCb.click();
  await dayCb.selectOption("0");

  await page.waitForTimeout(100);

  const submitBtn = page.getByRole("button", { name: "Consultar" });

  await submitBtn.click();

  await page.waitForSelector('[id="frmPrincipal:tablaCompRecibidos"]');

  try {
    const table = page.locator('[id="frmPrincipal:tablaCompRecibidos"] > table');
    const footer = table.locator("tfoot > tr > td");

    const headersSelector = await table.locator("thead > tr > th").all();

    const paginatorSelect = footer.locator("select");
    await paginatorSelect.selectOption("75");

    const getPaginatorValues = async () => {
      const currentPaginator = footer.locator(".ui-paginator-current");
      const paginatorValues = await currentPaginator.textContent(); //(1 of 1)
      const match = paginatorValues.match(/\((\d+)\s+of\s+(\d+)\)/);
      const current = parseInt(match[1], 10);
      let total = parseInt(match[2], 10);

      return { current, total };
    };

    const rows = [...(await getRows(table))];

    let paginatorValues = await getPaginatorValues();
    const nextBtn = footer.locator(".ui-paginator-next");

    while (paginatorValues.current < paginatorValues.total) {
      await nextBtn.click();
      paginatorValues = await getPaginatorValues();
      await page.waitForTimeout(100);

      rows.push(...(await getRows(table)));
    }

    const keys = await Promise.all(headersSelector.map((e) => e.textContent()));
    const result = [];

    for (const row of rows) {
      const obj = {};
      for (let i = 0; i < row.length; i++) {
        obj[keys[i]] = row[i];
      }
      result.push(obj);
    }

    await writeFile("data.json", JSON.stringify(result));
    console.log("Data saved");
  } catch (error) {
    console.log(error);
  }
};

main();

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  if (method === "POST" && url === "/") {
    res.end("OK");
  }
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
