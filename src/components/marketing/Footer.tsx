import { Stethoscope } from 'lucide-react';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { content } from '@/content/strings';

export const Footer = () => {
  return (
    <footer className="border-t bg-card transition-colors duration-200">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70">
              <Stethoscope className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">WBA Tracker</h3>
              <p className="text-sm text-muted-foreground">Workplace-Based Assessment Platform</p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-6 md:justify-center" aria-label="Footer">
            {content.landing.footer.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
          
          {/* Theme Toggle */}
          <div className="flex justify-start md:justify-end">
            <ThemeToggle />
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            {content.landing.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};

