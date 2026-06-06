import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getClientsByUserId: vi.fn().mockResolvedValue([]),
  getClientById: vi.fn().mockResolvedValue(undefined),
  createClient: vi.fn().mockResolvedValue({ id: "test-id" }),
  updateClientById: vi.fn().mockResolvedValue(undefined),
  deleteClientById: vi.fn().mockResolvedValue(undefined),
  getPrestationsByClientId: vi.fn().mockResolvedValue([]),
  createPrestation: vi.fn().mockResolvedValue({ id: "p-id" }),
  deletePrestationById: vi.fn().mockResolvedValue(undefined),
  getDocumentsByClientId: vi.fn().mockResolvedValue([]),
  getDocumentById: vi.fn().mockResolvedValue(undefined),
  createDocument: vi.fn().mockResolvedValue({ id: "d-id" }),
  updateDocumentById: vi.fn().mockResolvedValue(undefined),
  getRDVByUserId: vi.fn().mockResolvedValue([]),
  createRDV: vi.fn().mockResolvedValue({ id: "rdv-id" }),
  updateRDVById: vi.fn().mockResolvedValue(undefined),
  deleteRDVById: vi.fn().mockResolvedValue(undefined),
  getSalonSettings: vi.fn().mockResolvedValue(null),
  upsertSalonSettings: vi.fn().mockResolvedValue(undefined),
}));

import {
  getClientsByUserId, createClient, getRDVByUserId, createRDV,
  getSalonSettings, upsertSalonSettings,
} from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 42,
    openId: "test-user-openid",
    email: "francois-dimpre@studiomanagereurope.eu",
    name: "François Dimpré",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("clients router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists clients for authenticated user", async () => {
    const mockClients = [
      { id: "c1", nom: "MARTIN", prenom: "Sophie", userId: 42 },
    ];
    vi.mocked(getClientsByUserId).mockResolvedValueOnce(mockClients as never);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clients.list();

    expect(result).toEqual(mockClients);
    expect(getClientsByUserId).toHaveBeenCalledWith(42);
  });

  it("creates a client and saves to database", async () => {
    const newClient = {
      id: "new-client-id",
      nom: "DUPUIS",
      prenom: "Marie",
      dateNaissance: "1985-06-20",
      telephone: "06 11 22 33 44",
      estMineur: false,
      estArchive: false,
      dateSuppressionPrevue: "2030-06-20",
      rgpdDroitsExerces: [],
    };

    vi.mocked(createClient).mockResolvedValueOnce({ ...newClient, userId: 42 } as never);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clients.create(newClient);

    expect(createClient).toHaveBeenCalledWith({ ...newClient, userId: 42 });
    expect(result).toMatchObject({ nom: "DUPUIS" });
  });

  it("deletes a client by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clients.delete({ id: "c1" });

    expect(result).toEqual({ success: true });
  });
});

describe("rdv router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists RDV for authenticated user", async () => {
    const mockRDV = [
      { id: "rdv1", date: "2026-03-20", heureDebut: "10:00", heureFin: "11:00", type: "piercing", statut: "confirme", userId: 42 },
    ];
    vi.mocked(getRDVByUserId).mockResolvedValueOnce(mockRDV as never);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.rdv.list();

    expect(result).toEqual(mockRDV);
    expect(getRDVByUserId).toHaveBeenCalledWith(42);
  });

  it("creates a RDV", async () => {
    const newRDV = {
      id: "rdv-new",
      date: "2026-03-25",
      heureDebut: "14:00",
      heureFin: "15:00",
      type: "tatouage" as const,
      statut: "confirme" as const,
      clientNom: "Lucas DUPONT",
    };

    vi.mocked(createRDV).mockResolvedValueOnce({ ...newRDV, userId: 42 } as never);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.rdv.create(newRDV);

    expect(createRDV).toHaveBeenCalledWith({ ...newRDV, userId: 42 });
    expect(result).toMatchObject({ date: "2026-03-25" });
  });
});

describe("salon router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no salon settings exist", async () => {
    vi.mocked(getSalonSettings).mockResolvedValueOnce(undefined as never);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.salon.get();

    expect(result).toBeUndefined();
    expect(getSalonSettings).toHaveBeenCalledWith(42);
  });

  it("updates salon settings", async () => {
    vi.mocked(upsertSalonSettings).mockResolvedValueOnce(undefined as never);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.salon.update({
      nom: "Intemporelle Studio",
      nomPierceur: "François Dimpré",
      siret: "123 456 789 00012",
    });

    expect(result).toEqual({ success: true });
    expect(upsertSalonSettings).toHaveBeenCalledWith(42, {
      nom: "Intemporelle Studio",
      nomPierceur: "François Dimpré",
      siret: "123 456 789 00012",
    });
  });
});

describe("auth router", () => {
  it("returns current user from me query", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();

    expect(result).toMatchObject({
      email: "francois-dimpre@studiomanagereurope.eu",
      role: "admin",
    });
  });
});
