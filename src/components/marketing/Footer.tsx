import { Stethoscope } from 'lucide-react';
import { content } from '@/content/strings';

export const Footer = () => {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-lg">
              <Stethoscope className="w-6 h-6 text-primary-foreground" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">WBA Tracker</h3>
              <p className="text-sm text-muted-foreground">Workplace-Based Assessment Platform</p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-6 md:justify-end" aria-label="Footer">
            {content.landing.footer.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t">
          <p className="text-center text-sm text-muted-foreground">
            {content.landing.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};

