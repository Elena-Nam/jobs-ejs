const { app } = require("../app");
const get_chai = require("../util/get_chai");
const Job = require("../models/Job");
const { seed_db, testUserPassword } = require("../util/seed_db");

describe("Testing Job CRUD Operations", function () {

  before(async function () {
    const { expect, request } = await get_chai();

    // Seed database
    this.test_user = await seed_db();

    // Get CSRF token
    let req = request.execute(app).get("/sessions/logon").send();
    let res = await req;

    const textNoLineEnd = res.text.replaceAll("\n", "");
    // this.csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd)[1];
    const csrfMatch = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd);
    if (!csrfMatch) throw new Error("CSRF token not found on logon page");
    this.csrfToken = csrfMatch[1];

    let cookies = res.headers["set-cookie"];
    this.csrfCookie = cookies.find((element) =>
      element.includes("csrf")
    );

    // Log in
    const dataToPost = {
      email: this.test_user.email,
      password: testUserPassword,
      _csrf: this.csrfToken,
    };

    req = request
      .execute(app)
      .post("/sessions/logon")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);

    res = await req;

    cookies = res.headers["set-cookie"];
    this.sessionCookie = cookies.find((element) =>
      element.startsWith("connect.sid")
    );

    expect(this.csrfToken).to.not.be.undefined;
    expect(this.csrfCookie).to.not.be.undefined;
    expect(this.sessionCookie).to.not.be.undefined;
  });

  it("should add a job", async function () {
    const { expect, request } = await get_chai();

    // Create fake job data
    const jobData = {
    company: "Test Company",
    position: "Software Engineer",
    status: "pending", // optional, default is 'pending'
    _csrf: this.csrfToken,
    };

    const req = request
      .execute(app)
      .post("/jobs")   // confirm this matches your route
      .set("Cookie", this.csrfCookie + ";" + this.sessionCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(jobData);

    const res = await req;

    expect(res).to.have.status(200);

    // Verify database now has 21 jobs for this user
    const jobs = await Job.find({ createdBy: this.test_user._id });
    expect(jobs.length).to.equal(21);
  });

})