import Link from "next/link";
import { SAFETY_FOOTNOTE } from "@/lib/constants";
import { Logo } from "./nav";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-white/[0.06]">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            The marketplace for people who <span className="accent text-foreground">direct</span> the machines. Discover AI-native creators,
            brief them properly, and ship.
          </p>
          <p className="eyebrow mt-6 !normal-case !tracking-normal">Built for the byteXL x KampusIC hackathon</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="eyebrow mb-1">Brands</span>
          <Link href="/creators" className="text-muted-foreground hover:text-foreground">Discover creators</Link>
          <Link href="/briefs/new" className="text-muted-foreground hover:text-foreground">Post a brief</Link>
          <Link href="/engagements" className="text-muted-foreground hover:text-foreground">Engagements</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="eyebrow mb-1">Creators</span>
          <Link href="/creators/new" className="text-muted-foreground hover:text-foreground">Join as creator</Link>
          <Link href="/creators?view=works" className="text-muted-foreground hover:text-foreground">Browse works</Link>
        </div>
      </div>
      <div className="mx-auto max-w-[1280px] px-4 pb-10 text-[11px] text-subtle sm:px-6">
        {SAFETY_FOOTNOTE} All creators and brands shown are fictional.
      </div>
    </footer>
  );
}
