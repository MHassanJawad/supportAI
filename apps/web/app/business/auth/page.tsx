// Legacy business authentication route.
import { redirect } from "next/navigation";

export default function BusinessAuthPage() {
  redirect("/business/login");
}
