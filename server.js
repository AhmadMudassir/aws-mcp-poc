const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = 3001;

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// SSE endpoint for streaming output
app.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Change the question here or pass via query
  const question = req.query.q || "whats my bill of july";

  // Spawn Q CLI in interactive bash so AWS creds & env load
  const cmd = spawn("bash", ["-i", "-c", `q chat --no-interactive --trust-all-tools "${question}"`]);

  cmd.stdout.on("data", (chunk) => {
    res.write(`data: ${chunk.toString()}\n\n`);
  });

  cmd.stderr.on("data", (chunk) => {
    res.write(`data: ERROR: ${chunk.toString()}\n\n`);
  });

  cmd.on("close", () => {
    res.write("data: [DONE]\n\n");
    res.end();
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
