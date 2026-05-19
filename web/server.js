const express = require("express");
const { createClient } = require("redis");

const app = express();

let pool;
let redisClient;
let PORT = process.env.PORT || 3000;
async function init() {

  // Redis 클라이언트
  redisClient = createClient({ url: "redis://redis:6379/0" });
  redisClient.on("error", (err) => console.error("Redis error:", err));
  await redisClient.connect();

  app.get("/", (req, res) => {
    res.send("hello");
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/redis-set", async (req, res) => {
    try {
      const key = req.query.key || "color";
      const value = req.query.value || "blue";
      await redisClient.set(key, value);
      res.send(`Redis SET OK. ${key}=${value}`);
    } catch (e) {
      console.error(e);
      res.status(500).send(`Redis SET failed: ${e.message}`);
    }
  });

  app.get("/redis-get", async (req, res) => {
    try {
      const key = req.query.key || "color";
      const value = await redisClient.get(key);
      res.send(`Redis GET OK. ${key}=${value}`);
    } catch (e) {
      console.error(e);
      res.status(500).send(`Redis GET failed: ${e.message}`);
    }
  });

  app.get("/redis-incr", async (req, res) => {
    try {
      const key = req.query.key || "visits";
      const val = await redisClient.incr(key);
      res.send(`Redis INCR OK. ${key}=${val}`);
    } catch (e) {
      console.error(e);
      res.status(500).send(`Redis INCR failed: ${e.message}`);
    }
  });

  app.listen(Number(PORT), () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

init().catch((e) => {
  console.error("Fatal init error:", e);
  process.exit(1);
});