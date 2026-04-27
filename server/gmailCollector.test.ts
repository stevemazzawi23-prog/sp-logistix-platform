import { describe, it, expect } from "vitest";
import { parseEmailBody } from "./gmailCollector";

describe("parseEmailBody", () => {
  it("parse un email de rapport de livraison complet", () => {
    const body = `
Client: ABC123
Numéro de billet: BL-2024-001
Date de livraison: 2024-03-15
Unités remplies: 5
Litrage: 1250.50
Code de localisation: SITE-A
Durée: 02:30
    `.trim();

    const result = parseEmailBody(body, "Rapport de livraison", new Date("2024-03-15T10:00:00Z"));

    expect(result).not.toBeNull();
    expect(result?.clientCode).toBe("ABC123");
    expect(result?.ticketNumber).toBe("BL-2024-001");
    expect(result?.volumeTotal).toBe("1250.50");
    expect(result?.pieces).toBe(5);
    expect(result?.locationCode).toBe("SITE-A");
    expect(result?.duration).toBe("02:30");
  });

  it("parse un email avec virgule dans le litrage", () => {
    const body = `
Client: XYZ456
Numéro de billet: BL-2024-002
Date de livraison: 2024-03-16
Unités remplies: 3
Litrage: 875,25
    `.trim();

    const result = parseEmailBody(body, "Rapport de livraison", new Date());

    expect(result).not.toBeNull();
    expect(result?.volumeTotal).toBe("875.25");
    expect(result?.pieces).toBe(3);
  });

  it("retourne null si les champs obligatoires sont manquants", () => {
    const body = `
Date de livraison: 2024-03-15
Litrage: 500
    `.trim();

    const result = parseEmailBody(body, "Rapport de livraison", new Date());
    expect(result).toBeNull();
  });

  it("normalise le code client en majuscules", () => {
    const body = `
Client: abc-123
Numéro de billet: BL-001
Litrage: 100
    `.trim();

    const result = parseEmailBody(body, "Rapport de livraison", new Date());
    expect(result?.clientCode).toBe("ABC-123");
  });

  it("parse la date au format DD/MM/YYYY", () => {
    const body = `
Client: TEST
Numéro de billet: BL-003
Date de livraison: 15/03/2024
Litrage: 500
    `.trim();

    const result = parseEmailBody(body, "Rapport de livraison", new Date());
    expect(result).not.toBeNull();
    expect(result?.deliveryDate.getFullYear()).toBe(2024);
    expect(result?.deliveryDate.getMonth()).toBe(2); // Mars = index 2
  });

  it("utilise la date de réception si la date de livraison est absente", () => {
    const receivedAt = new Date("2024-04-01T08:00:00Z");
    const body = `
Client: TEST
Numéro de billet: BL-004
Litrage: 200
    `.trim();

    const result = parseEmailBody(body, "Rapport de livraison", receivedAt);
    expect(result?.deliveryDate).toEqual(receivedAt);
  });
});
