const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const { spawn } = require("child_process");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 3001;

// --- CLEAN FUNCTION ---
function cleanOutput(data) {
  let text = data.toString();

  // Remove ANSI escape codes
  text = text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");

  // Remove spinner frames
  text = text.replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g, "");

  // Remove "Thinking..." and noisy banners
  text = text.replace(/ERROR:.*|Thinking\.\.\.|All tools are now trusted.*|🤖.*$/gm, "");

  // Remove extra empty lines
  text = text.split("\n").filter(line => line.trim() !== "").join("\n");

  return text.trim();
}

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Persistent Q CLI process
const qProcess = spawn("bash", ["-i", "-c", "q chat --trust-all-tools"], {
  stdio: ["pipe", "pipe", "pipe"]
});

qProcess.stdout.on("data", (chunk) => {
  const cleaned = cleanOutput(chunk);
  if (cleaned) io.emit("cliOutput", cleaned);
});

qProcess.stderr.on("data", (chunk) => {
  const cleaned = cleanOutput(chunk);
  if (cleaned) io.emit("cliOutput", cleaned);
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
