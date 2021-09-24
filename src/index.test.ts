const assert = require("assert");
const { AsmEnv, EnvTypes } = require("./index");

assert.ok(!process.env.hasOwnProperty("sample"));
const config = new AsmEnv("prod", 'dotenv')

config.load()

assert.ok(process.env.hasOwnProperty("sample"));
assert.equal(process.env.sample, "value1");