const express = require("express");
const puppeteer = require("puppeteer");
const path = require("path");
const { SANDBOX_SELECTION, SUBMIT_BUTTON_CLASS, PARENT_INPUT_DIV_CLASS } = require("./constants");

const app = express();
let successMessage = false;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JavaScript, etc.)
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("form");
});

app.post("/submit", async (req, res) => {
  const formLink = req.body.formUrl;
  let browser;

  try {

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      //headless option runs the browser in the command line
      //use false option to launch browser with graphic interface
      args: [SANDBOX_SELECTION],
      // slowMo: 100
    });

    const page = await browser.newPage();

    // Navigate to the form URL
    await page.goto(formLink, { waitUntil: "networkidle2" });

    // Wait for the selector to load
    await page.waitForSelector(PARENT_INPUT_DIV_CLASS);

    // Get all the inputDivs with class name PARENT_INPUT_DIV_CLASS
    const inputDivs = await page.$$(PARENT_INPUT_DIV_CLASS);

    // Loop through each inputDivs and determine its type (short answer or multiple choice)
    for (const inputDiv of inputDivs) {
      const span = await inputDiv.$("span"); // Check if there's a <span> inside the inputDiv
      const inputField = await inputDiv.$('input[type="text"]'); // Check for a text input field
      const checkbox = await inputDiv.$('div[role="checkbox"]'); // Check for a checkbox
      
      if (checkbox) {
        // This is a "multiple choice" field
        await checkbox?.click();
      } else {
        // This is a "short answer" field
        const fieldName = await span?.evaluate((el) => el.textContent);
        await inputField?.type(`Hello ${fieldName}`);
      }
    }

    // Click the submit button
    await page.click(SUBMIT_BUTTON_CLASS);
    await page.waitForNavigation();
    const submissionPage = await page.url();
    if (submissionPage.includes("formResponse")) {
      successMessage=true
      console.log("Form Submitted Successfully");
    }
    await page.close();
    await browser.close();
    res.send('success')
  } catch (error) {
    console.error("An error occurred:", error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
