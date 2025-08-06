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

// Function to strip ANSI and noisy output
function cleanOutput(data) {
  return data
    .toString()
    // Remove ANSI codes and spinners
    .replace(/\x1B\[[0-9;]*[A-Za-z]/g, "")
    .replace(/⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏/g, "")
    .replace(/^ERROR:.*$/gm, "")
    .replace(/\[0m|\[39m|\[22m/g, "")
    // Normalize line breaks
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Merge single newlines into spaces
    .replace(/([^\n])\n(?!\n)/g, "$1 ")
    // Fix common English contractions
    .replace(/\b'\s+ll\b/gi, "'ll")
    .replace(/\b'\s+re\b/gi, "'re")
    .replace(/\b'\s+ve\b/gi, "'ve")
    .replace(/\b'\s+d\b/gi, "'d")
    .replace(/\b'\s+s\b/gi, "'s")
    .replace(/\b'\s+em\b/gi, "'em")
    // Collapse multiple spaces
    .replace(/\s{2,}/g, " ")
    // Keep paragraph breaks
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}





// Start Q CLI session
const qProcess = spawn("bash", ["-i", "-c", "q chat --trust-all-tools"], {
  stdio: ["pipe", "pipe", "pipe"]
});

// Stream stdout to browser
qProcess.stdout.on("data", (chunk) => {
  const cleaned = cleanOutput(chunk);
  if (cleaned) {
    io.emit("cliOutput", cleaned);
  }
});

// Ignore stderr to avoid clutter
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
