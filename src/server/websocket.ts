import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import url from "url";

// Create a raw HTTP server to handle both upgrades and simple POST requests
const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/broadcast') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { streamerId, message } = data;

                if (!streamerId || !message) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing streamerId or message' }));
                    return;
                }

                broadcastToStreamer(streamerId, message);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
        });
    } else {
        // Health check
        res.writeHead(200);
        res.end('Kubi WebSocket Server Running');
    }
});

const wss = new WebSocketServer({ noServer: true });

// Map streamerId -> Set<WebSocket> using a simple object or Map
const clients = new Map<string, Set<WebSocket>>();

server.on("upgrade", (request, socket, head) => {
    const parsedUrl = url.parse(request.url || "", true);
    const pathname = parsedUrl.pathname;

    // Expected path: /ws/:streamerId
    const match = pathname?.match(/^\/ws\/([a-zA-Z0-9_-]+)$/);

    if (match) {
        const streamerId = match[1];

        wss.handleUpgrade(request, socket, head, (ws) => {
            // Add client to the map
            if (!clients.has(streamerId)) {
                clients.set(streamerId, new Set());
            }
            clients.get(streamerId)?.add(ws);

            console.log(`Client connected to streamer: ${streamerId}`);

            ws.on("close", () => {
                clients.get(streamerId)?.delete(ws);
                console.log(`Client disconnected from streamer: ${streamerId}`);
                if (clients.get(streamerId)?.size === 0) {
                    clients.delete(streamerId);
                }
            });
        });
    } else {
        socket.destroy();
    }
});

function broadcastToStreamer(streamerId: string, data: any) {
    const streamerClients = clients.get(streamerId);
    if (streamerClients) {
        const msg = JSON.stringify(data);
        streamerClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        });
        console.log(`Broadcasted to ${streamerClients.size} clients for streamer ${streamerId}`);
    } else {
        console.log(`No active clients for streamer ${streamerId}`);
    }
}

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`WebSocket server listening on port ${PORT}`);
});
