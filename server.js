const express = require("express");
const { spawn } = require("child_process");
const cors = require("cors");
require("dotenv").config()
const app = express();
app.use(cors());
app.use(express.json());

// Helper: filter out CLI noise
function cleanOutput(raw) {
  return raw
    .split("\n")
    .filter(line => {
      return !(
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
      );
    })
    .join("\n")
    .trim();
}

app.post("/query", (req, res) => {
  const question = req.body.question;
  let output = "";

  const cmd = spawn(
    "bash",
    ["-i", "-c", `q chat --no-interactive --trust-all-tools "${question}"`],
    {
        env: process.env
    });

  cmd.stdout.on("data", (data) => {
    output += data.toString();
  });

  cmd.stderr.on("data", (data) => {
    console.error("Error:", data.toString());
  });

  cmd.on("close", () => {
    const cleaned = cleanOutput(output);
    res.json({ result: cleaned });
  });
});

app.listen(3001, () => console.log("Backend running on port 3001"));
