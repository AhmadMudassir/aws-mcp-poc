const express = require("express");
const { spawn } = require("child_process");
const cors = require("cors");
const stripAnsi = require("strip-ansi");
const app = express();

app.use(cors());
app.use(express.json());

// SSE streaming endpoint
app.get("/stream", (req, res) => {
  const question = req.query.q;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  // Spawn the Q CLI process (interactive shell)
  const cmd = spawn("bash", ["-i", "-c", `q chat --no-interactive --trust-all-tools "${question}"`], {
    env: process.env
  });

  cmd.stdout.on("data", (chunk) => {
    const clean = stripAnsi(chunk.toString());
    // Send the raw chunk so newlines are preserved
    res.write(`data: ${JSON.stringify(clean)}\n\n`);
  });

  cmd.stderr.on("data", (err) => {
    const cleanErr = stripAnsi(err.toString());
    res.write(`data: ${JSON.stringify("ERROR: " + cleanErr)}\n\n`);
  });

  cmd.on("close", () => {
    res.write(`data: "[DONE]"\n\n`);
    res.end();
  });
});

app.listen(3001, () => console.log("Backend running on port 3001"));
