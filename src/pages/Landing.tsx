import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { Features } from '@/components/marketing/Features';
import { Footer } from '@/components/marketing/Footer';
import { Hero } from '@/components/marketing/Hero';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { useAuth } from '@/hooks/useAuth';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading, hasRole, roles } = useAuth();

  // Redirect authenticated users to their dashboard based on role
  useEffect(() => {
    if (!loading && user && roles.length > 0) {
      // Only redirect once roles are loaded (roles.length > 0)
      // Check roles in priority order: admin first, then supervisor, then student
      if (hasRole('admin')) {
        navigate('/admin');
      } else if (hasRole('supervisor')) {
        navigate('/supervisor');
      } else if (hasRole('student')) {
        navigate('/student');
      } else {
        // Default to dashboard if no recognized role detected
        navigate('/dashboard');
      }
    }
  }, [user, loading, roles, hasRole, navigate]);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleLearnMore = () => {
    const element = document.getElementById('how-it-works');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <main id="main-content">
        <Hero onGetStarted={handleGetStarted} onLearnMore={handleLearnMore} />
        <Features />
        <HowItWorks />
      </main>

      <Footer />
    </div>
  );
};

export default Landing;

