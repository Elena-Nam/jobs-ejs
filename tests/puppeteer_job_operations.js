
const puppeteer = require("puppeteer");
require("../app");
const { seed_db, testUserPassword } = require("../util/seed_db");
const Job = require("../models/Job");
const { expect } = require("chai");

let browser;
let page;
let testUser;

describe("puppeteer job operations", function () {
  this.timeout(40000);

  before(async function () {
    browser = await puppeteer.launch({
      headless: true,
      slowMo: 30,
    });

    page = await browser.newPage();

    // Seed database user + jobs
    testUser = await seed_db();

    // Go to logon page 
    await page.goto("http://localhost:3000/sessions/logon", {
      waitUntil: "networkidle0",
    });

    // Fill login form
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', testUser.email);

    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', testUserPassword);

    await Promise.all([
      page.click("button"),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    // Confirm login succeeded
    await page.waitForSelector(
      `p ::-p-text(${testUser.name} is logged on.)`
    );
  });

  after(async function () {
    await browser.close();
  });

  it("should go to jobs list page and see 20 entries", async function () {
    // Navigate directly (more stable than clicking)
    await page.goto("http://localhost:3000/jobs", {
      waitUntil: "networkidle0",
    });

    await page.waitForSelector("table");

    const rows = await page.$$("table tr");
    expect(rows.length - 1).to.equal(20);
  });

  it("should open add job page", async function () {
    await page.goto("http://localhost:3000/jobs", {
      waitUntil: "networkidle0",
    });

    await Promise.all([
      page.click('a[href="/jobs/new"]'),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    await page.waitForSelector('input[name="company"]');
    await page.waitForSelector('input[name="position"]');
    await page.waitForSelector("button");
  });

  it("should add a new job and verify in database", async function () {
    await page.goto("http://localhost:3000/jobs/new", {
      waitUntil: "networkidle0",
    });

    const company = "Test Company";
    const position = "Test Position";

    await page.type('input[name="company"]', company);
    await page.type('input[name="position"]', position);

    await Promise.all([
      page.click("button"),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    // Check success message
    const content = await page.content();
    expect(content).to.include("Job");

    // Verify in database (find exact job instead of guessing)
    const job = await Job.findOne({
      company: company,
      position: position,
      createdBy: testUser._id,
    });

    expect(job).to.exist;
    expect(job.company).to.equal(company);
    expect(job.position).to.equal(position);
    });
});

