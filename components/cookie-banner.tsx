"use client";

import { useEffect, useState } from "react";

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(window.localStorage.getItem("vh-cookie") !== "1");
  }, []);
  if (!open) return null;
  return (
    <div className="cookie" role="dialog" aria-label="Cookies">
      <p style={{ margin: 0 }}>
        We use one essential cookie to keep you signed in. No advertising cookies.{" "}
        <a href="/legal/cookies" style={{ color: "#fff" }}>Cookie notice</a>
      </p>
      <button
        className="gold"
        type="button"
        onClick={() => {
          window.localStorage.setItem("vh-cookie", "1");
          setOpen(false);
        }}
      >
        OK
      </button>
    </div>
  );
}
