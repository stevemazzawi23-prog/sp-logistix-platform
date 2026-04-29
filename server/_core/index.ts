import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // API HTTP classique pour l'importation des billets depuis l'APK
  app.post('/api/import-ticket', async (req, res) => {
    try {
      const { apiToken, clientCode, ticketNumber, deliveryDate, volumeTotal, pieces, locationCode, duration } = req.body;
      
      // Valider le token
      const validToken = process.env.APK_SYNC_TOKEN || 'default-token-change-me';
      if (apiToken !== validToken) {
        return res.status(401).json({ error: 'Token API invalide' });
      }

      // Importer le billet via tRPC
      const { getAllClients, getTicketsByClientId, createDeliveryTicket } = await import('../db');
      const allClients = await getAllClients();
      const client = allClients.find(c => c.code.toUpperCase() === clientCode.toUpperCase());
      
      if (!client) {
        return res.status(404).json({ error: `Client ${clientCode} non trouvé` });
      }

      const existingTickets = await getTicketsByClientId(client.id);
      if (existingTickets.some(t => t.ticketNumber === ticketNumber)) {
        return res.status(409).json({ error: `Billet ${ticketNumber} déjà importé` });
      }

      let deliveryDateObj = new Date(deliveryDate);
      if (isNaN(deliveryDateObj.getTime())) {
        deliveryDateObj = new Date();
      }

      await createDeliveryTicket({
        clientId: client.id,
        ticketNumber,
        locationCode,
        volumeTotal: String(volumeTotal),
        pieces,
        duration,
        deliveryDate: deliveryDateObj,
        emailSubject: 'Importé depuis APK',
        emailReceivedAt: new Date(),
      });

      res.json({ success: true, message: `Billet ${ticketNumber} importé pour ${client.name}` });
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
