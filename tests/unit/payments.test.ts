import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { csvCell, toCsv } from "@/lib/csv";
import { midtransSignature } from "@/lib/midtrans";
import { addOneMonth, mapPaymentStatus, mapSubscriptionStatus } from "@/lib/payments";

describe("CSV", () => {
  it("menambahkan BOM dan mengescape koma, kutip, serta newline", () => {
    const csv = toCsv([["judul", "catatan"], ["A, B", 'kutip "x"'], ["baris\nbaru", "normal"]]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"A, B"');
    expect(csv).toContain('"kutip ""x"""');
    expect(csv).toContain('"baris\nbaru"');
  });

  it("mencegah formula injection", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+cmd")).toBe("'+cmd");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("biasa")).toBe("biasa");
  });

  it("menghasilkan header valid untuk data kosong", () => {
    expect(toCsv([["nama", "status"]])).toBe("\uFEFFnama,status");
  });
});

describe("Midtrans signature", () => {
  it("menghasilkan SHA512 dari order id, status code, gross amount, dan server key", () => {
    const expected = createHash("sha512")
      .update("HF-1" + "200" + "29000.00" + "server-key")
      .digest("hex");

    expect(
      midtransSignature({
        orderId: "HF-1",
        statusCode: "200",
        grossAmount: "29000.00",
        serverKey: "server-key",
      }),
    ).toBe(expected);
  });
});

describe("status pembayaran", () => {
  it("memetakan status transaksi Midtrans", () => {
    expect(mapPaymentStatus("settlement", null)).toBe("paid");
    expect(mapPaymentStatus("capture", "accept")).toBe("paid");
    expect(mapPaymentStatus("capture", "challenge")).toBe("pending");
    expect(mapPaymentStatus("pending", null)).toBe("pending");
    expect(mapPaymentStatus("deny", null)).toBe("failed");
    expect(mapPaymentStatus("expire", null)).toBe("expired");
    expect(mapPaymentStatus("refund", null)).toBe("refunded");
  });

  it("menjaga status canceled dan memberi grace untuk inactive", () => {
    const now = new Date("2026-11-24T00:00:00.000Z");

    expect(mapSubscriptionStatus("canceled", null, "active", now)).toBe("canceled");
    expect(mapSubscriptionStatus("inactive", "2026-11-23T00:00:00.000Z", "active", now)).toBe(
      "past_due",
    );
    expect(mapSubscriptionStatus("inactive", "2026-10-01T00:00:00.000Z", "active", now)).toBe(
      "expired",
    );
  });
});

describe("periode bulanan", () => {
  it("tidak overflow dari 31 Januari", () => {
    expect(addOneMonth(new Date("2026-01-31T00:00:00.000Z")).toISOString()).toBe(
      "2026-02-28T00:00:00.000Z",
    );
  });

  it("menambah satu bulan biasa", () => {
    expect(addOneMonth(new Date("2026-11-24T00:00:00.000Z")).toISOString()).toBe(
      "2026-12-24T00:00:00.000Z",
    );
  });
});
