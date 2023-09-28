// server.js

const express = require("express");
const puppeteer = require("puppeteer");
const path = require("path");

const app = express();

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
    browser = await puppeteer.launch({
      headless: true,
      //headless option runs the browser in the command line
      //use false option to launch browser with graphic interface
      args: ["--no-sandbox"],
      // slowMo: 100
    });

    const page = await browser.newPage();
    console.log("Opening form");

    // Opening Form
    await page.goto(formLink, { waitUntil: "networkidle2" });
    const title = await page.$eval("title", (el) => el.textContent);
    console.log("form opened");
    console.log("Form Title: " + title);

    // Identify and fill "short answer" fields
    const shortAnswerFields = await page.$$(".whsOnd, .zHQkBf");

    // Wait for the page to load (you may need to adjust the waiting time)
    await page.waitForSelector(".geS5n");

    // Get all the inputDivs with class name geS5n
    const inputDivs = await page.$$(".geS5n");

    // Loop through each inputDiv and determine its type (short answer or multiple choice)
    for (const inputDiv of inputDivs) {
      const span = await inputDiv.$("span"); // Check if there's a <span> inside the inputDiv
      const inputField = await inputDiv.$('input[type="text"]'); // Check for a text input field
      const checkbox = await inputDiv.$('div[role="checkbox"]'); // Check for a checkbox
      if (checkbox) {
        // This is a "multiple choice" field
        await checkbox.click();
      } else {
        // This is a "short answer" field
        const fieldName = await span.evaluate((el) => el.textContent);
        await inputField.type(`hello ${fieldName}`);
      }
    }
    await page.click(".uArJ5e, .UQuaGc, .Y5sE8d, .VkkpIf, .QvWxOd");
    await page.waitForNavigation();
    const submissionPage = await page.url();
    console.log(submissionPage);
    if (submissionPage.includes("formResponse")) {
      console.log("Form Submitted Successfully");
    }
    await page.close();
    await browser.close();
  } catch (error) {
    console.error("An error occurred:", error);
  }

  // Redirect back to the form page
  res.redirect("/");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
