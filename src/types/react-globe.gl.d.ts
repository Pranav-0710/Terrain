import type { MouseEvent } from "react";

declare module "react-globe.gl" {
  interface GlobeProps {
    onRingClick?: (ring: object, event: MouseEvent) => void;
  }
}
