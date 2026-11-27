import type { ReactNode } from "react";
import { useUser, useClerk, Show } from "@clerk/react";

export const hasClerkKey = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export function useAuthUser() {
  if (!hasClerkKey) {
    return { user: null };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useUser();
}

export function useAuthClerk() {
  if (!hasClerkKey) {
    return {
      signOut: async ({ redirectUrl }: { redirectUrl?: string } = {}) => {
        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      },
    };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useClerk();
}

export function SignedInGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  if (!hasClerkKey) {
    return <>{children}</>;
  }
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">{fallback}</Show>
    </>
  );
}
