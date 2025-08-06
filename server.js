const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3001;

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("🔌 Client connected");

  socket.on("askQuestion", (question) => {
    console.log(`📩 Question: ${question}`);

    const cmd = spawn("bash", ["-i", "-c", `q chat --no-interactive --trust-all-tools "${question}"`]);

    cmd.stdout.on("data", (chunk) => {
      socket.emit("cliOutput", chunk.toString());
    });

    cmd.stderr.on("data", (chunk) => {
      socket.emit("cliOutput", `ERROR: ${chunk.toString()}`);
    });

    cmd.on("close", () => {
      socket.emit("cliOutput", "[DONE]");
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
