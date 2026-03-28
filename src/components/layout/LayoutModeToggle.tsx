import { Monitor, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLayoutDensity } from "@/contexts/LayoutDensityContext";

/**
 * Toggle comfortable (desktop-style spacing) vs compact (mobile-optimized) layout.
 */
export function LayoutModeToggle({ className }: { className?: string }) {
  const { density, toggleDensity } = useLayoutDensity();
  const isCompact = density === "compact";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={toggleDensity}
      title={isCompact ? "Use comfortable layout" : "Optimize layout for mobile"}
    >
      {isCompact ? (
        <>
          <Monitor className="mr-2 h-4 w-4" />
          Comfortable
        </>
      ) : (
        <>
          <Smartphone className="mr-2 h-4 w-4" />
          Mobile layout
        </>
      )}
    </Button>
  );
}
