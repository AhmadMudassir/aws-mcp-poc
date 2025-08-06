const express = require("express");
const { spawn } = require("child_process");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

function cleanOutput(raw) {
  return raw
    .split("\n")
    .filter(line => line.trim() !== "")
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
      env: process.env // inherits EC2's metadata credentials
    }
  );

  cmd.stdout.on("data", (data) => {
    output += data.toString();
  });

  cmd.stderr.on("data", (data) => {
    console.error("Error:", data.toString());
  });

  cmd.on("close", () => {
    res.json({ result: cleanOutput(output) });
  });
});

app.listen(3001, () => console.log("Backend running on port 3001"));
