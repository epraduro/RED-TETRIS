const http = require('http');
const WebSocket = require('ws');
const express = require('express');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

//app.use(express.static('public')); //Pour servir les fichiers static du front depuis le back.

wss.on('connection', (ws) => {
    console.log('New Client connected!');

    ws.on('message', (data, isBinary) => {
        console.log('Message received :', data.toString());
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data, { binary: isBinary });
            }
        });
    });

    ws.on('error', console.error);

    ws.on('close', () => {
        console.log('Client disconnected!');
    });

    ws.send('Welcome!');
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server start on http://localhost:${PORT}`);
});