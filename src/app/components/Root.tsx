import { Outlet } from "react-router";
import { TourRecommendationsProvider } from "../context/TourRecommendationsContext";

export function MobileRoot() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#F1F2F6",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          minHeight: "100dvh",
          background: "#F8F9FC",
          position: "relative",
          overflowX: "hidden",
          boxShadow: "0 0 60px rgba(0,0,0,0.06)",
        }}
      >
        <TourRecommendationsProvider>
          <Outlet />
        </TourRecommendationsProvider>
      </div>
    </div>
  );
}

export function AppRoot() {
  return (
    <>
      <Outlet />
    </>
  );
}