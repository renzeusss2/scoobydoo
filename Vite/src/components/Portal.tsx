import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
}

// Renders children directly into document.body,
// bypassing any parent z-index stacking contexts (e.g. the navbar)
export default function Portal({ children }: PortalProps) {
  const el = useRef(document.createElement("div"));

  useEffect(() => {
    const target = document.body;
    target.appendChild(el.current);
    return () => { target.removeChild(el.current); };
  }, []);

  return createPortal(children, el.current);
}