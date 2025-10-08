// All copy and content strings for the application
export const content = {
  landing: {
    hero: {
      title: "Track Progress. Coach Better. Grow Faster.",
      subtitle: "A simple, mobile-friendly way to capture observations, give feedback, and see trends at a glance.",
      ctaPrimary: "Get started",
      ctaSecondary: "Learn more"
    },
    features: [
      {
        title: "Capture in seconds",
        description: "Voice-to-text and autosave keep you focused on coaching.",
        icon: "mic"
      },
      {
        title: "See meaningful trends",
        description: "Simple charts turn observations into progress.",
        icon: "chart"
      },
      {
        title: "Export & share",
        description: "One-click CSV, Excel, or PDF for reports and portfolios.",
        icon: "download"
      }
    ],
    howItWorks: [
      {
        step: 1,
        title: "Observe",
        description: "Jot a quick note or speak it aloud. We'll handle the rest."
      },
      {
        step: 2,
        title: "Coach",
        description: "Turn notes into clear, next-step feedback."
      },
      {
        step: 3,
        title: "Grow",
        description: "Track progress and celebrate milestones."
      }
    ],
    socialProof: {
      heading: "Trusted by healthcare educators",
      logos: [] // Placeholder for logos
    },
    footer: {
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Contact Us", href: "/contact" }
      ],
      copyright: "© 2025 WBA Tracker. All rights reserved."
    }
  },
  auth: {
    title: "Welcome to WBA Tracker",
    subtitle: "Sign in to access your assessments and feedback",
    tabs: {
      signIn: "Sign In",
      createAccount: "Create Account"
    },
    emailLabel: "Email",
    emailHelper: "We'll only use this to sign you in.",
    passwordLabel: "Password",
    passwordHelper: "8+ characters. Use a phrase you'll remember.",
    passwordStrength: {
      weak: "Weak password",
      fair: "Fair password",
      good: "Good password",
      strong: "Strong password"
    },
    fullNameLabel: "Full Name",
    fullNameHelper: "How should we address you?",
    magicLink: {
      button: "Send magic link",
      helper: "We'll send a secure link to your email. No password needed.",
      confirmation: "Check your email",
      confirmationDesc: "We've sent a secure sign-in link to your email address.",
      resend: "Didn't receive it? Send again",
      success: "Magic link sent! Check your email."
    },
    oauth: {
      google: "Continue with Google",
      helper: "We'll request your basic profile to sign you in."
    },
    buttons: {
      signIn: "Sign in",
      createAccount: "Create account",
      showPassword: "Show password",
      hidePassword: "Hide password"
    },
    divider: "Or continue with",
    footer: "By continuing, you agree to our Terms of Service and Privacy Policy.",
    errors: {
      invalidEmail: "Please enter a valid email address.",
      weakPassword: "Password must be at least 8 characters long.",
      emailRequired: "Email is required.",
      passwordRequired: "Password is required.",
      nameRequired: "Full name is required.",
      linkExpired: "That link has expired. Try sending a new one.",
      generic: "Something went wrong. Please try again."
    }
  },
  theme: {
    toggleLabel: 'Toggle theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    systemDescription: 'Use system preference'
  }
} as const;

