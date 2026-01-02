import { useEffect } from "react";

import { Home, ArrowLeft } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.warn("404 Error: User attempted to access non-existent route", { pathname: location.pathname });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md space-y-6 text-center">
        <div>
          <h1 className="mb-2 text-6xl font-bold text-foreground">404</h1>
          <h2 className="mb-2 text-2xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="default">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
        {import.meta.env.DEV && (
          <p className="font-mono text-xs text-muted-foreground">
            Attempted path: {location.pathname}
          </p>
        )}
      </div>
    </div>
  );
};

export default NotFound;
