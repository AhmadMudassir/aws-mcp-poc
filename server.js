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

// Spawn persistent Q CLI session
const qProcess = spawn("bash", ["-i", "-c", "q chat --trust-all-tools"], {
  stdio: ["pipe", "pipe", "pipe"]
});

// Function to filter out junk and keep only assistant chat lines
function extractChatOnly(data) {
  let text = data.toString();

  // Remove ANSI escape sequences (color codes, cursor moves, etc.)
  text = text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, " ");

  // Keep only lines starting with "> " (assistant's reply)
  const matches = text.match(/(^|\n)>\s+[^\n]+/g);
  if (!matches) return "";

  // Clean each line: remove "> " prefix, collapse spaces
  return matches
    .map(line => line.replace(/^>\s+/, "").trim())
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

qProcess.stdout.on("data", (chunk) => {
  const chatText = extractChatOnly(chunk);
  if (chatText) {
    io.emit("cliOutput", chatText);
  }
});

qProcess.stderr.on("data", (chunk) => {
  // Still emit errors, but strip ANSI codes
  const err = chunk.toString().replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, " ").trim();
  if (err) io.emit("cliOutput", `ERROR: ${err}`);
});

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
