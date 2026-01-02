import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const UpdatePassword = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if user has a valid session (from password reset link)
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setHasValidSession(true);
        } else {
          // No session - redirect to reset password page
          toast({
            title: 'Invalid or expired link',
            description: 'This reset link is invalid or has expired. Please request a new password reset email.',
            variant: 'destructive',
            duration: 5000
          });
          setTimeout(() => navigate('/auth/reset-password'), 2000);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        toast({
          title: 'Error',
          description: 'Failed to verify reset link. Please request a new password reset email.',
          variant: 'destructive'
        });
        setTimeout(() => navigate('/auth/reset-password'), 2000);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [navigate, toast]);

  const validatePassword = (passwordValue: string): boolean => {
    if (!passwordValue) {
      setPasswordError('Password is required');
      return false;
    }
    if (passwordValue.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmValue: string): boolean => {
    if (!confirmValue) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (confirmValue !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(confirmPassword);
    
    if (!isPasswordValid || !isConfirmValid) {
      return;
    }

    setLoading(true);

    const { error } = await updatePassword(password);
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password. Please try again.',
        variant: 'destructive'
      });
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      
      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasValidSession) {
    return null; // Will redirect
  }

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
              <CardTitle className="text-2xl">Password updated!</CardTitle>
              <CardDescription className="mt-2">
                Your password has been successfully updated. You can now sign in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                Go to sign in
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Redirecting to sign in page...
              </p>
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
            <CardTitle className="text-2xl">Set new password</CardTitle>
            <CardDescription>
              Enter your new password below. Make sure it's at least 8 characters long.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                      // Re-validate confirm password if it's been entered
                      if (confirmPassword) {
                        validateConfirmPassword(confirmPassword);
                      }
                    }}
                    onBlur={() => validatePassword(password)}
                    required
                    aria-describedby="new-password-helper new-password-error"
                    aria-invalid={!!passwordError}
                    className={`pl-10 ${passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    placeholder="Enter new password"
                  />
                </div>
                <p id="new-password-helper" className="text-xs text-muted-foreground">
                  Must be at least 8 characters long
                </p>
                {passwordError && (
                  <p id="new-password-error" className="text-xs text-red-500" role="alert">
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmPasswordError('');
                    }}
                    onBlur={() => validateConfirmPassword(confirmPassword)}
                    required
                    aria-describedby="confirm-password-helper confirm-password-error"
                    aria-invalid={!!confirmPasswordError}
                    className={`pl-10 ${confirmPasswordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    placeholder="Confirm new password"
                  />
                </div>
                {confirmPasswordError && (
                  <p id="confirm-password-error" className="text-xs text-red-500" role="alert">
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!loading && <Lock className="mr-2 h-4 w-4" />}
                Update password
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

export default UpdatePassword;

