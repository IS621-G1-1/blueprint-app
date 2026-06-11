import { Link } from "react-router-dom";
import { BrandWordmark } from "@/components/BrandWordmark";
import { Separator } from "@/components/ui/separator";

interface AuthShellProps {
  children: React.ReactNode;
  footerText?: string;
  footerLinkText?: string;
  footerLinkTo?: string;
}

export function AuthShell({
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(198,160,72,0.16),transparent_32%),linear-gradient(145deg,#061225_0%,#091b37_48%,#050913_100%)] px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-[0.18em]">
            <BrandWordmark />
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
            Plan your academic journey with clarity.
          </h1>
        </div>

        {children}

        {footerText && footerLinkText && footerLinkTo ? (
          <>
            <Separator className="my-6 bg-border/70" />
            <p className="text-center text-sm text-muted-foreground">
              {footerText}{" "}
              <Link
                to={footerLinkTo}
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                {footerLinkText}
              </Link>
            </p>
          </>
        ) : null}
      </section>
    </main>
  );
}
