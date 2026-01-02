import { useState } from 'react';

import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { resetPasswordForEmail } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(emailValue)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);

    const { error } = await resetPasswordForEmail(email);
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email. Please try again.',
        variant: 'destructive'
      });
      setLoading(false);
    } else {
      // Always show success message (security: don't reveal if email exists)
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Check your email</CardTitle>
              <CardDescription className="mt-2">
                If an account exists for this email, we've sent password reset instructions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                <p className="mb-2 font-medium text-foreground">What to do next:</p>
                <ol className="list-inside list-decimal space-y-1">
                  <li>Check your inbox for an email from us</li>
                  <li>Click the link in the email</li>
                  <li>Follow the instructions to set a new password</li>
                </ol>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Reset your password</CardTitle>
            <CardDescription>
              Enter the email associated with your account to receive reset instructions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  onBlur={() => validateEmail(email)}
                  required
                  aria-describedby="reset-email-helper reset-email-error"
                  aria-invalid={!!emailError}
                  className={emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  placeholder="you@example.com"
                />
                <p id="reset-email-helper" className="text-xs text-muted-foreground">
                  We'll send reset instructions to this email address
                </p>
                {emailError && (
                  <p id="reset-email-error" className="text-xs text-red-500" role="alert">
                    {emailError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!loading && <Mail className="mr-2 h-4 w-4" />}
                Send reset link
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/auth')}
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;

