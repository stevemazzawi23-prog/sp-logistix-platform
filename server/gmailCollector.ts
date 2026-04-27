/**
 * Gmail Collector - SP Logistix
 * Collecte automatique des bordereaux de livraison depuis logistixsp@gmail.com
 * Sujet des emails : "Rapport de livraison"
 */

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { getAllClients, createDeliveryTicket, getTicketsByClientId } from "./db";

const GMAIL_USER = "logistixsp@gmail.com";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";
const SUBJECT_FILTER = "Rapport de livraison";

export interface ParsedTicket {
  clientCode: string;
  ticketNumber: string;
  locationCode?: string;
  volumeTotalDef?: string;
  volumeTotal: string;
  pieces?: number;
  duration?: string;
  deliveryDate: Date;
  emailSubject: string;
  emailReceivedAt: Date;
}

/**
 * Extrait les données d'un email de rapport de livraison
 * Format attendu dans le corps de l'email :
 *   Client: CODE_CLIENT
 *   Numéro de billet: XXXXX
 *   Date de livraison: YYYY-MM-DD
 *   Unités remplies: XX
 *   Litrage: XXXX.XX
 *   Code de localisation: XXXX (optionnel)
 *   Durée: HH:MM (optionnel)
 */
export function parseEmailBody(body: string, subject: string, receivedAt: Date): ParsedTicket | null {
  try {
    const lines = body.replace(/\r\n/g, "\n").split("\n");
    const data: Record<string, string> = {};

    for (const line of lines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const key = line.substring(0, colonIdx).trim().toLowerCase()
        .replace(/é/g, "e").replace(/è/g, "e").replace(/ê/g, "e")
        .replace(/à/g, "a").replace(/â/g, "a")
        .replace(/î/g, "i").replace(/ô/g, "o").replace(/û/g, "u")
        .replace(/\s+/g, "_");
      const value = line.substring(colonIdx + 1).trim();
      if (value) data[key] = value;
    }

    // Chercher les champs clés avec plusieurs variantes possibles
    const clientCode =
      data["client"] ||
      data["code_client"] ||
      data["client_code"] ||
      data["numero_client"] ||
      extractPattern(body, /client\s*[:#]\s*([A-Z0-9\-_]+)/i);

    const ticketNumber =
      data["numero_de_billet"] ||
      data["numero_billet"] ||
      data["billet"] ||
      data["ticket"] ||
      data["no_billet"] ||
      extractPattern(body, /(?:billet|ticket|no\.?)\s*[:#]\s*([A-Z0-9\-_]+)/i);

    const deliveryDateStr =
      data["date_de_livraison"] ||
      data["date_livraison"] ||
      data["date"] ||
      extractPattern(body, /date[^:]*:\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/i);

    const volumeStr =
      data["litrage"] ||
      data["volume"] ||
      data["volume_total"] ||
      data["litres"] ||
      data["litre"] ||
      extractPattern(body, /(?:litrage|volume|litres?)\s*[:#]\s*([\d.,]+)/i);

    const unitsStr =
      data["unites_remplies"] ||
      data["unites"] ||
      data["pieces"] ||
      data["unite"] ||
      data["nb_unites"] ||
      extractPattern(body, /(?:unit[eé]s?(?:\s+remplies?)?|pi[eè]ces?)\s*[:#]\s*(\d+)/i);

    const locationCode =
      data["code_de_localisation"] ||
      data["localisation"] ||
      data["location"] ||
      data["site"] ||
      extractPattern(body, /(?:localisation|location|site|code_loc)\s*[:#]\s*([A-Z0-9\-_]+)/i);

    const duration =
      data["duree"] ||
      data["duration"] ||
      extractPattern(body, /dur[eé]e\s*[:#]\s*([\d:hHmM]+)/i);

    const volumeTotalDef =
      data["volume_def"] ||
      data["volume_total_def"] ||
      data["def"] ||
      extractPattern(body, /(?:volume_def|def)\s*[:#]\s*([\d.,]+)/i);

    if (!clientCode || !ticketNumber || !volumeStr) {
      console.warn("[GmailCollector] Champs manquants dans l'email:", { clientCode, ticketNumber, volumeStr });
      return null;
    }

    // Parser la date
    let deliveryDate = receivedAt;
    if (deliveryDateStr) {
      const parsed = new Date(deliveryDateStr.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1").replace(/(\d{2})-(\d{2})-(\d{4})/, "$3-$2-$1"));
      if (!isNaN(parsed.getTime())) {
        deliveryDate = parsed;
      }
    }

    // Nettoyer le volume (remplacer virgule par point)
    const volumeTotal = volumeStr.replace(",", ".");
    const pieces = unitsStr ? parseInt(unitsStr, 10) : undefined;

    return {
      clientCode: clientCode.trim().toUpperCase(),
      ticketNumber: ticketNumber.trim(),
      locationCode: locationCode?.trim(),
      volumeTotalDef: volumeTotalDef?.replace(",", "."),
      volumeTotal,
      pieces: isNaN(pieces as number) ? undefined : pieces,
      duration: duration?.trim(),
      deliveryDate,
      emailSubject: subject,
      emailReceivedAt: receivedAt,
    };
  } catch (err) {
    console.error("[GmailCollector] Erreur parsing email:", err);
    return null;
  }
}

function extractPattern(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern);
  return match?.[1]?.trim();
}

/**
 * Collecte les emails non lus avec le sujet "Rapport de livraison"
 * et les importe dans la base de données
 */
export async function collectGmailTickets(): Promise<{ imported: number; skipped: number; errors: number }> {
  const stats = { imported: 0, skipped: 0, errors: 0 };

  if (!GMAIL_APP_PASSWORD) {
    console.error("[GmailCollector] GMAIL_APP_PASSWORD non configuré");
    return stats;
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
    logger: false,
  });

  try {
    await client.connect();
    console.log("[GmailCollector] Connecté à Gmail IMAP");

    // Charger tous les clients existants
    const allClients = await getAllClients();

    await client.mailboxOpen("INBOX");

    // Chercher tous les emails avec le sujet "Rapport de livraison" (lus et non lus)
    const searchResult = await client.search({
      subject: SUBJECT_FILTER,
    });
    const messages: number[] = Array.isArray(searchResult) ? searchResult : [];

    console.log(`[GmailCollector] ${messages.length} email(s) trouvé(s) avec sujet "${SUBJECT_FILTER}"`);

    for (const uid of messages) {
      try {
        const message = await client.fetchOne(String(uid), {
          source: true,
          envelope: true,
        });

        if (!message || !message.source) continue;
        const source = message.source as Buffer;

        const parsed = await simpleParser(source);
        const subject = parsed.subject || "";
        const receivedAt = parsed.date || new Date();
        const htmlText = typeof parsed.html === "string" ? parsed.html.replace(/<[^>]+>/g, "\n") : "";
        const bodyText = parsed.text || htmlText || "";

        const ticket = parseEmailBody(bodyText, subject, receivedAt);

        if (!ticket) {
          console.warn(`[GmailCollector] Email ignoré (parsing échoué): ${subject}`);
          stats.skipped++;
          continue;
        }

        // Trouver le client par code
        const matchedClient = allClients.find(
          c => c.code.toUpperCase() === ticket.clientCode.toUpperCase()
        );

        if (!matchedClient) {
          console.warn(`[GmailCollector] Client non trouvé: ${ticket.clientCode}`);
          stats.skipped++;
          continue;
        }

        // Vérifier si le billet existe déjà (éviter les doublons)
        const existingTickets = await getTicketsByClientId(matchedClient.id);
        const alreadyExists = existingTickets.some(
          t => t.ticketNumber === ticket.ticketNumber
        );

        if (alreadyExists) {
          console.log(`[GmailCollector] Billet ${ticket.ticketNumber} déjà importé, ignoré`);
          stats.skipped++;
          continue;
        }

        // Créer le billet
        await createDeliveryTicket({
          clientId: matchedClient.id,
          ticketNumber: ticket.ticketNumber,
          locationCode: ticket.locationCode,
          volumeTotalDef: ticket.volumeTotalDef,
          volumeTotal: ticket.volumeTotal,
          pieces: ticket.pieces,
          duration: ticket.duration,
          deliveryDate: ticket.deliveryDate,
          emailSubject: ticket.emailSubject,
          emailReceivedAt: ticket.emailReceivedAt,
        });

        console.log(`[GmailCollector] ✅ Billet importé: ${ticket.ticketNumber} pour ${matchedClient.name}`);
        stats.imported++;
      } catch (msgErr) {
        console.error(`[GmailCollector] Erreur traitement message ${uid}:`, msgErr);
        stats.errors++;
      }
    }

    await client.logout();
    console.log(`[GmailCollector] Terminé — Importés: ${stats.imported}, Ignorés: ${stats.skipped}, Erreurs: ${stats.errors}`);
  } catch (err) {
    console.error("[GmailCollector] Erreur connexion IMAP:", err);
    stats.errors++;
    try { await client.logout(); } catch {}
  }

  return stats;
}
