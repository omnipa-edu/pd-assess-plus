import { motion } from 'framer-motion';
import { Mic, TrendingUp, Download } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { content } from '@/content/strings';

const iconMap = {
  mic: Mic,
  chart: TrendingUp,
  download: Download,
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const Features = () => {
  return (
    <section className="bg-background py-16 transition-colors duration-200 md:py-24" id="features">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.3 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Everything you need
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Built for busy healthcare educators who need to capture, coach, and track progress on the go.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3"
        >
          {content.landing.features.map((feature, index) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <motion.div key={index} variants={item}>
                <Card className="group h-full border-2 transition-all duration-200 hover:border-primary/50 hover:shadow-lg dark:hover:border-primary/60 dark:hover:shadow-primary/10">
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary/10 p-3 transition-colors duration-200 group-hover:bg-primary/20 dark:bg-primary/20 dark:group-hover:bg-primary/30">
                      <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

