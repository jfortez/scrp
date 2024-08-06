import playwright from "playwright";

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

  const submitBtn = page.getByText("Ingresar");

  await submitBtn.click();

  await page.waitForTimeout(1000);

  const btnInvoice = page.getByTitle("Facturación Electrónica");
  await btnInvoice.click();

  const subBtn = page.getByText("Comprobantes electrónicos recibidos");
  await subBtn.click();
};

main();
