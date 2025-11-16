/**
 * Coaching Corner Seed Data
 * Pre-defined content for learners and supervisors
 */

export interface SeedCoachingItem {
  id: string;
  audience: 'learners' | 'supervisors' | 'all';
  kind: 'text' | 'video';
  content_type: 'text' | 'youtube' | 'instagram';
  title: string;
  body: string;
  video_url?: string;
}

export const STUDENT_COACHING_FEED: SeedCoachingItem[] = [
  {
    id: 'student-1-feedback-basics',
    audience: 'learners',
    kind: 'text',
    content_type: 'text',
    title: 'Getting the Most From Feedback',
    body: 'Great clinicians are made through practice, not perfection. When receiving feedback, try this simple reflection prompt: **What is one thing I learned, and what is one thing I will try next time?** Small, consistent adjustments lead to big improvements over time.',
  },
  {
    id: 'student-2-ask-for-feedback',
    audience: 'learners',
    kind: 'text',
    content_type: 'text',
    title: 'Asking for Better Feedback',
    body: 'You can shape the feedback you get. Before an encounter, tell your supervisor: **Today I would like specific feedback on ____.** This turns a routine case into a targeted learning opportunity.',
  },
  {
    id: 'student-3-turn-feedback-into-action',
    audience: 'learners',
    kind: 'text',
    content_type: 'text',
    title: 'Turn Feedback Into Action',
    body: 'Convert feedback into a micro-goal you can accomplish within a week. Example: **I will practice introducing the care plan in a single clear sentence.** Micro-goals build clinical confidence and entrustability.',
  },
  {
    id: 'student-4-oscore-trends',
    audience: 'learners',
    kind: 'text',
    content_type: 'text',
    title: 'Understanding Your O-SCORE',
    body: 'A single O-SCORE does not define your ability. Look for **trends**, not moments. Consistency, curiosity, and improvement matter more than any single number.',
  },
  {
    id: 'student-5-communicate-clinical-thinking',
    audience: 'learners',
    kind: 'text',
    content_type: 'text',
    title: 'Communicating Your Clinical Reasoning',
    body: 'A helpful habit: summarize your thinking out loud. Try: **My top concern is ___. I ruled out ___ because ___. Next, I plan to ___.** Clear reasoning often leads to higher perceived readiness.',
  },
  {
    id: 'student-6-managing-uncertainty',
    audience: 'learners',
    kind: 'text',
    content_type: 'text',
    title: 'Managing Uncertainty Safely',
    body: 'Uncertainty is normal in clinical work. Safe clinicians acknowledge it early: **I am uncertain about ___, so I want to check ___ before deciding.** This signals professionalism, not weakness.',
  },
  {
    id: 'student-7-self-assessment',
    audience: 'learners',
    kind: 'text',
    content_type: 'text',
    title: 'Self-Assessment That Helps You Grow',
    body: 'Before asking for feedback, write down: **what went well, what was difficult, and what I would do differently.** Self-evaluation makes supervisor feedback more specific and practical.',
  },
  {
    id: 'student-8-confidence',
    audience: 'learners',
    kind: 'text',
    content_type: 'text',
    title: 'Building Clinical Confidence',
    body: 'Confidence grows when effort aligns with purpose. Ask yourself: **What skill am I consciously improving this week?** Intentional practice accelerates readiness.',
  },
  {
    id: 'student-video-1-reflective-practice',
    audience: 'learners',
    kind: 'video',
    content_type: 'youtube',
    title: 'Reflective Practice for Medical Students',
    body: 'Reflective practice helps you turn everyday clinical experiences into lasting learning. As you watch, note one idea you can try in your next shift.',
    video_url: 'https://www.youtube.com/watch?v=tKveyKcRdlk',
  },
  {
    id: 'student-video-2-intro-clinical-reasoning',
    audience: 'learners',
    kind: 'video',
    content_type: 'youtube',
    title: 'Introduction to Clinical Reasoning',
    body: 'Clinical reasoning is the bridge between data and decisions. This video introduces core concepts you can practice on every patient.',
    video_url: 'https://www.youtube.com/watch?v=acJspBatjJE',
  },
  {
    id: 'student-video-3-clinical-decision-making',
    audience: 'learners',
    kind: 'video',
    content_type: 'youtube',
    title: 'Clinical Decision Making – Webinar',
    body: 'This session explores how to structure your decision making in complex clinical situations. Pick one strategy to test during your next rotation.',
    video_url: 'https://www.youtube.com/watch?v=55mEy2u0Jws',
  },
  {
    id: 'student-video-4-reflective-practice-general',
    audience: 'learners',
    kind: 'video',
    content_type: 'youtube',
    title: 'Reflective Practice – General Overview',
    body: 'A short overview of reflective practice: what it is, why it matters, and how to integrate it into your daily work.',
    video_url: 'https://www.youtube.com/watch?v=pdlyKZhJbts',
  },
];

export const SUPERVISOR_COACHING_FEED: SeedCoachingItem[] = [
  {
    id: 'supervisor-1-60-second-feedback',
    audience: 'supervisors',
    kind: 'text',
    content_type: 'text',
    title: 'High-Impact Feedback in Under 60 Seconds',
    body: 'Use a rapid RX-OCR approach: **Rapport** – ask how they felt; **Expectations** – restate what readiness looks like; **Observe** – name 1–2 concrete behaviors; **Coach** – offer one specific suggestion; **Record** – capture it in a brief WBA.',
  },
  {
    id: 'supervisor-2-one-specific-suggestion',
    audience: 'supervisors',
    kind: 'text',
    content_type: 'text',
    title: 'The Power of One Specific Suggestion',
    body: 'Learners remember one clear suggestion better than ten vague comments. Try: **If you change only one thing next time, let it be ___.** This keeps feedback focused and doable.',
  },
  {
    id: 'supervisor-3-psychological-safety',
    audience: 'supervisors',
    kind: 'text',
    content_type: 'text',
    title: 'Creating Psychological Safety for Feedback',
    body: 'Feedback lands best when learners feel safe. Use openers like: **Let us look at this together** or **This is something every clinician works on.** This normalizes growth rather than failure.',
  },
  {
    id: 'supervisor-4-entrustment-calibration',
    audience: 'supervisors',
    kind: 'text',
    content_type: 'text',
    title: 'Calibrating Entrustment',
    body: 'Before choosing an O-SCORE, ask yourself: **What would I need to do if this learner repeated this case tomorrow?** Your required level of involvement translates directly into their entrustment level.',
  },
  {
    id: 'supervisor-5-coaching-reasoning',
    audience: 'supervisors',
    kind: 'text',
    content_type: 'text',
    title: 'Coaching Clinical Reasoning',
    body: 'Instead of only asking for the diagnosis, try: **Walk me through your thinking.** This reveals hidden strengths and blind spots you can actually coach.',
  },
  {
    id: 'supervisor-6-struggling-learner',
    audience: 'supervisors',
    kind: 'text',
    content_type: 'text',
    title: 'Supporting a Struggling Learner',
    body: 'Shift from judgment to partnership: **Let us pick one skill to improve this week and revisit it after your next case.** Small, targeted plans often work better than broad criticism.',
  },
  {
    id: 'supervisor-7-close-the-loop',
    audience: 'supervisors',
    kind: 'text',
    content_type: 'text',
    title: 'Closing the Feedback Loop',
    body: 'Connect today\'s observation to prior feedback: **Last time we talked about ___. I will watch for that again today.** This shows you remember and care about the learner\'s growth.',
  },
  {
    id: 'supervisor-video-1-effective-feedback',
    audience: 'supervisors',
    kind: 'video',
    content_type: 'youtube',
    title: 'How to Give Effective Feedback in Academic Medicine',
    body: 'A concise overview of how to give clear, actionable feedback in academic clinical settings. As you watch, note one phrase you might adopt in your own feedback.',
    video_url: 'https://www.youtube.com/watch?v=O5gFtgi_pss',
  },
  {
    id: 'supervisor-video-2-strategies-feedback-med-ed',
    audience: 'supervisors',
    kind: 'video',
    content_type: 'youtube',
    title: 'Strategies for Providing Effective Feedback in Medical Education',
    body: 'A deeper dive into feedback strategies that promote growth, not defensiveness. Consider how one strategy aligns with your own teaching style.',
    video_url: 'https://www.youtube.com/watch?v=UwogwsvBbWs',
  },
  {
    id: 'supervisor-video-3-culture-of-feedback',
    audience: 'supervisors',
    kind: 'video',
    content_type: 'youtube',
    title: 'Creating a Culture of Feedback: Medical Educators as Coaches',
    body: 'This talk explores how feedback and coaching can shape learning culture. Reflect on one small change you could make in your program to support a coaching mindset.',
    video_url: 'https://www.youtube.com/watch?v=zCceJ8BtKno',
  },
  {
    id: 'supervisor-video-4-coaching-culture',
    audience: 'supervisors',
    kind: 'video',
    content_type: 'youtube',
    title: 'Towards a Coaching Culture in Medical Education',
    body: 'A practical look at how to move from evaluation-only to a true coaching culture in training programs.',
    video_url: 'https://www.youtube.com/watch?v=GmxVZHnKGI8',
  },
];

/**
 * Get all seed items for a given audience
 */
export function getSeedItemsForAudience(audience: 'learners' | 'supervisors'): SeedCoachingItem[] {
  return audience === 'learners' ? STUDENT_COACHING_FEED : SUPERVISOR_COACHING_FEED;
}

