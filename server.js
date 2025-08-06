const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3001;

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// Spawn Q CLI in interactive mode (persistent session)
const qProcess = spawn("bash", ["-i", "-c", "q chat --trust-all-tools"], {
  stdio: ["pipe", "pipe", "pipe"]
});

// Handle Q CLI stdout
qProcess.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  io.emit("cliOutput", text);
});

// Handle Q CLI stderr
qProcess.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  io.emit("cliOutput", `ERROR: ${text}`);
});

qProcess.on("close", () => {
  io.emit("cliOutput", "[CLI SESSION ENDED]");
});

io.on("connection", (socket) => {
  console.log("✅ Client connected");

  socket.on("askQuestion", (question) => {
    qProcess.stdin.write(`${question}\n`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
