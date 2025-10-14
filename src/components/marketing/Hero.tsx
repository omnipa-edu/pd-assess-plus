import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

import { PlatformPreview } from '@/components/marketing/PlatformPreview';
import { Button } from '@/components/ui/button';
import { content } from '@/content/strings';

interface HeroProps {
  onGetStarted: () => void;
  onLearnMore: () => void;
}

export const Hero = ({ onGetStarted, onLearnMore }: HeroProps) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 pb-16 pt-20 transition-colors duration-200 dark:to-primary/10 md:pb-24 md:pt-32">
      {/* Background decoration */}
      <div className="bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.02] absolute inset-0 bg-[size:32px_32px]" aria-hidden="true" />
      <div className="absolute right-0 top-0 -mr-10 -mt-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl dark:bg-accent/20" aria-hidden="true" />
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 inline-flex"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Workplace-based assessment made simple</span>
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {content.landing.hero.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            {content.landing.hero.subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              onClick={onGetStarted}
              className="group min-w-[200px] bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
            >
              {content.landing.hero.ctaPrimary}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onLearnMore}
              className="min-w-[200px] transition-all duration-200 hover:scale-105"
            >
              {content.landing.hero.ctaSecondary}
            </Button>
          </motion.div>

          {/* Platform preview mockup */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-16"
          >
            <div className="relative mx-auto max-w-3xl rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 p-6 shadow-2xl ring-1 ring-black/5 transition-colors duration-200 dark:from-primary/30 dark:to-accent/30 dark:ring-white/10 md:p-8">
              <PlatformPreview />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

