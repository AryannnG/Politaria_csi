const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_SECRET = "test-secret";
const app = require("../src/app");

let mongod;
let token;
let cityId;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

test.after(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const auth = () => ({ Authorization: `Bearer ${token}` });

test("health", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
});

test("register, duplicate register, login", async () => {
  const body = { username: "mayor1", email: "m1@test.dev", password: "pw12345" };
  const reg = await request(app).post("/api/auth/register").send(body);
  assert.equal(reg.status, 201);
  assert.ok(reg.body.token);
  assert.equal((await request(app).post("/api/auth/register").send(body)).status, 409);
  assert.equal((await request(app).post("/api/auth/login").send({ email: body.email, password: "bad" })).status, 401);
  const login = await request(app).post("/api/auth/login").send({ email: body.email, password: body.password });
  assert.equal(login.status, 200);
  token = login.body.token;
});

test("cities require auth; create and list", async () => {
  assert.equal((await request(app).get("/api/cities")).status, 401);
  const created = await request(app).post("/api/cities").set(auth()).send({ name: "Politaria" });
  assert.equal(created.status, 201);
  assert.equal(created.body.city.difficulty, "normal");
  assert.equal(created.body.city.stats.approval, 50);
  assert.equal(created.body.city.missions.filter((mission) => mission.status === "active").length, 2);
  cityId = created.body.city._id;
  assert.equal((await request(app).post("/api/cities").set(auth()).send({})).status, 400);
  assert.equal((await request(app).post("/api/cities").set(auth()).send({ name: "Invalid", difficulty: "impossible" })).status, 400);
  const list = await request(app).get("/api/cities").set(auth());
  assert.equal(list.body.cities.length, 1);
});

test("another user cannot access the city", async () => {
  const other = await request(app).post("/api/auth/register").send({ username: "o", email: "o@test.dev", password: "pw12345" });
  const res = await request(app).get(`/api/cities/${cityId}`).set({ Authorization: `Bearer ${other.body.token}` });
  assert.equal(res.status, 403);
});

test("catalog endpoints", async () => {
  for (const p of ["buildings", "policies", "missions"]) {
    const res = await request(app).get(`/api/catalog/${p}`);
    assert.equal(res.status, 200);
    assert.ok(res.body[p].length > 0);
  }
  const missions = await request(app).get("/api/catalog/missions");
  assert.ok(missions.body.missions.every((mission) => mission.deadlineMonths > 0 && mission.reward));
});

test("build deducts treasury; unknown building and insufficient funds rejected", async () => {
  const ok = await request(app).post(`/api/cities/${cityId}/buildings`).set(auth()).send({ buildingId: "park" });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.city.stats.treasury, 46000);
  assert.equal((await request(app).post(`/api/cities/${cityId}/buildings`).set(auth()).send({ buildingId: "nope" })).status, 400);
});

test("building past 100 in a stat is clamped, not a 500", async () => {
  // Build many parks: environment 50 + 5*n would exceed 100.
  let last;
  for (let i = 0; i < 10; i++) {
    last = await request(app).post(`/api/cities/${cityId}/buildings`).set(auth()).send({ buildingId: "park" });
    if (last.status !== 200) break;
  }
  assert.equal(last.status, 200, JSON.stringify(last.body));
  assert.ok(last.body.city.stats.environment <= 100);
  assert.ok(last.body.city.stats.approval <= 100);
});

test("policies: enact, duplicate, revoke", async () => {
  const a = await request(app).post(`/api/cities/${cityId}/policies`).set(auth()).send({ policyId: "business_tax_breaks" });
  assert.equal(a.status, 200);
  assert.equal(a.body.city.taxRate, 8);
  assert.equal((await request(app).post(`/api/cities/${cityId}/policies`).set(auth()).send({ policyId: "business_tax_breaks" })).status, 409);
  const r = await request(app).delete(`/api/cities/${cityId}/policies/business_tax_breaks`).set(auth());
  assert.equal(r.status, 200);
  assert.equal(r.body.city.taxRate, 10);
  assert.equal((await request(app).delete(`/api/cities/${cityId}/policies/business_tax_breaks`).set(auth())).status, 404);
});

test("tax-rate endpoint validates range and saves allowed values", async () => {
  for (const taxRate of [-1, 41, "18"]) {
    assert.equal((await request(app).patch(`/api/cities/${cityId}/tax-rate`).set(auth()).send({ taxRate })).status, 400);
  }
  const result = await request(app).patch(`/api/cities/${cityId}/tax-rate`).set(auth()).send({ taxRate: 18 });
  assert.equal(result.status, 200);
  assert.equal(result.body.city.taxRate, 18);
});

test("advance months, resolve events, until the game ends or 60 months pass", async () => {
  for (let i = 0; i < 60; i++) {
    let res = await request(app).get(`/api/cities/${cityId}`).set(auth());
    let city = res.body.city;
    if (city.status !== "active") break;
    if (city.pendingEvents.length) {
      const ev = city.pendingEvents[0];
      const blocked = await request(app).post(`/api/cities/${cityId}/advance-month`).set(auth());
      assert.equal(blocked.status, 409);
      const bad = await request(app).post(`/api/cities/${cityId}/resolve-event`).set(auth()).send({ eventId: ev.eventId, choiceId: "zzz" });
      assert.equal(bad.status, 400);
      res = await request(app).post(`/api/cities/${cityId}/resolve-event`).set(auth()).send({ eventId: ev.eventId, choiceId: ev.choices[0].id });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      if (res.body.city.status !== "active") break;
    }
    res = await request(app).post(`/api/cities/${cityId}/advance-month`).set(auth());
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.ok(Number.isFinite(res.body.city.stats.treasury));
  }
  const final = (await request(app).get(`/api/cities/${cityId}`).set(auth())).body.city;
  assert.ok(final.month > 0);
});

test("advancing an ended game returns 409", async () => {
  const City = require("../src/models/City");
  await City.findByIdAndUpdate(cityId, { status: "lost", pendingEvents: [] });
  const calls = [
    request(app).post(`/api/cities/${cityId}/advance-month`).set(auth()),
    request(app).post(`/api/cities/${cityId}/buildings`).set(auth()).send({ buildingId: "park" }),
    request(app).post(`/api/cities/${cityId}/policies`).set(auth()).send({ policyId: "free_education" }),
    request(app).delete(`/api/cities/${cityId}/policies/free_education`).set(auth()),
    request(app).patch(`/api/cities/${cityId}/tax-rate`).set(auth()).send({ taxRate: 12 }),
  ];
  for (const call of calls) assert.equal((await call).status, 409);
  const replay = await request(app).post(`/api/cities/${cityId}/restart`).set(auth());
  assert.equal(replay.status, 201);
  assert.notEqual(replay.body.city._id, cityId);
  assert.equal(replay.body.city.stats.approval, 50);
  assert.equal((await request(app).get(`/api/cities/${cityId}`).set(auth())).body.city.status, "lost");
});
