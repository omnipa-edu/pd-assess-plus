import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';

export const LandingHeader = () => {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-1">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Logo showText={false} size="lg" />
          </Link>

          {/* Navigation Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              asChild
              className="hidden sm:inline-flex"
            >
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

