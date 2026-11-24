import { ImageResponse } from "next/og";

export const alt = "HabitFlow — bangun kebiasaan, selesaikan tugas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fafaf9",
          color: "#111827",
          padding: "72px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: "#3f6212",
              color: "#fafaf9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "38px",
              fontWeight: 700,
            }}
          >
            ✓
          </div>
          <div style={{ fontSize: "32px", fontWeight: 600 }}>HabitFlow</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "64px",
              lineHeight: 1.1,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              maxWidth: "900px",
            }}
          >
            Bangun kebiasaan kecil. Lihat hasilnya setiap hari.
          </div>
          <div style={{ fontSize: "28px", color: "#6b7280", maxWidth: "820px" }}>
            Habit tracker, to-do list, dan pengingat dalam satu tempat.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            fontSize: "22px",
            color: "#3f6212",
            fontWeight: 600,
          }}
        >
          <span>3 habit gratis</span>
          <span>·</span>
          <span>Tanpa trial</span>
          <span>·</span>
          <span>Bisa berhenti kapan saja</span>
        </div>
      </div>
    ),
    size,
  );
}
