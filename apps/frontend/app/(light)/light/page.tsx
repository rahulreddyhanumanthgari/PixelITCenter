import Home from "@/themes/core/Home";
import { CardEntrance } from "@/themes/light/cards/CardEntrance";
import { LightServices } from "@/themes/light/services/LightServices";
import { LightStaffing } from "@/themes/light/staffing/LightStaffing";
import { LightWhy } from "@/themes/light/why/LightWhy";

// "/" in the light version: the same page as the dark one, with its own
// Services, Staffing and Why sections. Visitors who chose light get it at "/"
// through the rewrite in next.config.ts.
export default function Page() {
  return (
    <>
      <Home
        services={<LightServices />}
        staffing={<LightStaffing />}
        why={<LightWhy />}
      />
      <CardEntrance />
    </>
  );
}
