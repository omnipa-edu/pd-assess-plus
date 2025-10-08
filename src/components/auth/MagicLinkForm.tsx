import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import { content } from '@/content/strings';

interface MagicLinkFormProps {
  onSendMagicLink: (email: string) => Promise<{ error: any }>;
}

export const MagicLinkForm = ({ onSendMagicLink }: MagicLinkFormProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await onSendMagicLink(email);
    
    setLoading(false);
    if (!error) {
      setSent(true);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    await onSendMagicLink(email);
    setLoading(false);
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mb-4 inline-flex"
        >
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-8 w-8 text-green-600" aria-hidden="true" />
          </div>
        </motion.div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {content.auth.magicLink.confirmation}
        </h3>
        <p className="text-muted-foreground mb-6">
          {content.auth.magicLink.confirmationDesc}
        </p>
        
        <Button
          variant="ghost"
          onClick={handleResend}
          disabled={loading}
          className="text-sm"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {content.auth.magicLink.resend}
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="magic-email">{content.auth.emailLabel}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="magic-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
            aria-describedby="magic-email-helper"
            placeholder="you@example.com"
          />
        </div>
        <p id="magic-email-helper" className="text-xs text-muted-foreground">
          {content.auth.magicLink.helper}
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {content.auth.magicLink.button}
      </Button>
    </form>
  );
};

