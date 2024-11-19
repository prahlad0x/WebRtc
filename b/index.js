const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");
const app = express();
const server = http.createServer(app);

const users = {}; // Keep track of connected users and their socket IDs

// // Serve the frontend (optional if using static files)
// app.use(express.static("public"));
app.use(cors()); // Adjust the origin to match your frontend

const io = new Server(server, {
  cors: {
    origin: "*", // Your frontend origin
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register user with their ID
  socket.on("register-user", (userId) => {
    users[userId] = socket.id;
    console.log(`User registered: ${userId} -> ${socket.id}`);
  });

  // Handle call initiation
  socket.on("start-call", ({ from, to, offer }) => {
    if (users[to]) {
      io.to(users[to]).emit("incoming-call", { from, offer });
    } else {
      io.to(users[from]).emit("call-error", { message: "User not available" });
    }
  });

  // Handle call answer
  socket.on("answer-call", ({ from, to, answer }) => {
    if (users[to]) {
      io.to(users[to]).emit("call-answered", { from, answer });
    }
  });

  // Handle ICE candidate exchange
  socket.on("ice-candidate", ({ to, candidate }) => {
    if (users[to]) {
      io.to(users[to]).emit("ice-candidate", { candidate });
    }
  });

  // Handle call end
  socket.on("end-call", ({ to }) => {
    if (users[to]) {
      io.to(users[to]).emit("call-ended");
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:6000");
});
