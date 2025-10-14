"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const r = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("lu_isAuthed") !== "1") {
      r.replace("/login");
    }
  }, [r]);

  return <>{children}</>;
}
