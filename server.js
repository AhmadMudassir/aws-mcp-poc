const express = require("express");
const { spawn } = require("child_process");
const cors = require("cors");
const readline = require("readline");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/query", (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");

  const question = req.body.question;

  const cmd = spawn("bash", [
    "-i",
    "-c",
    `q chat --no-color --no-interactive --trust-all-tools "${question}"`
  ], { env: process.env });

  const rl = readline.createInterface({ input: cmd.stdout });

  rl.on("line", (line) => {
    // Filter noisy lines in real-time
    if (
      line.trim() === "" ||
      line.includes("/help") ||
      line.includes("Did you know?") ||
      line.includes("All tools are now trusted") ||
      line.startsWith("🛠️") ||
      line.startsWith("⋮") ||
      line.startsWith("●") ||
      line.startsWith("╭") ||
      line.startsWith("╰") ||
      line.startsWith("│") ||
      line.startsWith("⢠") ||
      line.startsWith("⣿") ||
      line.startsWith("━━━━━━━━")
    ) {
      return; // skip noise
    }

    // Stream clean output to the client
    res.write(line + "\n");
  });

  cmd.stderr.on("data", (data) => {
    console.error("Error:", data.toString());
  });

  cmd.on("close", () => {
    res.end();
  });
});

app.listen(3001, () => console.log("Backend running on port 3001"));
