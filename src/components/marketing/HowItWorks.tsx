import { motion } from 'framer-motion';
import { Eye, MessageSquare, TrendingUp } from 'lucide-react';

import { content } from '@/content/strings';

const icons = [Eye, MessageSquare, TrendingUp];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export const HowItWorks = () => {
  return (
    <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-16 transition-colors duration-200 dark:from-primary/10 dark:to-accent/10 md:py-24" id="how-it-works">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.3 }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Three simple steps to better coaching and assessment
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-4xl space-y-8"
        >
          {content.landing.howItWorks.map((step, index) => {
            const Icon = icons[index];
            return (
              <motion.div
                key={step.step}
                variants={item}
                className="group flex flex-col items-start gap-6 md:flex-row md:items-center"
              >
                {/* Step number and icon */}
                <div className="flex-shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg dark:from-primary/90 dark:to-primary"
                  >
                    <Icon className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
                    <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground shadow">
                      {step.step}
                    </span>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="mb-2 text-2xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {/* Connector line (hidden on last item) */}
                {index < content.landing.howItWorks.length - 1 && (
                  <div className="absolute left-10 hidden h-16 w-0.5 bg-gradient-to-b from-primary/50 to-transparent md:block" aria-hidden="true" />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

