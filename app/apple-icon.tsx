import { ImageResponse } from "next/og";

/** Icône d'écran d'accueil (iOS) : le ticket de caisse du favicon, sur fond « table ». */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#dfe4e6" }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32">
          <path fill="#fdfdfa" stroke="#1a1d21" strokeWidth="1.5" d="M7 3h18v24l-3 2-3-2-3 2-3-2-3 2-3-2z" />
          <path stroke="#1a1d21" strokeWidth="2" d="M11 9h10M11 13h10M11 17h6" />
          <path stroke="#1d7349" strokeWidth="2.4" d="M11 22h10" />
        </svg>
      </div>
    ),
    size,
  );
}
