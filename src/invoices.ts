import playwright, { type Locator, type Page } from "playwright";

type InvoiceJSON = {
  "RUC y Razón social emisor": string;
  "Tipo y serie de comprobante": string;
  "Clave de acceso / Nro. Autorización": string;
  "Fecha y hora de autorización": string;
  "Fecha emisión": string;
  "Valor sin impuestos": string;
  IVA: string;
  "Importe Total": string;
};

const getRows = async (table: Locator) => {
  const rowsSelector = await table.locator("tbody > tr").all();

  const rows = [];
  for (const row of rowsSelector) {
    const cells = await row.locator("td").all();
    const rowData = [];
    for (const cell of cells) {
      const text = await cell.textContent();
      if (text) {
        rowData.push(text);
      }
    }
    rows.push(rowData);
  }

  return rows;
};

const getPaginatorValues = async (footer: Locator) => {
  const currentPaginator = footer.locator(".ui-paginator-current");
  const paginatorValues = (await currentPaginator.textContent()) as string; //(1 of 1)
  const match = paginatorValues.match(/\((\d+)\s+of\s+(\d+)\)/) || [];
  const current = parseInt(match[1], 10);
  let total = parseInt(match[2], 10);

  return { current, total };
};

const getTableData = async (page: Page): Promise<InvoiceJSON[]> => {
  try {
    const submitBtn = page.getByRole("button", { name: "Consultar" });

    await submitBtn.click();

    const noDataMessage = page.locator('[id="formMessages:messages"]');
    const hasWarning = await noDataMessage.isVisible();
    if (hasWarning) {
      return [];
    }

    const tableSelector = '[id="frmPrincipal:tablaCompRecibidos"]';
    const isTableVisible = await page.isVisible(tableSelector);

    if (!isTableVisible) {
      return [];
    }

    const table = page.locator('[id="frmPrincipal:tablaCompRecibidos"] > table');
    const footer = table.locator("tfoot > tr > td");

    const headersSelector = await table.locator("thead > tr > th").all();

    const paginatorSelect = footer.locator("select");
    await paginatorSelect.selectOption("75");

    const rows = [...(await getRows(table))];

    let paginatorValues = await getPaginatorValues(footer);
    const nextBtn = footer.locator(".ui-paginator-next");

    while (paginatorValues.current < paginatorValues.total) {
      await nextBtn.click();
      paginatorValues = await getPaginatorValues(footer);
      await page.waitForTimeout(100);

      rows.push(...(await getRows(table)));
    }

    const keys = await Promise.all(headersSelector.map((e) => e.textContent()));
    const result: InvoiceJSON[] = [];

    for (const row of rows) {
      const obj: InvoiceJSON = {} as InvoiceJSON;
      for (let i = 0; i < row.length; i++) {
        const key = keys[i] as keyof InvoiceJSON;
        const value = row[i];
        if (key && value) {
          obj[key] = value;
        }
      }
      result.push(obj);
    }

    return result;
  } catch (error) {
    return [];
  }
};
export const getInvoices = async () => {
  const launchOptions: playwright.LaunchOptions = {
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

  const yearCb = page.locator('[id="frmPrincipal:ano"]');
  const monthCb = page.locator('[id="frmPrincipal:mes"]');
  const dayCb = page.locator('[id="frmPrincipal:dia"]');
  await dayCb.click();
  await dayCb.selectOption("0");

  const yearOptions = ["2020", "2021", "2022", "2023", "2024"];
  const monthOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  let invoices: InvoiceJSON[] = [];

  for (const year of yearOptions) {
    await yearCb.selectOption(year);
    for (const month of monthOptions) {
      await monthCb.selectOption(month);
      await page.waitForTimeout(100); // Pequeña pausa para asegurar que la página se actualice

      const tableData = await getTableData(page);
      invoices = invoices.concat(tableData);
    }
  }

  // Aquí puedes usar allTableData que contendrá todos los datos recopilados
  console.log(`Total de facturas recopiladas: ${invoices.length}`);

  return invoices;
};
