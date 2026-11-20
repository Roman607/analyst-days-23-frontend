import type { Metadata } from "next";
import { ProgramScreen } from "@/components/program-screen";

export const metadata: Metadata = { title: "Программа" };

export default function ProgramPage() {
  return <ProgramScreen />;
}
