import playwright from "playwright";

const main = async () => {
  // const browser = await playwright.chromium.launch();
  // const context = await browser.newContext();
  // const page = await context.newPage();
  // await page.goto("https://amazon.com");
  // await page.screenshot({ path: `nodejs.png`, fullPage: true });
  // await page.waitForTimeout(1000);
  // await browser.close();

  /**
   * @type {playwright.LaunchOptions}
   */
  const launchOptions = {
    headless: false,

    // proxy: {
    //   server: "http://us-pr.oxylabs.io:10000",
    //   username: "USERNAME",
    //   password: "PASSWORD",
    // },
  };
  const browser = await playwright.firefox.launch(launchOptions);

  const page = await browser.newPage();
  await page.goto("https://srienlinea.sri.gob.ec/sri-en-linea/inicio/NAT");

  await page.getByText("Iniciar sesión").first().click();

  const rucInput = page.getByPlaceholder("1700000000001");

  await rucInput.fill("0951122159001");

  const passInput = page.getByPlaceholder("Clave");

  await passInput.fill("Redsun1513#");

  const submitBtn = page.getByText("Ingresar");

  await submitBtn.click();

  await page.waitForTimeout(1000);

  const btnInvoice = page.getByTitle("Facturación Electrónica");
  await btnInvoice.click();

  const subBtn = page.getByText("Comprobantes electrónicos recibidos");
  await subBtn.click();

  // await browser.close();

  // const browser = await playwright.chromium.launch(launchOptions);
  // const page = await browser.newPage();
  // await page.goto("https://www.amazon.com/b?node=17938598011");
  // await page.waitForTimeout(5000);

  // const products = await page.$$eval(".s-card-container > .a-spacing-base", (all_products) => {
  //   const data = [];
  //   all_products.forEach((product) => {
  //     const titleEl = product.querySelector(".a-size-base-plus");
  //     const title = titleEl ? titleEl.innerText : null;
  //     const priceEl = product.querySelector(".a-price");
  //     const price = priceEl ? priceEl.innerText : null;
  //     const ratingEl = product.querySelector(".a-icon-alt");
  //     const rating = ratingEl ? ratingEl.innerText : null;
  //     data.push({ title, price, rating });
  //   });
  //   return data;
  // });
  // console.log(products);
  // await browser.close();
};

main();
