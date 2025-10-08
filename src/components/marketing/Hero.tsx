import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { content } from '@/content/strings';

interface HeroProps {
  onGetStarted: () => void;
  onLearnMore: () => void;
}

export const Hero = ({ onGetStarted, onLearnMore }: HeroProps) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 dark:to-primary/10 pt-20 pb-16 md:pt-32 md:pb-24 transition-colors duration-200">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.02] bg-[size:32px_32px]" aria-hidden="true" />
      <div className="absolute top-0 right-0 -mt-10 -mr-10 h-96 w-96 rounded-full bg-primary/10 dark:bg-primary/20 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-96 w-96 rounded-full bg-accent/10 dark:bg-accent/20 blur-3xl" aria-hidden="true" />
      
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
              className="group min-w-[200px] bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
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

          {/* Visual element placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-16"
          >
            <div className="relative mx-auto max-w-3xl rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30 p-8 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transition-colors duration-200">
              <div className="aspect-video rounded-lg bg-background/50 dark:bg-background/70 backdrop-blur-sm flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Platform Preview</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

