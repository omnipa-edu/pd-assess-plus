# Smart Feedback Assistant Implementation

## Overview

The Smart Feedback Assistant is an AI-powered feature that helps supervisors improve the quality of their feedback on Work-Based Assessments (WBA). It provides suggestions for making feedback more specific, actionable, and professional.

## Features

1. **Improved Feedback Rewrite**: Suggests a clearer, more specific version of the feedback
2. **Vague Phrase Detection**: Identifies generic phrases (e.g., "good job") and suggests specific replacements
3. **Coaching Prompts**: Provides 2-4 actionable coaching sentences supervisors can incorporate
4. **Tone Analysis**: Analyzes the emotional tone and suggests professionalization if needed

## Architecture

### Components

- **`SmartFeedbackField`** (`src/components/feedback/SmartFeedbackField.tsx`): Wrapper component that combines a textarea with the Smart Feedback Assistant
- **`SmartFeedbackAssistant`** (`src/components/feedback/SmartFeedbackAssistant.tsx`): Main UI component with tabbed interface for suggestions

### Backend

- **Supabase Edge Function** (`supabase/functions/analyze-feedback/index.ts`): Serverless function that calls OpenAI API for feedback analysis
- **Client Library** (`src/lib/smartFeedback.ts`): TypeScript interfaces and helper functions for client-side integration

### Integration Points

The Smart Feedback Assistant is integrated into:
- EPA Observation Form (`src/components/EPAObservationForm.tsx`)
- Direct Observation Form (`src/components/DirectObservationForm.tsx`)
- Narrative Assessment Form (`src/components/NarrativeAssessmentForm.tsx`)

## Configuration

### Environment Variables

Add to your `.env.local`:

```env
# Enable/disable Smart Feedback Assistant (defaults to enabled)
VITE_ENABLE_SMART_FEEDBACK_ASSISTANT=true
```

### Supabase Edge Function Secrets

Ensure `OPENAI_API_KEY` is set in your Supabase project:
- Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
- Add: `OPENAI_API_KEY=sk-your-openai-key-here`

## Usage

1. Supervisors type feedback in any assessment form textarea
2. Click "Improve Feedback" button below the textarea
3. Review suggestions in the tabbed panel:
   - **Rewrite**: Full improved version
   - **Specificity**: Vague phrases with suggestions
   - **Coaching**: Actionable coaching prompts
   - **Tone**: Tone analysis and recommendations
4. Supervisors can:
   - Replace entire feedback with improved version
   - Copy suggestions to clipboard
   - Insert individual coaching prompts
   - Ignore suggestions and continue typing

## Privacy & Safety

- Only feedback text and minimal context (EPA name, encounter type, learner level) are sent to the model
- No PHI (Protected Health Information) or personal identifiers are included
- All suggestions are preview-only until supervisor explicitly accepts them
- Supervisors remain in full control of what gets saved

## Testing

### Unit Tests

```bash
npm test src/lib/__tests__/smartFeedback.test.ts
```

### E2E Tests

```bash
npx playwright test tests/e2e/smart-feedback-assistant.spec.ts
```

## API Response Format

The Edge Function returns:

```typescript
interface SmartFeedbackResult {
  improved_feedback: string;
  vague_phrases: Array<{
    phrase: string;
    suggestion: string;
  }>;
  coaching_prompts: string[];
  tone_summary: string;
  tone_suggestions: string;
}
```

## Error Handling

- API failures show a non-blocking error message
- Form remains fully functional if analysis fails
- Loading states prevent duplicate requests
- Graceful degradation when feature is disabled

## Future Enhancements

- Institution-level feature flags
- Customizable prompt templates
- Feedback quality scoring
- Analytics on feedback improvement patterns

