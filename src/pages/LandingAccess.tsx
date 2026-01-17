import { useState } from 'react';

import { Loader2 } from 'lucide-react';

import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardGridSkeleton } from '@/components/ui/skeleton-loaders';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

import Landing from './Landing';

const LandingAccess = () => {
  const { user, loading, signIn } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <DashboardGridSkeleton cards={1} />
      </div>
    );
  }

  if (user) {
    return <Landing />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      toast({
        title: 'Missing credentials',
        description: 'Enter your email and password to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(formData.email, formData.password);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message || 'Unable to sign in. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Signed in',
      description: 'You can now access the landing page.',
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 transition-colors duration-200 dark:to-primary/10">
      <Card className="w-full max-w-md shadow-xl transition-shadow duration-200 dark:shadow-2xl dark:shadow-primary/5">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in to continue</CardTitle>
          <CardDescription>
            This page is limited to authorized users until launch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="landing-email">Email</Label>
              <Input
                id="landing-email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landing-password">Password</Label>
              <PasswordInput
                id="landing-password"
                value={formData.password}
                onChange={(value) => setFormData({ ...formData, password: value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandingAccess;
