import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

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
          backgroundColor: "#0F766E",
          borderRadius: "40px",
          color: "#FFFFFF",
          fontSize: "110px",
          fontWeight: 700,
          fontFamily: "system-ui, -apple-system, sans-serif",
          lineHeight: 1,
        }}
      >
        B
      </div>
    ),
    {
      ...size,
    }
  );
}
