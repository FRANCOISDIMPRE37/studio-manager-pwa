import { describe, it, expect } from "vitest";

describe("IONOS DNS API", () => {
  it("should authenticate and list the intemporelle.eu zone", async () => {
    const apiKey = process.env.IONOS_API_KEY;
    const zoneId = process.env.IONOS_ZONE_ID;

    expect(apiKey).toBeTruthy();
    expect(zoneId).toBeTruthy();

    const res = await fetch(`https://api.hosting.ionos.com/dns/v1/zones/${zoneId}`, {
      headers: { "X-API-Key": apiKey! },
    });

    expect(res.ok).toBe(true);
    const data = await res.json() as { name: string; records: unknown[] };
    expect(data.name).toBe("intemporelle.eu");
    expect(Array.isArray(data.records)).toBe(true);
  });
});
