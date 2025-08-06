const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const { spawn } = require("child_process");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 3001;

app.use(express.static(path.join(__dirname, "public")));

// 🆕 Improved cleaner
function cleanOutput(data) {
  // Step 1 — remove junk
  let text = data
    .toString()
    .replace(/\x1B\[[0-9;]*[A-Za-z]/g, "") // Remove ANSI codes
    .replace(/⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏/g, "") // Remove spinners
    .replace(/^ERROR:.*$/gm, "") // Remove error lines
    .replace(/\[0m|\[39m|\[22m/g, "") // Remove leftover resets
    .replace(/\r\n/g, "\n") // Normalize Windows newlines
    .replace(/\r/g, "\n") // Normalize carriage returns
    .replace(/\n+/g, " ") // Collapse newlines into spaces
    .trim();

  // Step 2 — split into tokens (words, punctuation, symbols)
  let tokens = text.match(/[\w$%]+|[.,:;()'"-]/g) || [];

  // Step 3 — rebuild clean string
  let result = "";
  tokens.forEach((tok, i) => {
    if (i === 0) {
      result += tok;
    } else if (/^[.,:;)]$/.test(tok)) {
      // punctuation: no space before
      result += tok;
    } else if (tok === "'") {
      // apostrophe in contractions: no space before or after
      result += tok;
    } else {
      result += " " + tok;
    }
  });

  return result.replace(/\s{2,}/g, " ").trim();
}

const qProcess = spawn("bash", ["-i", "-c", "q chat --trust-all-tools"], {
  stdio: ["pipe", "pipe", "pipe"]
});

qProcess.stdout.on("data", (chunk) => {
  const cleaned = cleanOutput(chunk);
  if (cleaned) io.emit("cliOutput", cleaned);
});

// Ignore stderr completely (prevents spinner/error spam)
qProcess.stderr.on("data", () => {});

qProcess.on("close", () => {
  io.emit("cliOutput", "\n[Q CLI session ended]");
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected");
  socket.on("askQuestion", (question) => {
    qProcess.stdin.write(`${question}\n`);
  });
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
