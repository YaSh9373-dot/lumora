import { ImageResponse } from "next/og";

export const alt = "Lumora — Hire the people who direct the machines";
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
          justifyContent: "flex-end",
          padding: 80,
          background:
            "radial-gradient(circle at 15% 20%, rgba(124,92,255,0.55), transparent 45%), radial-gradient(circle at 85% 25%, rgba(255,92,170,0.45), transparent 45%), radial-gradient(circle at 55% 90%, rgba(255,180,92,0.35), transparent 50%), #07070B",
          color: "#F5F5F7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 6, textTransform: "uppercase", opacity: 0.7 }}>Lumora</div>
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3, marginTop: 16, maxWidth: 950 }}>
          Hire the people who direct the machines.
        </div>
        <div style={{ fontSize: 28, opacity: 0.7, marginTop: 24 }}>The AI-native creative marketplace</div>
      </div>
    ),
    size,
  );
}
