import Home from "@/themes/core/Home";
import { CardEntrance } from "@/themes/light/cards/CardEntrance";
import { LightServices } from "@/themes/light/services/LightServices";
import { LightStaffing } from "@/themes/light/staffing/LightStaffing";
import { LightWhy } from "@/themes/light/why/LightWhy";

// "/" — the homepage, with the light Services, Staffing and Why sections.
export default function Page() {
  return (
    <>
      <Home services={<LightServices />} staffing={<LightStaffing />} why={<LightWhy />} />
      <CardEntrance />
    </>
  );
}
