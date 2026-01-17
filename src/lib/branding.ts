/**
 * Branding Constants
 * 
 * Centralized branding configuration for easy updates and reversibility.
 * To revert: Change values back to "Adaptive Competency" and related text.
 */

export const branding = {
  // Application name
  appName: "Verity Clinical",
  
  // Primary tagline (appears below main title)
  tagline: "Truthful insight. Trustworthy growth.",
  
  // One-sentence description (appears above the fold)
  description: "Verity Clinical is a clinical intelligence platform that transforms observation, feedback, and assessment data into actionable insight—for learners, supervisors, and programs.",
  
  // Legacy values (for easy reversion)
  legacy: {
    appName: "Adaptive Competency",
    tagline: "From observation to readiness.",
    description: "Transform observations and feedback into adaptive learning trajectories—powered by data, coaching, and evidence.",
  }
} as const;
