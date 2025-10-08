import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { MagicLinkForm } from '@/components/auth/MagicLinkForm';
import { content } from '@/content/strings';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, signInWithMagicLink } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', fullName: '' });
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError(content.auth.errors.emailRequired);
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError(content.auth.errors.invalidEmail);
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError(content.auth.errors.passwordRequired);
      return false;
    }
    if (password.length < 8) {
      setPasswordError(content.auth.errors.weakPassword);
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEmailValid = validateEmail(loginData.email);
    const isPasswordValid = validatePassword(loginData.password);
    
    if (!isEmailValid || !isPasswordValid) {
      // Shake animation handled by framer motion
      return;
    }

    setLoading(true);

    const { error } = await signIn(loginData.email, loginData.password);
    
    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message || content.auth.errors.generic,
        variant: 'destructive'
      });
      setLoading(false);
    } else {
      toast({ 
        title: 'Welcome back!',
        description: 'You have successfully signed in.'
      });
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEmailValid = validateEmail(signupData.email);
    const isPasswordValid = validatePassword(signupData.password);
    
    if (!isEmailValid || !isPasswordValid || !signupData.fullName) {
      return;
    }

    setLoading(true);

    const { error } = await signUp(signupData.email, signupData.password, signupData.fullName);
    
    if (error) {
      toast({
        title: 'Sign up failed',
        description: error.message || content.auth.errors.generic,
        variant: 'destructive'
      });
      setLoading(false);
    } else {
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
        duration: 5000
      });
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast({
        title: 'Google sign-in failed',
        description: error.message || content.auth.errors.generic,
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleMagicLink = async (email: string) => {
    const { error } = await signInWithMagicLink(email);
    
    if (error) {
      toast({
        title: 'Failed to send magic link',
        description: error.message || content.auth.errors.generic,
        variant: 'destructive'
      });
    } else {
      toast({
        title: content.auth.magicLink.success,
        description: 'Click the link in your email to sign in.',
        duration: 5000
      });
    }
    
    return { error };
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 dark:to-primary/10 p-4 transition-colors duration-200">
      {/* Skip to main content */}
      <a
        href="#auth-card"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to sign in
      </a>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card id="auth-card" className="shadow-xl dark:shadow-2xl dark:shadow-primary/5 transition-shadow duration-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {content.auth.title}
            </CardTitle>
            <CardDescription>
              {content.auth.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">{content.auth.tabs.signIn}</TabsTrigger>
                <TabsTrigger value="signup">{content.auth.tabs.createAccount}</TabsTrigger>
              </TabsList>
              
              {/* Sign In Tab */}
              <TabsContent value="login">
                {showMagicLink ? (
                  <div className="space-y-4">
                    <MagicLinkForm onSendMagicLink={handleMagicLink} />
                    <Button
                      variant="ghost"
                      onClick={() => setShowMagicLink(false)}
                      className="w-full text-sm"
                    >
                      Back to password sign in
                    </Button>
                  </div>
                ) : (
                  <motion.form
                    onSubmit={handleLogin}
                    className="space-y-4"
                    animate={emailError || passwordError ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{content.auth.emailLabel}</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => {
                          setLoginData({ ...loginData, email: e.target.value });
                          setEmailError('');
                        }}
                        onBlur={() => validateEmail(loginData.email)}
                        required
                        aria-describedby="login-email-helper login-email-error"
                        aria-invalid={!!emailError}
                        className={emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      />
                      <p id="login-email-helper" className="text-xs text-muted-foreground">
                        {content.auth.emailHelper}
                      </p>
                      {emailError && (
                        <p id="login-email-error" className="text-xs text-red-500" role="alert">
                          {emailError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">{content.auth.passwordLabel}</Label>
                      <PasswordInput
                        id="login-password"
                        value={loginData.password}
                        onChange={(value) => {
                          setLoginData({ ...loginData, password: value });
                          setPasswordError('');
                        }}
                        required
                        aria-describedby="login-password-error"
                      />
                      {passwordError && (
                        <p id="login-password-error" className="text-xs text-red-500" role="alert">
                          {passwordError}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full transition-all duration-200 hover:scale-105"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {content.auth.buttons.signIn}
                    </Button>

                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowMagicLink(true)}
                      className="w-full text-sm"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Sign in with magic link
                    </Button>
                  </motion.form>
                )}
                
                {!showMagicLink && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          {content.auth.divider}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full transition-all duration-200 hover:scale-105" 
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      {content.auth.oauth.google}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {content.auth.oauth.helper}
                    </p>
                  </>
                )}
              </TabsContent>
              
              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <motion.form
                  onSubmit={handleSignup}
                  className="space-y-4"
                  animate={emailError || passwordError ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{content.auth.fullNameLabel}</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      required
                      aria-describedby="signup-name-helper"
                    />
                    <p id="signup-name-helper" className="text-xs text-muted-foreground">
                      {content.auth.fullNameHelper}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{content.auth.emailLabel}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => {
                        setSignupData({ ...signupData, email: e.target.value });
                        setEmailError('');
                      }}
                      onBlur={() => validateEmail(signupData.email)}
                      required
                      aria-describedby="signup-email-helper signup-email-error"
                      aria-invalid={!!emailError}
                      className={emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    <p id="signup-email-helper" className="text-xs text-muted-foreground">
                      {content.auth.emailHelper}
                    </p>
                    {emailError && (
                      <p id="signup-email-error" className="text-xs text-red-500" role="alert">
                        {emailError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{content.auth.passwordLabel}</Label>
                    <PasswordInput
                      id="signup-password"
                      value={signupData.password}
                      onChange={(value) => {
                        setSignupData({ ...signupData, password: value });
                        setPasswordError('');
                      }}
                      showStrength
                      required
                      aria-describedby="signup-password-helper signup-password-error"
                    />
                    <p id="signup-password-helper" className="text-xs text-muted-foreground">
                      {content.auth.passwordHelper}
                    </p>
                    {passwordError && (
                      <p id="signup-password-error" className="text-xs text-red-500" role="alert">
                        {passwordError}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full transition-all duration-200 hover:scale-105"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {content.auth.buttons.createAccount}
                  </Button>
                </motion.form>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      {content.auth.divider}
                    </span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full transition-all duration-200 hover:scale-105" 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {content.auth.oauth.google}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {content.auth.oauth.helper}
                </p>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-center text-muted-foreground">
                {content.auth.footer}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
