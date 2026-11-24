import { describe, expect, it } from "vitest";

import {
  getCompletionSummary,
  getCurrentStreak,
  todayInTimezone,
} from "@/lib/dates";

const daily = { frequency: "daily" as const, weekdays: [] as number[] };
const weekdays = { frequency: "weekdays" as const, weekdays: [1, 3, 5] };

describe("streak", () => {
  it("menghitung tiga hari berturut untuk habit harian", () => {
    const completed = new Set(["2026-11-24", "2026-11-23", "2026-11-22"]);
    expect(getCurrentStreak(daily, completed, "2026-11-24")).toBe(3);
  });

  it("tidak memutus streak ketika hari ini belum selesai", () => {
    const completed = new Set(["2026-11-23", "2026-11-22"]);
    expect(getCurrentStreak(daily, completed, "2026-11-24")).toBe(2);
  });

  it("memutus streak pada hari terjadwal yang bolong", () => {
    const completed = new Set(["2026-11-24", "2026-11-22"]);
    expect(getCurrentStreak(daily, completed, "2026-11-24")).toBe(1);
  });

  it("melewati akhir pekan untuk jadwal Senin/Rabu/Jumat", () => {
    const completed = new Set(["2026-11-23", "2026-11-25", "2026-11-27"]);
    expect(getCurrentStreak(weekdays, completed, "2026-11-27")).toBe(3);
  });
});

describe("completion rate", () => {
  it("menghitung hanya hari terjadwal", () => {
    const completed = new Set(["2026-11-23", "2026-11-27"]);
    const summary = getCompletionSummary(weekdays, completed, "2026-11-23", "2026-11-29");

    expect(summary.scheduled).toBe(3);
    expect(summary.completed).toBe(2);
    expect(summary.rate).toBe(67);
  });

  it("mengembalikan 0 untuk rentang tanpa jadwal", () => {
    const summary = getCompletionSummary(weekdays, new Set(), "2026-11-24", "2026-11-24");
    expect(summary).toEqual({ completed: 0, scheduled: 0, rate: 0 });
  });
});

describe("batas tengah malam zona waktu", () => {
  it("membedakan tanggal Jakarta dan UTC", () => {
    const instant = new Date("2026-11-23T17:30:00.000Z");
    expect(todayInTimezone("Asia/Jakarta", instant)).toBe("2026-11-24");
    expect(todayInTimezone("UTC", instant)).toBe("2026-11-23");
  });
});
