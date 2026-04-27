/**
 * Gmail Collector - SP Logistix
 * Collecte automatique des bordereaux de livraison depuis logistixsp@gmail.com
 * Sujet des emails : "Rapport de livraison"
 * 
 * Stratégies de correspondance (par ordre de priorité):
 * 1. Code client exact
 * 2. Nom client exact
 * 3. Alias (liste séparée par virgules)
 * 4. Email de l'expéditeur
 * 5. Similarité du nom (fuzzy match avec seuil 0.7)
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
 * Calcule la similarité entre deux chaînes (Levenshtein distance)
 * Retourne un score entre 0 et 1 (1 = identique)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.includes(shorter)) return 0.9;
  
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - (costs[s2.length] || 0) / maxLen;
}

/**
 * Trouve le meilleur client correspondant avec plusieurs stratégies
 * 1. Code exact
 * 2. Nom exact
 * 3. Alias (liste séparée par virgules)
 * 4. Email de l'expéditeur
 * 5. Similarité du nom (fuzzy match)
 */
function findBestMatchingClient(
  ticket: ParsedTicket,
  allClients: Array<any>,
  senderEmail?: string
): { client: any; matchType: string; confidence: number } | null {
  // 1. Code exact (meilleure correspondance)
  const codeMatch = allClients.find(
    c => c.code.toUpperCase() === ticket.clientCode.toUpperCase()
  );
  if (codeMatch) return { client: codeMatch, matchType: 'code_exact', confidence: 1.0 };

  // 2. Nom exact
  const nameMatch = allClients.find(
    c => c.name.toUpperCase() === ticket.clientCode.toUpperCase()
  );
  if (nameMatch) return { client: nameMatch, matchType: 'name_exact', confidence: 0.95 };

  // 3. Alias (liste séparée par virgules)
  for (const client of allClients) {
    if (!client.aliases) continue;
    try {
      const aliases = client.aliases
        .split(',')
        .map((a: string) => a.trim().toUpperCase())
        .filter((a: string) => a.length > 0);
      if (aliases.includes(ticket.clientCode.toUpperCase())) {
        return { client, matchType: 'alias_exact', confidence: 0.9 };
      }
    } catch {}
  }

  // 4. Email de l'expéditeur
  if (senderEmail) {
    const emailMatch = allClients.find(
      c => c.emailSender && c.emailSender.toLowerCase() === senderEmail.toLowerCase()
    );
    if (emailMatch) return { client: emailMatch, matchType: 'email_sender', confidence: 0.85 };
  }

  // 5. Similarité du nom (fuzzy match) - seuil 0.7
  let bestMatch: { client: any; similarity: number } | null = null;
  for (const client of allClients) {
    const similarity = calculateSimilarity(ticket.clientCode, client.name);
    if (similarity >= 0.7 && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { client, similarity };
    }
  }
  if (bestMatch) {
    return { client: bestMatch.client, matchType: 'name_fuzzy', confidence: bestMatch.similarity };
  }

  return null;
}

/**
 * Collecte les emails avec le sujet "Rapport de livraison"
 * et les importe dans la base de données
 */
export async function collectGmailTickets(): Promise<{ imported: number; skipped: number; errors: number; unmatched: number }> {
  const stats = { imported: 0, skipped: 0, errors: 0, unmatched: 0 };

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

    // Chercher tous les emails avec le sujet "Rapport de livraison"
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
        const senderEmail = parsed.from?.text?.match(/[\w.-]+@[\w.-]+/)?.[0];

        const ticket = parseEmailBody(bodyText, subject, receivedAt);

        if (!ticket) {
          console.warn(`[GmailCollector] Email ignoré (parsing échoué): ${subject}`);
          stats.skipped++;
          continue;
        }

        // Trouver le meilleur client correspondant
        const match = findBestMatchingClient(ticket, allClients, senderEmail);

        if (!match) {
          console.warn(`[GmailCollector] ⚠️ Aucun client trouvé pour: ${ticket.clientCode} (email: ${senderEmail})`);
          stats.unmatched++;
          continue;
        }

        console.log(`[GmailCollector] Correspondance trouvée: ${ticket.clientCode} → ${match.client.name} (${match.matchType}, confiance: ${(match.confidence * 100).toFixed(0)}%)`);

        // Vérifier si le billet existe déjà (éviter les doublons)
        const existingTickets = await getTicketsByClientId(match.client.id);
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
          clientId: match.client.id,
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

        console.log(`[GmailCollector] ✅ Billet importé: ${ticket.ticketNumber} pour ${match.client.name}`);
        stats.imported++;
      } catch (msgErr) {
        console.error(`[GmailCollector] Erreur traitement message ${uid}:`, msgErr);
        stats.errors++;
      }
    }

    await client.logout();
    console.log(`[GmailCollector] Terminé — Importés: ${stats.imported}, Ignorés: ${stats.skipped}, Non-associés: ${stats.unmatched}, Erreurs: ${stats.errors}`);
  } catch (err) {
    console.error("[GmailCollector] Erreur connexion IMAP:", err);
    stats.errors++;
    try { await client.logout(); } catch {}
  }

  return stats;
}
