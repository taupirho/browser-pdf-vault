import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

interface MobileMenuProps {
  user: { id: string } | null;
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <nav className="flex flex-col gap-4 mt-8">
          <SheetClose asChild>
            <Link to="/pricing">
              <Button variant="ghost" className="w-full justify-start text-lg">
                Pricing
              </Button>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link to="/about">
              <Button variant="ghost" className="w-full justify-start text-lg">
                About
              </Button>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link to="/contact">
              <Button variant="ghost" className="w-full justify-start text-lg">
                Contact
              </Button>
            </Link>
          </SheetClose>
          {user && (
            <SheetClose asChild>
              <Link to="/account">
                <Button variant="ghost" className="w-full justify-start text-lg">
                  My Account
                </Button>
              </Link>
            </SheetClose>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
