import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface ScoreFeedbackRequest {
  feedbackText: string;
  assessmentType: 'epa' | 'direct_observation' | 'narrative';
  context?: {
    epaName?: string;
    encounterType?: string;
    learnerLevel?: string;
  };
}

interface FeedbackQualityScores {
  overall_score: number; // 0-100
  clarity_score: number; // 0-4
  specificity_score: number; // 0-4
  actionability_score: number; // 0-4
  balance_score: number; // 0-4
  learner_engagement_score: number; // 0-4
  tone_professionalism_score: number; // 0-4
  scoring_rationale?: {
    clarity?: string;
    specificity?: string;
    actionability?: string;
    balance?: string;
    learner_engagement?: string;
    tone?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const { feedbackText, assessmentType, context }: ScoreFeedbackRequest = await req.json();
    
    if (!feedbackText || feedbackText.trim().length === 0) {
      throw new Error('Feedback text is required');
    }

    if (!assessmentType || !['epa', 'direct_observation', 'narrative'].includes(assessmentType)) {
      throw new Error('Valid assessment type is required');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Build context string for the prompt
    const contextStr = context ? [
      context.role && `Role: ${context.role}`,
      context.discipline && `Discipline: ${context.discipline}`,
      context.epaName && `EPA: ${context.epaName}`,
      context.encounterType && `Encounter Type: ${context.encounterType}`,
      context.learnerLevel && `Learner Level: ${context.learnerLevel}`,
    ].filter(Boolean).join(', ') : 'General clinical education context';

    // Construct the scoring prompt based on evidence-based rubric
    const systemPrompt = `You are an expert in clinical education feedback assessment for health professions training (PA/MD/NP/etc.). Your role is to score supervisor feedback using an evidence-based rubric aligned with high-quality educator behaviors and feedback literacy principles.

SCORING RUBRIC (0-4 scale for each dimension):

1. CLARITY OF PURPOSE & MESSAGE (0-4):
   0: Confusing, contradictory, or unclear purpose
   1: Vague comments, unclear why feedback is given
   2: Some clear points, but mixed vague/general statements
   3: Mostly clear about what is being discussed and why
   4: Very clear, coherent message; "why this matters" is explicit

2. SPECIFICITY & BEHAVIOUR FOCUS (0-4):
   0: Entirely generic ("good job", "needs work")
   1: Mostly generic; minimal behavioural reference
   2: Mix of generic and specific comments; some behaviours noted
   3: Clearly describes observable behaviours with examples
   4: Behaviourally precise; gives concrete examples tied to performance standards

3. ACTIONABILITY & NEXT STEPS (0-4):
   0: No suggestions for change
   1: Vague ("try to improve", "be more confident")
   2: At least one somewhat concrete suggestion
   3: Clear next steps; at least one specific strategy or behaviour to try
   4: Very actionable; prioritizes 1-2 key areas with concrete, realistic next steps and/or plan to follow up

4. BALANCE (STRENGTHS + AREAS TO IMPROVE) (0-4):
   0: Only negative or only positive; imbalanced and unhelpful
   1: Mostly one-sided, with minor nod to the other side
   2: Mentions at least one strength and one limitation
   3: Provides balanced view with specific strengths and specific improvements
   4: Balanced, nuanced; strengths used to scaffold the improvement suggestions

5. LEARNER ENGAGEMENT / FEEDBACK LITERACY SUPPORT (0-4):
   0: Pure monologue; no indication of learner agency
   1: Implicitly invites improvement but no explicit learner involvement
   2: Contains some learner-centered language but no explicit prompts
   3: Includes phrases that invite reflection, self-assessment, or planning ("Next time, I'd like you to focus on...")
   4: Explicitly invites learner input and planning ("How do you think that went?", "What would you like to focus on next time?") and links to ongoing development

6. TONE & PROFESSIONALISM (AFFECT MANAGEMENT) (0-4):
   0: Harsh, sarcastic, or personally attacking
   1: Very blunt or potentially shaming; unsoftened criticism
   2: Neutral but possibly cold; lacks support
   3: Respectful, supportive, focused on behaviours
   4: Highly professional, empathic; acknowledges difficulty while maintaining clear standards

OVERALL SCORE CALCULATION:
   overall_score = round((sum of all 6 dimension scores) / 24 * 100)
   This yields a score from 0-100 where 100 = perfect score on all dimensions.

IMPORTANT:
- Score based on what is actually written, not what could be written
- Be fair but rigorous
- Consider the context (assessment type, learner level) when appropriate
- Do not fabricate clinical details or assume information not present`;

    const userPrompt = `Score the following supervisor feedback using the rubric above. Context: ${contextStr}, Assessment Type: ${assessmentType}

Feedback Text:
"${feedbackText}"

Provide a JSON response with the following structure:
{
  "overall_score": <integer 0-100>,
  "clarity_score": <integer 0-4>,
  "specificity_score": <integer 0-4>,
  "actionability_score": <integer 0-4>,
  "balance_score": <integer 0-4>,
  "learner_engagement_score": <integer 0-4>,
  "tone_professionalism_score": <integer 0-4>,
  "scoring_rationale": {
    "clarity": "<brief explanation of clarity score>",
    "specificity": "<brief explanation of specificity score>",
    "actionability": "<brief explanation of actionability score>",
    "balance": "<brief explanation of balance score>",
    "learner_engagement": "<brief explanation of learner engagement score>",
    "tone": "<brief explanation of tone score>"
  }
}

Important: Return ONLY valid JSON, no markdown formatting or additional text.`;

    console.log('Sending feedback scoring request to OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using cost-effective model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent scoring
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Parse the JSON response
    let scores: FeedbackQualityScores;
    try {
      scores = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate scores are within expected ranges
    const validateScore = (score: number, min: number, max: number, name: string) => {
      if (typeof score !== 'number' || score < min || score > max) {
        throw new Error(`Invalid ${name}: ${score} (must be between ${min} and ${max})`);
      }
      return Math.round(score);
    };

    const validatedScores = {
      overall_score: validateScore(scores.overall_score, 0, 100, 'overall_score'),
      clarity_score: validateScore(scores.clarity_score, 0, 4, 'clarity_score'),
      specificity_score: validateScore(scores.specificity_score, 0, 4, 'specificity_score'),
      actionability_score: validateScore(scores.actionability_score, 0, 4, 'actionability_score'),
      balance_score: validateScore(scores.balance_score, 0, 4, 'balance_score'),
      learner_engagement_score: validateScore(scores.learner_engagement_score, 0, 4, 'learner_engagement_score'),
      tone_professionalism_score: validateScore(scores.tone_professionalism_score, 0, 4, 'tone_professionalism_score'),
      scoring_rationale: scores.scoring_rationale || {},
    };

    // Recalculate overall score to ensure consistency
    const dimensionSum = 
      validatedScores.clarity_score +
      validatedScores.specificity_score +
      validatedScores.actionability_score +
      validatedScores.balance_score +
      validatedScores.learner_engagement_score +
      validatedScores.tone_professionalism_score;
    
    validatedScores.overall_score = Math.round((dimensionSum / 24) * 100);

    console.log('Feedback scoring successful');

    return new Response(
      JSON.stringify(validatedScores),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in score-feedback function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Provide more helpful error messages
    let userFriendlyMessage = errorMessage;
    if (errorMessage.includes('OPENAI_API_KEY')) {
      userFriendlyMessage = 'OpenAI API key is not configured. Please contact your administrator.';
    } else if (errorMessage.includes('OpenAI API error')) {
      userFriendlyMessage = 'Failed to score feedback with AI service. Please try again.';
    } else if (errorMessage.includes('JSON')) {
      userFriendlyMessage = 'Invalid response from AI service. Please try again.';
    }
    
    return new Response(
      JSON.stringify({ 
        error: userFriendlyMessage,
        details: process.env.DENO_ENV === 'development' ? errorMessage : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

