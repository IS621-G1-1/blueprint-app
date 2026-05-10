import { AuthProvider as OidcAuthProvider } from "react-oidc-context";
import type { ReactNode } from "react";
import { oidcConfig } from "./oidcConfig";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <OidcAuthProvider {...oidcConfig}>{children}</OidcAuthProvider>;
}
