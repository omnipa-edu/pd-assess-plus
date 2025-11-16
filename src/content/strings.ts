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
  },
  onboarding: {
    student: {
      title: "Welcome to WBA Tracker!",
      subtitle: "Let's get you started with tracking your progress",
      tasks: [
        {
          id: 'complete_profile',
          title: 'Complete your profile',
          description: 'Add your program and training year',
          cta: 'Update profile'
        },
        {
          id: 'view_first_assessment',
          title: 'Explore your assessments',
          description: 'See how supervisors provide feedback',
          cta: 'View assessments'
        },
        {
          id: 'understand_oscore',
          title: 'Learn about O-scores',
          description: 'Understand how progress is measured',
          cta: 'Learn more'
        }
      ]
    },
    supervisor: {
      title: "Welcome, Supervisor!",
      subtitle: "Everything you need to provide meaningful feedback",
      tasks: [
        {
          id: 'complete_profile',
          title: 'Set up your profile',
          description: 'Add your specialty and institution',
          cta: 'Update profile'
        },
        {
          id: 'create_first_assessment',
          title: 'Create your first assessment',
          description: 'Try our voice-to-text or quick forms',
          cta: 'Start observing'
        },
        {
          id: 'add_student',
          title: 'Connect with learners',
          description: 'Add students to start tracking progress',
          cta: 'Add students'
        },
        {
          id: 'explore_analytics',
          title: 'View analytics dashboard',
          description: 'See trends and export reports',
          cta: 'View analytics'
        }
      ]
    },
    admin: {
      title: "Admin Console Ready",
      subtitle: "Manage your institution's assessment platform",
      tasks: [
        {
          id: 'configure_institution',
          title: 'Set up your institution',
          description: 'Add departments and specialties',
          cta: 'Configure'
        },
        {
          id: 'import_epas',
          title: 'Import EPA frameworks',
          description: 'Upload your custom competency frameworks',
          cta: 'Import EPAs'
        },
        {
          id: 'manage_users',
          title: 'Invite team members',
          description: 'Add supervisors and assign roles',
          cta: 'Manage users'
        },
        {
          id: 'setup_promo_codes',
          title: 'Create promo codes',
          description: 'Set up free access for your institution',
          cta: 'Setup codes'
        }
      ]
    },
    common: {
      dismiss: 'Dismiss',
      showAgain: 'Show checklist',
      progressLabel: '{completed} of {total} completed',
      completedBadge: 'Done'
    }
  },
  emptyStates: {
    assessments: {
      student: {
        title: "No assessments yet",
        description: "Your supervisors will add observations here as you progress through training",
        primaryCta: "Learn about assessments",
        secondaryCta: "View demo"
      },
      supervisor: {
        title: "Ready to start observing?",
        description: "Create your first assessment using voice-to-text or quick forms",
        primaryCta: "New assessment",
        secondaryCta: "View templates"
      }
    },
    students: {
      title: "No learners yet",
      description: "Add students to start tracking their progress and providing feedback",
      primaryCta: "Add student",
      secondaryCta: "Import from CSV"
    },
    analytics: {
      title: "No data to display",
      description: "Analytics will appear once assessments are created",
      primaryCta: "Create assessment",
      secondaryCta: null
    },
    departments: {
      title: "Set up your first department",
      description: "Organize users and specialties by creating departments",
      primaryCta: "Add department",
      secondaryCta: "Import departments"
    },
    epas: {
      title: "No EPA frameworks loaded",
      description: "Import your custom competency frameworks to get started",
      primaryCta: "Import EPAs",
      secondaryCta: "Learn about EPAs"
    },
    search: {
      title: "No results found",
      description: "Try adjusting your search terms or filters",
      primaryCta: "Clear filters",
      secondaryCta: null
    }
  },
  loading: {
    dashboard: "Loading your dashboard...",
    assessments: "Loading assessments...",
    students: "Loading learners...",
    analytics: "Calculating analytics...",
    profile: "Loading profile...",
    generic: "Loading..."
  },
  coaching: {
    title: "Coaching Corner",
    subtitle: "Tips and inspiration for your journey",
    empty: "No coaching content yet. Check back soon!",
    pinned: "Pinned",
    viewAll: "View all",
    dismiss: "Dismiss",
    form: {
      title: "Create Coaching Content",
      titleLabel: "Title",
      titlePlaceholder: "Enter a catchy title...",
      contentType: "Content Type",
      contentTypes: {
        text: "Text",
        youtube: "YouTube",
        instagram: "Instagram"
      },
      bodyLabel: "Content",
      bodyPlaceholder: "Write your inspiring message...",
      bodyHelp: "Keep it short and memorable. 1-2 key takeaways work best.",
      videoUrlLabel: "Video URL",
      videoUrlPlaceholder: "Paste YouTube or Instagram URL...",
      videoHelp: "Add a line that tells viewers what to watch for.",
      audienceLabel: "Who can see this?",
      audiences: {
        all: "All users",
        supervisors: "Supervisors only",
        learners: "Learners only"
      },
      startDateLabel: "Start Date",
      endDateLabel: "End Date (optional)",
      pinnedLabel: "Pin as primary",
      pinnedHelp: "Pinned items appear first. Only one item can be pinned at a time.",
      scopeLabel: "Limit to specific supervisors (optional)",
      save: "Publish",
      cancel: "Cancel",
      update: "Update",
      errors: {
        invalidUrl: "Please enter a valid YouTube or Instagram URL",
        titleRequired: "Title is required",
        contentRequired: "Content is required",
        urlRequired: "Video URL is required"
      }
    },
    embed: {
      watchOnYoutube: "Watch on YouTube",
      viewOnInstagram: "View on Instagram",
      loadError: "Unable to load video. Click to watch on site."
    },
    manage: {
      title: "Manage Coaching Corner",
      create: "Create New",
      edit: "Edit",
      delete: "Delete",
      confirm: "Are you sure you want to delete this coaching item?",
      active: "Active",
      scheduled: "Scheduled",
      expired: "Expired"
    }
  }
} as const;

