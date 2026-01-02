# Feedback Evidence Base

## Overview

The Smart Feedback Assistant and Adaptive Coaching Feed (Coaching Corner) features in this platform are explicitly grounded in peer-reviewed literature on verbal feedback and feedback literacy in health professions education. This document outlines the evidence base and how it informs the implementation.

---

## Core Evidence Sources

### 1. Johnson et al. (2016)
**"Identifying educator behaviours for high quality verbal feedback in health professions education"**

**Key Contributions:**
- Defines 18 elements and 25 observable educator behaviors for high-quality, learner-centered verbal feedback after observation
- Emphasizes feedback based on direct observation of specific behaviors
- Promotes dialogic, two-way feedback conversations rather than one-way monologues
- Highlights the importance of:
  - Clarifying the purpose of feedback ("to help you improve")
  - Encouraging interactive discussion
  - Asking learners to share their priorities and self-assessment
  - Focusing comments on specific behaviors that can be changed, not personal traits
  - Helping learners identify 1-2 priority areas and concrete next steps
  - Building a supportive, respectful, psychologically safe environment

**How It Informs Our Implementation:**
- **Smart Feedback Assistant prompts** explicitly instruct the LLM to:
  - Base feedback on directly observed behaviors
  - Clarify target performance and gaps
  - Focus on 1-2 priority areas
  - Invite learner self-assessment and dialogue
  - Use behavior-focused language, not trait judgments
  
- **Coaching Corner content taxonomy** includes tags like:
  - `theme:educator_behaviours` - Content about specific educator behaviors
  - `skill:focus_on_behaviour` - Micro-skills for behavior-based feedback
  - `skill:ask_for_feedback` - Encouraging two-way dialogue

### 2. Tripodi et al. (2021)
**"Twelve tips for developing feedback literacy in health professions learners"**

**Key Contributions:**
- Defines feedback literacy as the ability to: recognise, understand, generate, and act on feedback
- Proposes a four-pillar framework:
  1. **Appreciating feedback** - Understanding its value and purpose (for patient care and professional development)
  2. **Making judgments** - Developing evaluative judgment through self- and peer-assessment and use of exemplars
  3. **Managing affect** - Recognising and regulating emotional responses to feedback
  4. **Taking action** - Closing the loop by planning and enacting changes based on feedback

- Provides 12 practical strategies:
  - Creating psychologically safe environments
  - Shifting to learner agency
  - Using technology to support feedback
  - Starting feedback literacy work early and repeatedly
  - Encouraging self-assessment and evaluative judgment
  - Supporting peer feedback
  - Normalizing emotional responses

**How It Informs Our Implementation:**
- **Smart Feedback Assistant prompts** include:
  - Language that supports feedback literacy development
  - Affect management guidance (constructive, non-personal language)
  - Invitations for learner self-assessment and evaluative judgment
  - Collaborative planning and action-oriented suggestions

- **Coaching Corner content taxonomy** includes tags aligned with the four pillars:
  - `theme:feedback_literacy_appreciation` - Explaining why feedback matters
  - `theme:feedback_literacy_judgement` - Self/peer assessment, exemplars
  - `theme:feedback_literacy_affect` - Managing emotional responses
  - `theme:feedback_literacy_action` - Turning feedback into concrete practice changes

- **Adaptive selection logic** surfaces content based on user behavior:
  - Supervisors with short/vague feedback → content on behavior-focused feedback and dialogue
  - Learners with few WBAs → content on appreciating feedback and seeking it proactively
  - Learners not acting on feedback → content on taking action and planning next steps

---

## Implementation Mapping

### Smart Feedback Assistant

#### LLM Prompt Structure
The system prompt (`supabase/functions/analyze-feedback/index.ts`) explicitly references both articles and includes:

1. **Core Principles Section:**
   - Feedback based on direct observation (Johnson et al.)
   - Learner-centered, dialogic approach (Johnson et al.)
   - Feedback literacy development (Tripodi et al.)
   - Behavior-focused language (both articles)
   - Practical guidelines

2. **User Prompt Instructions:**
   - Ground in observation
   - Clarify target & gap
   - Prioritize (1-2 areas)
   - Invite dialogue
   - Manage affect
   - Support action

#### Output Structure
The assistant provides:
- **Improved feedback** - Rewritten to be behavior-focused, dialogic, and action-oriented
- **Vague phrases** - Identified with behavior-based replacement suggestions
- **Coaching prompts** - Encourage self-assessment and collaborative planning
- **Tone analysis** - Includes feedback literacy/affect guidance

### Adaptive Coaching Feed (Coaching Corner)

#### Content Taxonomy
Content items can be tagged with evidence-based themes:

**Educator Behaviours (Johnson et al.):**
- `theme:educator_behaviours` - General educator behavior guidance
- `skill:focus_on_behaviour` - Behavior-based feedback skills
- `skill:ask_for_feedback` - Encouraging dialogue

**Feedback Literacy Pillars (Tripodi et al.):**
- `theme:feedback_literacy_appreciation` - Understanding feedback's value
- `theme:feedback_literacy_judgement` - Self/peer assessment, evaluative judgment
- `theme:feedback_literacy_affect` - Managing emotional responses
- `theme:feedback_literacy_action` - Taking action on feedback

**Additional Skills:**
- `skill:plan_next_steps` - Collaborative planning
- `skill:seek_feedback` - Proactive feedback-seeking

#### Selection Logic
The adaptive engine (`src/lib/adaptive-coaching.ts`) analyzes user activity and surfaces relevant content:

- **Supervisors with short/vague feedback** → `theme:educator_behaviours`, `skill:focus_on_behaviour`
- **Supervisors lacking dialogue** → `theme:feedback_literacy_judgement`, `skill:ask_for_feedback`
- **Learners with few WBAs** → `theme:feedback_literacy_appreciation`, `skill:seek_feedback`
- **Learners not acting on feedback** → `theme:feedback_literacy_action`, `skill:plan_next_steps`

#### UI Copy
- **Learner-facing:** "These tips are designed to help you understand, use, and act on feedback throughout your training."
- **Supervisor-facing:** "Today's coaching tip focuses on high-impact feedback behaviours that support learner autonomy and improvement."

---

## Evidence Traceability

### Smart Feedback Assistant Features

| Feature | Evidence Source | Implementation Location |
|---------|----------------|------------------------|
| Behavior-based feedback | Johnson et al. (2016) | `analyze-feedback/index.ts` - system prompt |
| Dialogic language | Johnson et al. (2016) | `analyze-feedback/index.ts` - user prompt |
| 1-2 priority focus | Johnson et al. (2016) | `analyze-feedback/index.ts` - user prompt |
| Vague phrase detection | Johnson et al. (2016) | `analyze-feedback/index.ts` - output structure |
| Self-assessment prompts | Tripodi et al. (2021) | `analyze-feedback/index.ts` - coaching prompts |
| Affect management | Tripodi et al. (2021) | `analyze-feedback/index.ts` - tone analysis |
| Action-oriented suggestions | Tripodi et al. (2021) | `analyze-feedback/index.ts` - improved feedback |

### Coaching Corner Features

| Feature | Evidence Source | Implementation Location |
|---------|----------------|------------------------|
| Content taxonomy | Both articles | Tag system in `coaching_corner` table |
| Adaptive selection | Both articles | `src/lib/adaptive-coaching.ts` - `analyzeActivityForTags()` |
| Role-specific content | Both articles | `src/components/coaching/CoachingCornerCard.tsx` |
| Evidence-based UI copy | Both articles | `src/content/strings.ts` - coaching section |

---

## Statement of Evidence Alignment

This implementation is informed by peer-reviewed literature on verbal feedback and feedback literacy in health professions education. Specifically:

1. **Johnson et al. (2016)** provides the foundation for educator behaviors that promote high-quality, learner-centered feedback. Our Smart Feedback Assistant prompts and Coaching Corner content explicitly encourage these behaviors.

2. **Tripodi et al. (2021)** provides the framework for developing feedback literacy in learners. Our system supports all four pillars (appreciating feedback, making judgments, managing affect, taking action) through both the Smart Feedback Assistant and adaptive Coaching Corner content.

The features are designed to:
- Encourage learner-centered, dialogic feedback rather than one-way monologues
- Promote specific educator behaviors (observation-based, behavior-focused, priority-focused)
- Develop feedback literacy in learners and supervisors
- Support emotional regulation and collaborative action planning

All LLM prompts, UI copy, and content selection logic have been revised to align with these evidence-based principles.

---

## References

1. Johnson, C. E., Keating, J. L., Boud, D. J., Dalton, M., Kiegaldie, D., Hay, M., ... & Molloy, E. K. (2016). Identifying educator behaviours for high quality verbal feedback in health professions education: literature review and expert refinement. *BMC Medical Education*, 16(1), 1-11.

2. Tripodi, N., Feehan, J., Wospil, R., & Vaughn, S. (2021). Twelve tips for developing feedback literacy in health professions learners. *Medical Teacher*, 43(12), 1371-1376.

---

## Maintenance Notes

- When updating LLM prompts, ensure they continue to reference these core principles
- When adding new Coaching Corner content, consider tagging with evidence-based themes
- When modifying selection logic, verify alignment with evidence-based recommendations
- This document should be updated if new evidence sources are incorporated

