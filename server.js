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

// Remove ANSI escape sequences
function stripAnsi(str) {
  return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
}

// Extract chat lines starting with "> "
function extractChat(data) {
  const text = stripAnsi(data.toString());
  const lines = text
    .split("\n")
    .filter(line => line.trim().startsWith(">")) // only assistant replies
    .map(line => line.replace(/^>\s*/, "")); // remove "> "
  return lines.join("\n");
}

const qProcess = spawn("bash", ["-i", "-c", "q chat --trust-all-tools"], {
  stdio: ["pipe", "pipe", "pipe"]
});

qProcess.stdout.on("data", (chunk) => {
  const chat = extractChat(chunk);
  if (chat) io.emit("cliOutput", chat);
});

// Ignore stderr completely to avoid spinner/error spam
// If you want real errors, you can log them server-side instead
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
