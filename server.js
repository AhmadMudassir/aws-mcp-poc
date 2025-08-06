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
    .replace(/\x1B\[[0-9;]*[A-Za-z]/g, "")        // Remove ANSI codes
    .replace(/⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏/g, "") // Remove spinners
    .replace(/^ERROR:.*$/gm, "")                  // Remove error lines
    .replace(/\[0m|\[39m|\[22m/g, "")             // Remove ANSI reset leftovers
    .replace(/\r\n/g, "\n")                       // Normalize Windows newlines
    .replace(/\r/g, "\n")                         // Normalize carriage returns
    .replace(/([^\n])\n(?!\n)/g, "$1 ")           // Merge single newlines into spaces
    .replace(/\n{3,}/g, "\n\n")                   // Keep big paragraph breaks
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
