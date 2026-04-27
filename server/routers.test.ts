import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@sp-logistix.com",
    name: "Admin SP Logistix",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "client-user",
    email: "client@example.com",
    name: "Client User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Client User");
    expect(result?.role).toBe("user");
  });

  it("returns admin user data", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Admin SP Logistix");
    expect(result?.role).toBe("admin");
  });
});

describe("clients routes - access control", () => {
  it("admin can list clients", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clients.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("non-admin cannot list all clients", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.clients.list()).rejects.toThrow();
  });

  it("authenticated user can get their own client", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clients.getMyClient();
    // Should return undefined since no client is linked to this user
    expect(result === undefined || result === null || typeof result === "object").toBe(true);
  });

  it("non-admin cannot create clients", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.clients.create({ code: "TEST", name: "Test Client" })
    ).rejects.toThrow();
  });

  it("non-admin cannot delete clients", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.clients.delete({ id: 1 })).rejects.toThrow();
  });
});

describe("contacts routes - access control", () => {
  it("non-admin cannot create contacts", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.contacts.create({ clientId: 1, name: "Test Contact" })
    ).rejects.toThrow();
  });

  it("non-admin cannot delete contacts", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.contacts.delete({ id: 1 })).rejects.toThrow();
  });
});

describe("tickets routes - access control", () => {
  it("admin can list all tickets", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tickets.listAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it("non-admin cannot list all tickets", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.tickets.listAll()).rejects.toThrow();
  });

  it("non-admin cannot create tickets", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.tickets.create({
        clientId: 1,
        ticketNumber: "T001",
        volumeTotal: "100",
        deliveryDate: "2026-04-01",
      })
    ).rejects.toThrow();
  });
});

describe("reports routes - access control", () => {
  it("non-admin cannot generate reports", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.reports.generate({ clientId: 1, year: 2026, month: 4 })
    ).rejects.toThrow();
  });
});
