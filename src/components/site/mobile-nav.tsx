"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { InstagramIcon } from "@/components/site/icons";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavLinks } from "@/components/site/nav-links";
import { SITE } from "@/lib/site";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open navigation menu"
        className="inline-flex size-9 items-center justify-center rounded-full text-forest transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest md:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="right" className="bg-cream">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl text-forest">
            TheGreenFeed
          </SheetTitle>
          <SheetDescription>
            Practical waste-management guidance for home and campus.
          </SheetDescription>
        </SheetHeader>
        <NavLinks
          className="flex-col items-stretch gap-1 px-4 [&_a]:px-3 [&_a]:py-3 [&_a]:text-base"
          onNavigate={() => setOpen(false)}
        />
        <div className="mt-auto p-4">
          <Link
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            <InstagramIcon className="size-4" />
            Follow {SITE.instagramHandle}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
