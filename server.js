const express = require("express");
const http = require("http");
const { spawn } = require("child_process");
const socketIo = require("socket.io");
const stripAnsi = require("strip-ansi"); // npm install strip-ansi

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

// ===== Filters =====

// Remove CLI spinners + "Thinking..." lines
const stripSpinners = (str) =>
  str.replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏].*Thinking\.\.\./g, "");

// Remove ASCII art + "Did you know?" boxes
const stripBanners = (str) => {
  return str
    // Big ASCII art blocks
    .replace(/⢠⣶[\s\S]*?(?=\n\n)/g, "")
    // Did you know? box
    .replace(/╭[\s\S]*?╯/g, "")
    // Any [DONE] markers
    .replace(/\[DONE\]/g, "");
};

// Main cleanup chain
const cleanOutput = (chunk) => {
  let out = chunk.toString();
  out = stripAnsi(out);       // remove colors
  out = stripSpinners(out);   // remove thinking spinner lines
  out = stripBanners(out);    // remove ascii banners & tips
  out = out.replace(/^\s*ERROR:\s*/gm, ""); // remove repetitive ERROR:
  return out.trim();
};

// ===== Socket.IO connection =====
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("runCommand", (cmdString) => {
    console.log("Running:", cmdString);

    const [command, ...args] = cmdString.split(" ");
    const cmd = spawn(command, args, { shell: true });

    cmd.stdout.on("data", (chunk) => {
      const cleaned = cleanOutput(chunk);
      if (cleaned) socket.emit("cliOutput", cleaned);
    });

    cmd.stderr.on("data", (chunk) => {
      const cleaned = cleanOutput(chunk);
      if (cleaned) socket.emit("cliOutput", cleaned);
    });

    cmd.on("close", (code) => {
      socket.emit("cliOutput", `\n[Process exited with code ${code}]`);
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// ===== Start Server =====
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
