// Legacy customer authentication route.
import { redirect } from "next/navigation";

export default function CustomerAuthPage() {
  redirect("/customer/login");
}
