import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { content } from '@/content/strings';

import { LogoWordmark } from '@/components/brand/LogoWordmark';

export const Footer = () => {
  return (
    <footer className="border-t bg-card transition-colors duration-200">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Logo showText={false} />
            <div>
              <LogoWordmark className="text-lg" />
              <p className="text-sm text-muted-foreground">Clinical Intelligence Platform</p>
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

