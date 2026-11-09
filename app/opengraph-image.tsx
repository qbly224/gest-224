import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Mêmes couleurs que le thème clair (app/globals.css : --color-encre,
// --color-ivoire) en valeurs littérales - une image Open Graph est un PNG
// statique, pas de mode sombre à gérer ici.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1f3d2c",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0 80px",
          }}
        >
          <div
            style={{
              fontSize: 112,
              fontWeight: 600,
              color: "#f6f1e7",
              letterSpacing: "-0.02em",
              display: "flex",
            }}
          >
            Gest-224
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 36,
              color: "#f6f1e7",
              opacity: 0.75,
              display: "flex",
            }}
          >
            Gestion commerciale multi-entreprises
          </div>
          <div
            style={{
              marginTop: 48,
              width: 120,
              height: 3,
              backgroundColor: "#f6f1e7",
              opacity: 0.5,
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
