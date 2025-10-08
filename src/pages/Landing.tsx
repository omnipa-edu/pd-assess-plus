import { useNavigate } from 'react-router-dom';
import { Hero } from '@/components/marketing/Hero';
import { Features } from '@/components/marketing/Features';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { Footer } from '@/components/marketing/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/student'); // or role-based routing
    }
  }, [user, loading, navigate]);

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
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
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

