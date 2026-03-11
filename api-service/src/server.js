const express = require("express");
const mongoose = require("mongoose");
const client = require("prom-client");

const app = express();
const port = process.env.API_PORT || 3000;
const mongoUri =
  process.env.MONGO_URI || "mongodb://mongo:27017/cloud_monitoring";

app.use(express.json());

// Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestCounter = new client.Counter({
  name: "api_http_requests_total",
  help: "Total number of HTTP requests handled by the API",
  labelNames: ["method", "route", "status_code"],
});

app.use((req, res, next) => {
  const startHrTime = process.hrtime();

  res.on("finish", () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    httpRequestCounter
      .labels(req.method, req.path, String(res.statusCode))
      .inc();
    // Additional histograms could be added here if needed
  });

  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "api-service" });
});

app.get("/api/status", async (req, res) => {
  const mongoState = mongoose.connection.readyState;

  res.json({
    status: "ok",
    service: "api-service",
    mongo: mongoState === 1 ? "connected" : "disconnected",
  });
});

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

async function start() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }

  app.listen(port, () => {
    console.log(`API service listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start API service", err);
  process.exit(1);
});

