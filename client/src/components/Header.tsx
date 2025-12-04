import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, Sun, PartyPopper } from "lucide-react";

export function Header() {
  const [location] = useLocation();

  return (
    <header className="bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">סידור הסעות</h1>
          <nav className="flex gap-2">
            <Link href="/">
              <Button
                variant={location === "/" ? "secondary" : "ghost"}
                className={location === "/" ? "" : "text-primary-foreground hover:bg-primary-foreground/10"}
                data-testid="nav-daily"
              >
                <Calendar className="h-4 w-4 ml-2" />
                יומי
              </Button>
            </Link>
            <Link href="/holiday">
              <Button
                variant={location === "/holiday" ? "secondary" : "ghost"}
                className={location === "/holiday" ? "" : "text-primary-foreground hover:bg-primary-foreground/10"}
                data-testid="nav-holiday"
              >
                <PartyPopper className="h-4 w-4 ml-2" />
                חג
              </Button>
            </Link>
            <Link href="/weekend">
              <Button
                variant={location === "/weekend" ? "secondary" : "ghost"}
                className={location === "/weekend" ? "" : "text-primary-foreground hover:bg-primary-foreground/10"}
                data-testid="nav-weekend"
              >
                <Sun className="h-4 w-4 ml-2" />
                סופש
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
