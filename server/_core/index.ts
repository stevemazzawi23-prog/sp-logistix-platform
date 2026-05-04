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
      const {
        apiToken,
        clientCode,
        ticketNumber,
        deliveryDate,
        volumeTotal,
        pieces,
        locationCode,
        duration,
        startTime,
        endTime,
        driverName,
        siteName,
        units, // tableau [{unitName, liters}]
      } = req.body;
      
      // Valider le token
      const validToken = process.env.APK_SYNC_TOKEN || 'default-token-change-me';
      if (apiToken !== validToken) {
        return res.status(401).json({ error: 'Token API invalide' });
      }

      const { getAllClients, getTicketsByClientId, createDeliveryTicket, createDeliveryUnits } = await import('../db');
      const allClients = await getAllClients();
      const client = allClients.find((c: any) => c.code.toUpperCase() === clientCode.toUpperCase());
      
      if (!client) {
        return res.status(404).json({ error: `Client ${clientCode} non trouve` });
      }

      const existingTickets = await getTicketsByClientId(client.id);
      if (existingTickets.some((t: any) => t.ticketNumber === ticketNumber)) {
        return res.status(409).json({ error: `Billet ${ticketNumber} deja importe` });
      }

      let deliveryDateObj = new Date(deliveryDate || Date.now());
      if (isNaN(deliveryDateObj.getTime())) deliveryDateObj = new Date();

      let startTimeObj = startTime ? new Date(Number(startTime)) : null;
      let endTimeObj = endTime ? new Date(Number(endTime)) : null;
      if (startTimeObj && isNaN(startTimeObj.getTime())) startTimeObj = null;
      if (endTimeObj && isNaN(endTimeObj.getTime())) endTimeObj = null;

      const ticketId = await createDeliveryTicket({
        clientId: client.id,
        ticketNumber,
        locationCode: locationCode || siteName || '',
        volumeTotal: String(volumeTotal),
        pieces: pieces || (Array.isArray(units) ? units.length : 1),
        duration,
        deliveryDate: deliveryDateObj,
        startTime: startTimeObj,
        endTime: endTimeObj,
        driverName: driverName || null,
        siteName: siteName || null,
        source: 'apk',
        emailSubject: 'Importe depuis APK',
        emailReceivedAt: new Date(),
      });

      // Sauvegarder les unités détaillées
      if (Array.isArray(units) && units.length > 0) {
        const unitRecords = units.map((u: any) => ({
          ticketId,
          unitName: String(u.unitName || u.name || 'Unité'),
          liters: String(u.liters || u.volume || 0),
        }));
        await createDeliveryUnits(unitRecords);
      }

      res.json({ success: true, message: `Billet ${ticketNumber} importe pour ${client.name}`, ticketId });
    } catch (error) {
      console.error('Erreur lors de l importation:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Endpoint public pour récupérer les sites de livraison d'un client (APK)
  app.get('/api/sites/:clientCode', async (req, res) => {
    try {
      const apiToken = req.headers['x-api-token'] || req.query.token;
      const validToken = process.env.APK_SYNC_TOKEN || 'default-token-change-me';
      if (apiToken !== validToken) {
        return res.status(401).json({ error: 'Token API invalide' });
      }
      const { getSitesByClientCode } = await import('../db');
      const result = await getSitesByClientCode(req.params.clientCode);
      if (!result) {
        return res.status(404).json({ error: `Client ${req.params.clientCode} non trouvé` });
      }
      res.json({ success: true, clientName: result.client.name, sites: result.sites });
    } catch (error) {
      console.error('Erreur /api/sites:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Endpoint public pour ajouter un site depuis l'APK
  app.post('/api/sites/:clientCode', async (req, res) => {
    try {
      const apiToken = req.headers['x-api-token'] || req.body.apiToken;
      const validToken = process.env.APK_SYNC_TOKEN || 'default-token-change-me';
      if (apiToken !== validToken) {
        return res.status(401).json({ error: 'Token API invalide' });
      }
      const { name, address, city, province, postalCode, notes } = req.body;
      if (!name) return res.status(400).json({ error: 'Le nom du site est requis' });
      const { getSitesByClientCode, createDeliverySite } = await import('../db');
      const result = await getSitesByClientCode(req.params.clientCode);
      if (!result) {
        return res.status(404).json({ error: `Client ${req.params.clientCode} non trouvé` });
      }
      const id = await createDeliverySite({
        clientId: result.client.id,
        name, address, city, province, postalCode, notes, isActive: 1
      });
      res.json({ success: true, id, message: `Site "${name}" ajouté` });
    } catch (error) {
      console.error('Erreur POST /api/sites:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Endpoint public pour récupérer les unités d'un client (APK)
  app.get('/api/units/:clientCode', async (req, res) => {
    try {
      const apiToken = req.headers['x-api-token'] || req.query.token;
      const validToken = process.env.APK_SYNC_TOKEN || 'default-token-change-me';
      if (apiToken !== validToken) {
        return res.status(401).json({ error: 'Token API invalide' });
      }
      const { getClientUnitsByClientCode } = await import('../db');
      const result = await getClientUnitsByClientCode(req.params.clientCode);
      if (!result) {
        return res.status(404).json({ error: `Client ${req.params.clientCode} non trouvé` });
      }
      res.json({ success: true, clientName: result.client.name, units: result.units });
    } catch (error) {
      console.error('Erreur /api/units:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Endpoint public pour ajouter une unité depuis l'APK
  app.post('/api/units/:clientCode', async (req, res) => {
    try {
      const apiToken = req.headers['x-api-token'] || req.body.apiToken;
      const validToken = process.env.APK_SYNC_TOKEN || 'default-token-change-me';
      if (apiToken !== validToken) {
        return res.status(401).json({ error: 'Token API invalide' });
      }
      const { unitName, description, sortOrder } = req.body;
      if (!unitName) return res.status(400).json({ error: 'Le nom de l\'unité est requis' });
      const { getClientUnitsByClientCode, createClientUnit } = await import('../db');
      const result = await getClientUnitsByClientCode(req.params.clientCode);
      if (!result) {
        return res.status(404).json({ error: `Client ${req.params.clientCode} non trouvé` });
      }
      const id = await createClientUnit({
        clientId: result.client.id,
        unitName, description, sortOrder: sortOrder || 0, isActive: 1
      });
      res.json({ success: true, id, message: `Unité "${unitName}" ajoutée` });
    } catch (error) {
      console.error('Erreur POST /api/units:', error);
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
