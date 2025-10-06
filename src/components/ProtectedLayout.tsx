"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") signIn(); // redirect to Keycloak login
  }, [status]);

  if (status === "loading") return <p>Loading...</p>;
  if (status === "unauthenticated") return null;

  return <>{children}</>;
}
