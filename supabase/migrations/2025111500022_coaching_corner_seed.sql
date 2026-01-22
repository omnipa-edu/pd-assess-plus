-- Migration: Seed Coaching Corner with default content
-- Created: 2025-11-15
-- Purpose: Insert pre-defined coaching content for learners and supervisors

-- Note: This migration requires an admin user to exist.
-- The seed data will be created with role_scope='admin' and audience='learners' or 'supervisors'
-- If no admin exists, you may need to manually set created_by to a valid admin user ID

-- Function to get or create a system admin user for seeding
-- This assumes at least one admin exists. If not, you'll need to manually update created_by
DO $$
DECLARE
  admin_user_id UUID;
  seed_item RECORD;
  student_items JSONB := '[
    {"id": "student-1-feedback-basics", "title": "Getting the Most From Feedback", "body": "Great clinicians are made through practice, not perfection. When receiving feedback, try this simple reflection prompt: **What is one thing I learned, and what is one thing I will try next time?** Small, consistent adjustments lead to big improvements over time.", "content_type": "text"},
    {"id": "student-2-ask-for-feedback", "title": "Asking for Better Feedback", "body": "You can shape the feedback you get. Before an encounter, tell your supervisor: **Today I would like specific feedback on ____.** This turns a routine case into a targeted learning opportunity.", "content_type": "text"},
    {"id": "student-3-turn-feedback-into-action", "title": "Turn Feedback Into Action", "body": "Convert feedback into a micro-goal you can accomplish within a week. Example: **I will practice introducing the care plan in a single clear sentence.** Micro-goals build clinical confidence and entrustability.", "content_type": "text"},
    {"id": "student-4-oscore-trends", "title": "Understanding Your O-SCORE", "body": "A single O-SCORE does not define your ability. Look for **trends**, not moments. Consistency, curiosity, and improvement matter more than any single number.", "content_type": "text"},
    {"id": "student-5-communicate-clinical-thinking", "title": "Communicating Your Clinical Reasoning", "body": "A helpful habit: summarize your thinking out loud. Try: **My top concern is ___. I ruled out ___ because ___. Next, I plan to ___.** Clear reasoning often leads to higher perceived readiness.", "content_type": "text"},
    {"id": "student-6-managing-uncertainty", "title": "Managing Uncertainty Safely", "body": "Uncertainty is normal in clinical work. Safe clinicians acknowledge it early: **I am uncertain about ___, so I want to check ___ before deciding.** This signals professionalism, not weakness.", "content_type": "text"},
    {"id": "student-7-self-assessment", "title": "Self-Assessment That Helps You Grow", "body": "Before asking for feedback, write down: **what went well, what was difficult, and what I would do differently.** Self-evaluation makes supervisor feedback more specific and practical.", "content_type": "text"},
    {"id": "student-8-confidence", "title": "Building Clinical Confidence", "body": "Confidence grows when effort aligns with purpose. Ask yourself: **What skill am I consciously improving this week?** Intentional practice accelerates readiness.", "content_type": "text"},
    {"id": "student-video-1-reflective-practice", "title": "Reflective Practice for Medical Students", "body": "Reflective practice helps you turn everyday clinical experiences into lasting learning. As you watch, note one idea you can try in your next shift.", "content_type": "youtube", "video_url": "https://www.youtube.com/watch?v=tKveyKcRdlk"},
    {"id": "student-video-2-intro-clinical-reasoning", "title": "Introduction to Clinical Reasoning", "body": "Clinical reasoning is the bridge between data and decisions. This video introduces core concepts you can practice on every patient.", "content_type": "youtube", "video_url": "https://www.youtube.com/watch?v=acJspBatjJE"},
    {"id": "student-video-3-clinical-decision-making", "title": "Clinical Decision Making – Webinar", "body": "This session explores how to structure your decision making in complex clinical situations. Pick one strategy to test during your next rotation.", "content_type": "youtube", "video_url": "https://www.youtube.com/watch?v=55mEy2u0Jws"},
    {"id": "student-video-4-reflective-practice-general", "title": "Reflective Practice – General Overview", "body": "A short overview of reflective practice: what it is, why it matters, and how to integrate it into your daily work.", "content_type": "youtube", "video_url": "https://www.youtube.com/watch?v=pdlyKZhJbts"}
  ]'::JSONB;
  
  supervisor_items JSONB := '[
    {"id": "supervisor-1-60-second-feedback", "title": "High-Impact Feedback in Under 60 Seconds", "body": "Use a rapid RX-OCR approach: **Rapport** – ask how they felt; **Expectations** – restate what readiness looks like; **Observe** – name 1–2 concrete behaviors; **Coach** – offer one specific suggestion; **Record** – capture it in a brief WBA.", "content_type": "text"},
    {"id": "supervisor-2-one-specific-suggestion", "title": "The Power of One Specific Suggestion", "body": "Learners remember one clear suggestion better than ten vague comments. Try: **If you change only one thing next time, let it be ___.** This keeps feedback focused and doable.", "content_type": "text"},
    {"id": "supervisor-3-psychological-safety", "title": "Creating Psychological Safety for Feedback", "body": "Feedback lands best when learners feel safe. Use openers like: **Let us look at this together** or **This is something every clinician works on.** This normalizes growth rather than failure.", "content_type": "text"},
    {"id": "supervisor-4-entrustment-calibration", "title": "Calibrating Entrustment", "body": "Before choosing an O-SCORE, ask yourself: **What would I need to do if this learner repeated this case tomorrow?** Your required level of involvement translates directly into their entrustment level.", "content_type": "text"},
    {"id": "supervisor-5-coaching-reasoning", "title": "Coaching Clinical Reasoning", "body": "Instead of only asking for the diagnosis, try: **Walk me through your thinking.** This reveals hidden strengths and blind spots you can actually coach.", "content_type": "text"},
    {"id": "supervisor-6-struggling-learner", "title": "Supporting a Struggling Learner", "body": "Shift from judgment to partnership: **Let us pick one skill to improve this week and revisit it after your next case.** Small, targeted plans often work better than broad criticism.", "content_type": "text"},
    {"id": "supervisor-7-close-the-loop", "title": "Closing the Feedback Loop", "body": "Connect today''s observation to prior feedback: **Last time we talked about ___. I will watch for that again today.** This shows you remember and care about the learner''s growth.", "content_type": "text"},
    {"id": "supervisor-video-1-effective-feedback", "title": "How to Give Effective Feedback in Academic Medicine", "body": "A concise overview of how to give clear, actionable feedback in academic clinical settings. As you watch, note one phrase you might adopt in your own feedback.", "content_type": "youtube", "video_url": "https://www.youtube.com/watch?v=O5gFtgi_pss"},
    {"id": "supervisor-video-2-strategies-feedback-med-ed", "title": "Strategies for Providing Effective Feedback in Medical Education", "body": "A deeper dive into feedback strategies that promote growth, not defensiveness. Consider how one strategy aligns with your own teaching style.", "content_type": "youtube", "video_url": "https://www.youtube.com/watch?v=UwogwsvBbWs"},
    {"id": "supervisor-video-3-culture-of-feedback", "title": "Creating a Culture of Feedback: Medical Educators as Coaches", "body": "This talk explores how feedback and coaching can shape learning culture. Reflect on one small change you could make in your program to support a coaching mindset.", "content_type": "youtube", "video_url": "https://www.youtube.com/watch?v=zCceJ8BtKno"},
    {"id": "supervisor-video-4-coaching-culture", "title": "Towards a Coaching Culture in Medical Education", "body": "A practical look at how to move from evaluation-only to a true coaching culture in training programs.", "content_type": "youtube", "video_url": "https://www.youtube.com/watch?v=GmxVZHnKGI8"}
  ]'::JSONB;
BEGIN
  -- Try to find an admin user
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE id IN (
    SELECT user_id 
    FROM public.user_roles 
    WHERE role = 'admin'
    LIMIT 1
  );
  
  -- If no admin found, try to use the first user (fallback for development)
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id
    FROM auth.users
    ORDER BY created_at
    LIMIT 1;
  END IF;
  
  -- If still no user, skip seeding (will need manual intervention)
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'No admin user found. Skipping seed data. Please run this migration after creating an admin user.';
    RETURN;
  END IF;
  
  -- Insert student/learner items
  FOR seed_item IN SELECT * FROM jsonb_array_elements(student_items)
  LOOP
    INSERT INTO public.coaching_corner (
      id,
      created_by,
      role_scope,
      audience,
      title,
      content_type,
      body,
      video_url,
      is_active,
      pinned,
      start_at
    )
    VALUES (
      gen_random_uuid(), -- Generate new UUID (don't use seed id to avoid conflicts)
      admin_user_id,
      'admin',
      'learners',
      seed_item->>'title',
      seed_item->>'content_type',
      seed_item->>'body',
      seed_item->>'video_url',
      true,
      false,
      NOW()
    )
    ON CONFLICT DO NOTHING; -- Skip if somehow duplicate
  END LOOP;
  
  -- Insert supervisor items
  FOR seed_item IN SELECT * FROM jsonb_array_elements(supervisor_items)
  LOOP
    INSERT INTO public.coaching_corner (
      id,
      created_by,
      role_scope,
      audience,
      title,
      content_type,
      body,
      video_url,
      is_active,
      pinned,
      start_at
    )
    VALUES (
      gen_random_uuid(),
      admin_user_id,
      'admin',
      'supervisors',
      seed_item->>'title',
      seed_item->>'content_type',
      seed_item->>'body',
      seed_item->>'video_url',
      true,
      false,
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Coaching Corner seed data inserted successfully.';
END $$;

