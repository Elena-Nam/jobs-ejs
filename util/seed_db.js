const Job = require("../models/Job");
const User = require("../models/User");
// generate random but realistic data
const faker = require("@faker-js/faker").fakerEN_US;
// automatically create database records, easy to generate many test objects
const FactoryBot = require("factory-bot");
require("dotenv").config();

//Generate a random password. Used for the test user.
const testUserPassword = faker.internet.password();
// work with Mongoose, connect it to  database models, can create real database records
const factory = FactoryBot.factory;
const factoryAdapter = new FactoryBot.MongooseAdapter();
factory.setAdapter(factoryAdapter);

/*
 tells factory: 
  "job"- create a Job model,
  "company"- random company name,
  "position" - random job title,
  "status" -Randomly chooses one of these
 */
factory.define("job", Job, {
  company: () => faker.company.name(),
  position: () => faker.person.jobTitle(),
  status: () =>
    ["interview", "declined", "pending"][Math.floor(3 * Math.random())], // random one of these
});

// creates fake users: random name, random email, random password
factory.define("user", User, {
  name: () => faker.person.fullName(),
  email: () => faker.internet.email(),
  password: () => faker.internet.password(),
});

/* 
Clears database
Creates test user
Creates 20 jobs
Returns the test user */
const seed_db = async () => {
  let testUser = null;
  try {
    // Use the test database
    const mongoURL = process.env.MONGO_URL_TEST;

    // Clears collections before inserting new data
    await Job.deleteMany({}); // deletes all job records
    await User.deleteMany({}); // and all the users

    // Creates one user, overrides password with known test password, so tests can log in
    testUser = await factory.create("user", { password: testUserPassword });

    // Creates 20 fake jobs, each job belongs to the test user, createdBy links them together
    await factory.createMany("job", 20, { createdBy: testUser._id }); // put 30 job entries in the database.
  } catch (e) {
    console.log("database error");
    console.log(e.message);
    throw e;
  }
  return testUser;
};

module.exports = { testUserPassword, factory, seed_db };