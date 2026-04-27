import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllClients, getClientById, getClientByUserId, createClient, updateClient, deleteClient,
  getContactsByClientId, createContact, updateContact, deleteContact,
  getTicketsByClientId, getTicketsByClientIdAndMonth, createDeliveryTicket, getAllTickets,
  getMonthlyReportsByClientId, upsertMonthlyReport
} from "./db";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ CLIENTS ============
  clients: router({
    list: adminProcedure.query(async () => {
      return getAllClients();
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getClientById(input.id);
    }),
    getMyClient: protectedProcedure.query(async ({ ctx }) => {
      return getClientByUserId(ctx.user.id);
    }),
    create: adminProcedure.input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      address: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      postalCode: z.string().optional(),
      classe: z.string().optional(),
      sousClasse: z.string().optional(),
      siteStatus: z.string().optional(),
      managementType: z.string().optional(),
      btuName: z.string().optional(),
      siteType: z.string().optional(),
      userId: z.number().optional(),
    })).mutation(async ({ input }) => {
      const id = await createClient(input);
      return { id };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      code: z.string().optional(),
      name: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      postalCode: z.string().optional(),
      classe: z.string().optional(),
      sousClasse: z.string().optional(),
      siteStatus: z.string().optional(),
      managementType: z.string().optional(),
      btuName: z.string().optional(),
      siteType: z.string().optional(),
      userId: z.number().nullable().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateClient(id, data);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteClient(input.id);
      return { success: true };
    }),
  }),

  // ============ CONTACTS ============
  contacts: router({
    listByClient: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }) => {
      return getContactsByClientId(input.clientId);
    }),
    create: adminProcedure.input(z.object({
      clientId: z.number(),
      name: z.string().min(1),
      role: z.string().optional(),
      phone: z.string().optional(),
      extension: z.string().optional(),
      email: z.string().optional(),
      isPrimary: z.number().optional(),
    })).mutation(async ({ input }) => {
      const id = await createContact(input);
      return { id };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      role: z.string().optional(),
      phone: z.string().optional(),
      extension: z.string().optional(),
      email: z.string().optional(),
      isPrimary: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateContact(id, data);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteContact(input.id);
      return { success: true };
    }),
  }),

  // ============ DELIVERY TICKETS ============
  tickets: router({
    listByClient: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }) => {
      return getTicketsByClientId(input.clientId);
    }),
    listByClientAndMonth: protectedProcedure.input(z.object({
      clientId: z.number(),
      year: z.number(),
      month: z.number(),
    })).query(async ({ input }) => {
      return getTicketsByClientIdAndMonth(input.clientId, input.year, input.month);
    }),
    listAll: adminProcedure.query(async () => {
      return getAllTickets();
    }),
    create: adminProcedure.input(z.object({
      clientId: z.number(),
      ticketNumber: z.string().min(1),
      locationCode: z.string().optional(),
      volumeTotalDef: z.string().optional(),
      volumeTotal: z.string().min(1),
      pieces: z.number().optional(),
      duration: z.string().optional(),
      deliveryDate: z.string().min(1),
      emailSubject: z.string().optional(),
      emailReceivedAt: z.string().optional(),
    })).mutation(async ({ input }) => {
      const data = {
        ...input,
        deliveryDate: new Date(input.deliveryDate),
        emailReceivedAt: input.emailReceivedAt ? new Date(input.emailReceivedAt) : undefined,
      };
      const id = await createDeliveryTicket(data);
      return { id };
    }),
  }),

  // ============ MONTHLY REPORTS ============
  reports: router({
    listByClient: protectedProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }) => {
      return getMonthlyReportsByClientId(input.clientId);
    }),
    generate: adminProcedure.input(z.object({
      clientId: z.number(),
      year: z.number(),
      month: z.number(),
    })).mutation(async ({ input }) => {
      const tickets = await getTicketsByClientIdAndMonth(input.clientId, input.year, input.month);
      const totalVolume = tickets.reduce((sum, t) => sum + parseFloat(t.volumeTotal as string || "0"), 0);
      const totalUnits = tickets.reduce((sum, t) => sum + (t.pieces || 0), 0);
      await upsertMonthlyReport({
        clientId: input.clientId,
        month: input.month,
        year: input.year,
        totalVolume: totalVolume.toFixed(2),
        totalUnits: totalUnits,
        totalDeliveries: tickets.length,
      });
      return { success: true, totalVolume, totalUnits, totalDeliveries: tickets.length };
    }),
  }),

  // ============ SCHEDULED ENDPOINT FOR EMAIL COLLECTION ============
  scheduled: router({
    ingestTicket: protectedProcedure.input(z.object({
      clientCode: z.string(),
      ticketNumber: z.string(),
      locationCode: z.string().optional(),
      volumeTotalDef: z.string().optional(),
      volumeTotal: z.string(),
      pieces: z.number().optional(),
      duration: z.string().optional(),
      deliveryDate: z.string(),
      emailSubject: z.string().optional(),
      emailReceivedAt: z.string().optional(),
    })).mutation(async ({ input }) => {
      // Find client by code
      const allClients = await getAllClients();
      const client = allClients.find(c => c.code === input.clientCode);
      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Client with code ${input.clientCode} not found` });
      }
      const data = {
        clientId: client.id,
        ticketNumber: input.ticketNumber,
        locationCode: input.locationCode,
        volumeTotalDef: input.volumeTotalDef,
        volumeTotal: input.volumeTotal,
        pieces: input.pieces,
        duration: input.duration,
        deliveryDate: new Date(input.deliveryDate),
        emailSubject: input.emailSubject,
        emailReceivedAt: input.emailReceivedAt ? new Date(input.emailReceivedAt) : undefined,
      };
      const id = await createDeliveryTicket(data);
      return { id, success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
