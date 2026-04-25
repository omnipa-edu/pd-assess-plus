import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface AnalyzeFeedbackRequest {
  feedbackText: string;
  context?: {
    role?: string;
    discipline?: string;
    epaName?: string;
    encounterType?: string;
    learnerLevel?: string;
  };
}

function mapOpenAIErrorToUserMessage(errorPayload: string): string {
  const normalized = errorPayload.toLowerCase();

  if (
    normalized.includes("insufficient_quota") ||
    normalized.includes("exceeded your current quota") ||
    normalized.includes("billing_hard_limit_reached")
  ) {
    return "OpenAI returned insufficient quota for this API key. Please check OpenAI billing/usage limits and try again.";
  }

  if (
    normalized.includes("invalid_api_key") ||
    normalized.includes("incorrect api key") ||
    normalized.includes("\"status\": 401") ||
    normalized.includes("status 401")
  ) {
    return "The OpenAI API key configured for this project is invalid. Please update OPENAI_API_KEY in Supabase Edge Function secrets.";
  }

  return "Failed to analyze feedback with AI service. Please try again.";
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
    const { feedbackText, context }: AnalyzeFeedbackRequest = await req.json();
    
    if (!feedbackText || feedbackText.trim().length === 0) {
      throw new Error('Feedback text is required');
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

    // Construct the prompt for OpenAI
    // Evidence-based principles from:
    // - Johnson et al. (2016): Educator behaviours for high quality verbal feedback
    // - Tripodi et al. (2021): Feedback literacy in health professions learners
    const systemPrompt = `You are an expert in clinical education feedback for health professions training (PA/MD/NP/etc.), grounded in evidence-based feedback principles. Your role is to help supervisors provide learner-centered, dialogic feedback that promotes feedback literacy and supports professional development.

CORE PRINCIPLES (Evidence-Based):

1. FEEDBACK BASED ON DIRECT OBSERVATION (Johnson et al. 2016):
   - Base all comments on specific behaviors you directly observed, not assumptions or traits
   - Clearly distinguish what was done well (observed strengths) and what needs improvement
   - Avoid vague or generic language; use concrete examples from the encounter

2. LEARNER-CENTERED, DIALOGIC APPROACH (Johnson et al. 2016):
   - Encourage interactive discussion, not one-way monologue
   - Invite learner self-assessment and reflection (e.g., "How do you think that went?", "What would you like to focus on next time?")
   - Help learners clarify target performance and identify gaps between current and desired performance
   - Focus on 1-2 priority areas to avoid cognitive overload

3. FEEDBACK LITERACY DEVELOPMENT (Tripodi et al. 2021):
   - Appreciating feedback: Help learners understand why feedback matters for patient care and professional growth
   - Making judgments: Encourage evaluative judgment through self-assessment prompts
   - Managing affect: Use constructive, non-personal language that acknowledges effort and focuses on behaviors, not identity
   - Taking action: Support collaborative goal-setting and concrete next steps

4. BEHAVIOR-FOCUSED LANGUAGE:
   - Describe specific, observable behaviors that can be changed
   - Avoid personal traits or character judgments
   - Use respectful, supportive language that preserves the learner-educator relationship
   - Connect feedback to safe, effective patient care when relevant

5. PRACTICAL GUIDELINES:
   - Keep feedback concise (2-6 sentences ideal for most contexts)
   - Never fabricate clinical details not present in the original text
   - Maintain a professional, educational tone
   - Balance praise with specific improvement strategies`;

    const userPrompt = `Analyze the following supervisor feedback and provide evidence-based improvements. Context: ${contextStr}

Original Feedback:
"${feedbackText}"

Rewrite this feedback following evidence-based principles:

1. GROUND IN OBSERVATION: Base comments on directly observed behaviors, not traits or assumptions. If the original lacks specific observations, suggest how to frame it around what was actually seen.

2. CLARIFY TARGET & GAP: Clearly distinguish what was done well and what needs improvement. Help the learner understand the target performance and the gap between current and desired performance.

3. PRIORITIZE: Focus on 1-2 key areas to avoid overload. If the original covers many points, identify the most important 1-2 for improvement.

4. INVITE DIALOGUE: Include language that encourages learner self-assessment and reflection (e.g., "How do you think that went?", "What would you like to focus on next time?", "What aspects of this encounter do you feel went well?").

5. MANAGE AFFECT: Use constructive, non-personal language. Acknowledge effort, focus on behaviors not identity, and tie feedback to patient safety and growth when relevant.

6. SUPPORT ACTION: Suggest concrete next steps and collaborative planning. Help the learner understand how to apply this feedback.

Please provide a JSON response with the following structure:
{
  "improved_feedback": "A revised version that is clearer, more specific, behavior-focused, and learner-centered. Include 1-2 priority areas with concrete next steps. Invite dialogue where appropriate. Keep similar length to original unless it was extremely brief.",
  "vague_phrases": [
    {
      "phrase": "exact vague phrase from original (e.g., 'good job', 'needs work', 'fine')",
      "suggestion": "specific, behavior-based replacement that describes what was observed (e.g., 'You maintained eye contact and used open-ended questions, which helped the patient share concerns' instead of 'good communication')"
    }
  ],
  "coaching_prompts": [
    "2-4 short prompts that encourage learner self-assessment and evaluative judgment",
    "Examples: 'What aspects of this encounter do you feel went well?', 'Which part of your differential would you most like to strengthen?', 'Let's pick one skill to focus on next shift and revisit it together.'",
    "Avoid purely directive language unless patient safety demands it"
  ],
  "tone_summary": "Short description of the tone with feedback literacy lens (e.g., 'Supportive but vague - may not help learner develop evaluative judgment', 'Direct but may trigger defensive affect - consider softening while maintaining standards', 'Professional and balanced - supports feedback literacy')",
  "tone_suggestions": "Specific guidance on managing affect and supporting feedback literacy. If tone is harsh, suggest alternative phrasing that maintains standards but reduces personal attack. If tone is vague or overly positive, encourage balancing praise with specific improvement strategies tied to observed behaviors."
}

Important: Return ONLY valid JSON, no markdown formatting or additional text.`;

    console.log('Sending feedback analysis request to OpenAI...');
    
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
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(mapOpenAIErrorToUserMessage(errorText));
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Parse the JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate and structure the response
    const formattedResult = {
      improved_feedback: analysisResult.improved_feedback || feedbackText,
      vague_phrases: Array.isArray(analysisResult.vague_phrases) 
        ? analysisResult.vague_phrases 
        : [],
      coaching_prompts: Array.isArray(analysisResult.coaching_prompts)
        ? analysisResult.coaching_prompts
        : [],
      tone_summary: analysisResult.tone_summary || 'Unable to analyze tone',
      tone_suggestions: analysisResult.tone_suggestions || 'No specific suggestions',
    };

    console.log('Feedback analysis successful');

    return new Response(
      JSON.stringify(formattedResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-feedback function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Provide more helpful error messages
    let userFriendlyMessage = errorMessage;
    if (errorMessage.includes('OPENAI_API_KEY')) {
      userFriendlyMessage = 'OpenAI API key is not configured. Please contact your administrator.';
    } else if (errorMessage.includes('JSON')) {
      userFriendlyMessage = 'Invalid response from AI service. Please try again.';
    }
    
    const isDevelopment = Deno.env.get('DENO_ENV') === 'development';
    return new Response(
      JSON.stringify({
        error: userFriendlyMessage,
        details: isDevelopment ? errorMessage : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

