"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedLayout from "@/components/ProtectedLayout";


export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const r = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("lu_isAuthed") !== "1") {
      r.replace("/login");
    }
  }, [r]);

  return <ProtectedLayout>{children}</ProtectedLayout>;
}
