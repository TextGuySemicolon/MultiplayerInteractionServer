import { createServer } from "http"; // Import Node's HTTP module
import { Server } from "socket.io";
import { json } from "stream/consumers";

// Constants
const PORT = 3000; // Port to run the server
const CORS_OPTIONS = {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Allow specified methods
    credentials: true // Enable cookies if needed
};

// Create an HTTP server
const httpServer = createServer();

// Initialize Socket.IO server
const io = new Server(httpServer, {
    cors: CORS_OPTIONS,
});

// Store player data
let players = {};

// Event Names
const EVENTS = {
    CONNECTION: "connection",
    RESET_GAME: "resetGame",
    JOIN_GAME: "joinGame",
    PROGRESS_UPDATE: "progressUpdate",
    DISCONNECT: "disconnect",
    GAME_UPDATE: "gameUpdate",
};

// Helper to broadcast game updates
const broadcastGameUpdate = () => {
    io.emit(EVENTS.GAME_UPDATE, { players });
};

// Reset game state
const resetGame = () => {
    for (let playerId in players) {
        players[playerId].progressCount = 0;
    }
    console.log("Game reset successfully.");
    broadcastGameUpdate();
};

// Handle player joining the game
const handleJoinGame = (socket, username, role) => {
    if (role === "host") {
        // Assign as host
        host = {
            id: socket.id,
            username: String(username),
        };
        console.log(`Host assigned: ${username} (${role})`);
    } else {
        // Add to players as a regular player
        players[socket.id] = {
            username: String(username),
            progressCount: 0,
        };
        console.log(`Player joined: ${username} (${role})`);
    }
    broadcastGameUpdate();
};

// Handle button click events
const handleProgressUpdate = (socket, data) => {
    if (players[socket.id]) {
        players[socket.id].progressCount = Number(data.progress);
        console.log(`Player ${players[socket.id].username} clicked the button. Total clicks: ${players[socket.id].progressCount}`);
        broadcastGameUpdate();
    }
};

// Handle player disconnecting
const handleDisconnect = (socket) => {
    if (players[socket.id]) {
        console.log(`Player disconnected: ${players[socket.id].username}`);
        delete players[socket.id];
        broadcastGameUpdate();
    }
};

// Set up server events
io.on(EVENTS.CONNECTION, (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Register event listeners
    socket.on(EVENTS.RESET_GAME, resetGame);
    socket.on(EVENTS.JOIN_GAME, (username, role) => handleJoinGame(socket, username, role));
    socket.on(EVENTS.PROGRESS_UPDATE, (progress) => handleProgressUpdate(socket, progress));
    socket.on(EVENTS.DISCONNECT, () => handleDisconnect(socket));
});

// Start the HTTP server
httpServer.listen(PORT, () => {
    console.log(`Server started and running on http://localhost:${PORT}`);
});
