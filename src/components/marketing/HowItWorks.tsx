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
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 transition-colors duration-200" id="how-it-works">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to better coaching and assessment
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {content.landing.howItWorks.map((step, index) => {
            const Icon = icons[index];
            return (
              <motion.div
                key={step.step}
                variants={item}
                className="flex flex-col md:flex-row items-start md:items-center gap-6 group"
              >
                {/* Step number and icon */}
                <div className="flex-shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 dark:from-primary/90 dark:to-primary shadow-lg flex items-center justify-center"
                  >
                    <Icon className="w-8 h-8 text-primary-foreground" aria-hidden="true" />
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold shadow">
                      {step.step}
                    </span>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    {step.description}
                  </p>
                </div>

                {/* Connector line (hidden on last item) */}
                {index < content.landing.howItWorks.length - 1 && (
                  <div className="hidden md:block absolute left-10 h-16 w-0.5 bg-gradient-to-b from-primary/50 to-transparent" aria-hidden="true" />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

