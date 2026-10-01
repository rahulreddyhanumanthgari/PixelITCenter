import { Staffing } from "@/themes/core/components/sections/Staffing";
import { StaffingGlobe } from "./StaffingGlobe";

/**
 * Light design, Staffing & Consulting: the shared section's content in front
 * of a large white sculpted globe with a soft blue glow (owner's reference).
 */
export function LightStaffing() {
  return (
    <div className="relative isolate">
      <StaffingGlobe />
      <div className="relative z-10">
        <Staffing />
      </div>
    </div>
  );
}
