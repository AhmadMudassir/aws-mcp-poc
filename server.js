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

// --- Clean up Q CLI output ---
function cleanOutput(data) {
  return data
    .toString()
    .replace(/\x1B\[[0-9;]*[A-Za-z]/g, "") // Remove ANSI codes
    .replace(/⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏/g, "") // Remove spinners
    .replace(/^ERROR:.*$/gm, "") // Remove error lines
    .replace(/\[0m|\[39m|\[22m/g, "") // Remove ANSI leftovers
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/([^\n])\n(?!\n)/g, "$1 ") // Merge single newlines into spaces
    .replace(/\b'\s+ll\b/g, "'ll") // Fix I'll contractions
    .replace(/\s{2,}/g, " ") // Collapse extra spaces
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Start Q CLI process
const qProcess = spawn("bash", ["-i", "-c", "q chat --trust-all-tools"], {
  stdio: ["pipe", "pipe", "pipe"]
});

let buffer = "";
let bufferTimer;

// Handle stdout
qProcess.stdout.on("data", (chunk) => {
  buffer += chunk.toString();

  // Reset timer each time new chunk arrives
  clearTimeout(bufferTimer);
  bufferTimer = setTimeout(() => {
    const cleaned = cleanOutput(buffer);
    if (cleaned) io.emit("cliOutput", cleaned);
    buffer = "";
  }, 500); // Wait 0.5s after last chunk before sending
});

// Ignore stderr spam
qProcess.stderr.on("data", () => {});

// Handle process close
qProcess.on("close", () => {
  io.emit("cliOutput", "\n[Q CLI session ended]");
});

// Handle socket events
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
