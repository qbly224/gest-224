import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1f3d2c",
          color: "#f6f1e7",
          fontSize: 115,
          fontWeight: 600,
          fontFamily: "serif",
        }}
      >
        G
      </div>
    ),
    { width: 192, height: 192 }
  );
}
