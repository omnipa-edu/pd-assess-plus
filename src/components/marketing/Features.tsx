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
    <section className="py-16 md:py-24 bg-background transition-colors duration-200" id="features">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Everything you need
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for busy healthcare educators who need to capture, coach, and track progress on the go.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {content.landing.features.map((feature, index) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <motion.div key={index} variants={item}>
                <Card className="h-full border-2 hover:border-primary/50 dark:hover:border-primary/60 transition-all duration-200 hover:shadow-lg dark:hover:shadow-primary/10 group">
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 p-3 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors duration-200">
                      <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
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

