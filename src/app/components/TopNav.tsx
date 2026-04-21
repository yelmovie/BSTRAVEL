import { useNavigate, useLocation } from "react-router";
import { Home, ChevronLeft, MapPin } from "lucide-react";

interface TopNavProps {
  title?: string;
  showBack?: boolean;
}

export function TopNav({ title, showBack = true }: TopNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "/mobile";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(248, 249, 252, 0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E8E9EE",
        padding: "0 20px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {showBack && !isHome && (
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid #E8E9EE",
              background: "white",
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label="뒤로 가기"
          >
            <ChevronLeft size={18} color="#4A4A6A" />
          </button>
        )}
        {isHome && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "#5B54D6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPin size={16} color="white" />
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.3 }}>
                같이가능 부산
              </span>
            </div>
          </div>
        )}
        {title && !isHome && (
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#1A1A2E",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </span>
        )}
      </div>

      {!isHome && (
        <button
          onClick={() => navigate("/mobile")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1px solid #E8E9EE",
            background: "white",
            cursor: "pointer",
            flexShrink: 0,
          }}
          aria-label="홈으로"
        >
          <Home size={17} color="#4A4A6A" />
        </button>
      )}
    </header>
  );
}
