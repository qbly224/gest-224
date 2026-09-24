import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 100,
          fontWeight: 600,
          fontFamily: "serif",
        }}
      >
        G
      </div>
    ),
    { ...size }
  );
}
