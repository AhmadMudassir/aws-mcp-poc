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

// Function to strip ANSI escape sequences and clean output
function cleanOutput(data) {
  return data
    .toString()
    .replace(/\x1B\[[0-9;]*[A-Za-z]/g, "") // strip ANSI codes
    .replace(/⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏/g, "") // spinner symbols
    .replace(/^ERROR:.*$/gm, "") // remove lines starting with ERROR:
    .replace(/\[0m|\[39m|\[22m/g, "") // leftover ANSI resets
    .replace(/\n{3,}/g, "\n\n") // collapse extra newlines
    .trim();
}

// Start Q CLI process
const qProcess = spawn("bash", ["-i", "-c", "q chat --trust-all-tools"], {
  stdio: ["pipe", "pipe", "pipe"]
});

let buffer = "";

// Capture stdout
qProcess.stdout.on("data", (chunk) => {
  buffer += chunk.toString();

  // Emit when Q finishes thinking (simple signal)
  if (buffer.includes("> ") && buffer.includes("🤖 You are chatting with")) {
    const cleaned = cleanOutput(buffer);
    if (cleaned) io.emit("cliOutput", cleaned);
    buffer = ""; // reset buffer
  }
});

// Optional: ignore stderr to suppress error/noise
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
