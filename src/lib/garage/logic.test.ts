import { describe, expect, it } from "vitest";

import { dueStatus, nextOdometer, totalCost, upcomingServices } from "./logic";
import type { ServiceRecord } from "./types";

const rec = (p: Partial<ServiceRecord>): ServiceRecord => ({
  id: crypto.randomUUID(),
  vehicleId: "v1",
  kind: "oleo",
  date: "2026-01-01",
  km: 10000,
  description: "",
  cost: 0,
  nextKm: null,
  ...p,
});

describe("dueStatus", () => {
  it("fica atrasado quando o km atual chega no próximo km", () => {
    expect(dueStatus(15000, 15000)).toEqual({ state: "overdue", remainingKm: 0 });
  });
  it("fica em breve com 1000 km ou menos restantes", () => {
    expect(dueStatus(14000, 15000).state).toBe("soon");
  });
  it("fica ok com mais de 1000 km restantes", () => {
    expect(dueStatus(13999, 15000).state).toBe("ok");
  });
});

describe("upcomingServices", () => {
  it("usa só o registro mais recente de cada tipo", () => {
    const list = upcomingServices(
      [rec({ km: 10000, nextKm: 15000 }), rec({ km: 15000, nextKm: 20000 })],
      16000,
    );
    expect(list).toHaveLength(1);
    expect(list[0]?.nextKm).toBe(20000);
  });
  it("um serviço mais novo sem próximo km remove o lembrete", () => {
    const list = upcomingServices([rec({ km: 10000, nextKm: 15000 }), rec({ km: 15000, nextKm: null })], 16000);
    expect(list).toHaveLength(0);
  });
});

describe("totais e hodômetro", () => {
  it("soma os custos", () => {
    expect(totalCost([rec({ cost: 120.5 }), rec({ cost: 79.5 })])).toBe(200);
  });
  it("registro antigo não reduz o km atual", () => {
    expect(nextOdometer(20000, 12000)).toBe(20000);
    expect(nextOdometer(20000, 21000)).toBe(21000);
  });
});
