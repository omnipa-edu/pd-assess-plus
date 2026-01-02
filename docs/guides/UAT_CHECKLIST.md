# User Acceptance Testing (UAT) Checklist

This document provides a manual testing script for real users (supervisors, learners, and admins) to validate the CME Time Engine, Adaptive Coaching Feed, and Smart Feedback Assistant features.

---

## 🎯 Testing Overview

**Purpose:** Validate that the features work correctly in real-world scenarios and meet user needs.

**Who Should Test:**
- **Supervisors/Faculty:** CME tracking, Smart Feedback Assistant
- **Learners/Students:** Adaptive Coaching Feed
- **Admins:** CME exports, system configuration

**Estimated Time:** 2-3 hours for complete testing

---

## ✅ Pre-Testing Setup

- [ ] Ensure you have supervisor and learner test accounts
- [ ] Verify feature flags are enabled:
  - `VITE_ENABLE_SUPERVISOR_CME_TRACKING=true`
  - `VITE_ENABLE_ADAPTIVE_COACHING_CORNER=true`
  - `VITE_ENABLE_SMART_FEEDBACK_ASSISTANT=true`
- [ ] Clear browser cache or use incognito mode
- [ ] Have sample assessment data ready (or create during testing)

---

## 📋 Section A: CME Time Engine (Supervisors)

### A1. Automatic CME Session Creation

**Test:** Verify that completing a WBA automatically creates a CME session.

**Steps:**
1. Log in as a supervisor
2. Navigate to dashboard
3. Note the current CME hours shown in the widget (if visible)
4. Create a new EPA observation:
   - Select an EPA (e.g., EPA 1.1)
   - Select clinical setting
   - Enter date
   - Select O-SCORE
   - **Enter narrative feedback** (e.g., "Excellent clinical reasoning demonstrated")
   - Submit the assessment
5. Navigate to CME Log page
6. Verify a new session appears with:
   - Activity Type: "Direct Observation"
   - Minutes: **10** (because feedback was provided)
   - Source: "Auto"
   - Date: Today's date

**Expected Results:**
- ✅ New CME session appears in log
- ✅ Minutes are correct (10 for with feedback, 7 for without)
- ✅ Activity type is correct
- ✅ Source is "Auto"
- ✅ Dashboard widget updates (may require refresh)

**Notes:**
- Test with EPA, Direct Observation, and Narrative assessments
- Test with and without feedback to verify different minute allocations
- Test end-of-rotation narrative (should be 20 minutes)

---

### A2. Manual CME Entry

**Test:** Verify supervisors can manually log CME time.

**Steps:**
1. Log in as supervisor
2. Navigate to CME Log page
3. Click "Log Coaching Time" button
4. Fill in the form:
   - Date: Today
   - Activity Type: "Group Teaching"
   - Minutes: 30
   - Description: "Group debrief session with 3 students"
5. Click "Save"
6. Verify the new session appears in the log

**Expected Results:**
- ✅ New session appears in log
- ✅ Source is "Manual"
- ✅ All entered details are correct
- ✅ Session can be edited (if implemented)
- ✅ Session can be deleted (manual entries only)

---

### A3. CME Log Filtering

**Test:** Verify filters work correctly.

**Steps:**
1. Navigate to CME Log
2. Apply date range filter (e.g., "This Month")
3. Verify only sessions within the range are shown
4. Apply activity type filter (e.g., "Direct Observation")
5. Verify only matching sessions are shown
6. Clear filters
7. Verify all sessions are shown again

**Expected Results:**
- ✅ Date range filter works correctly
- ✅ Activity type filter works correctly
- ✅ Source filter works correctly (if available)
- ✅ Filters can be cleared/reset
- ✅ Session count updates correctly

---

### A4. CME Export (CSV)

**Test:** Verify CSV export functionality.

**Steps:**
1. Navigate to CME Log
2. Apply any filters if desired
3. Click "Export CSV" button
4. Download the file
5. Open the CSV file in Excel or text editor
6. Verify the file contains:
   - Headers: Date, Activity Type, Minutes, Description, Source, WBA ID
   - All visible sessions in the log
   - Correct data for each session

**Expected Results:**
- ✅ File downloads successfully
- ✅ File name is descriptive (e.g., `cme-log-2024-01-15.csv`)
- ✅ All columns are present
- ✅ Data matches what's shown in the log
- ✅ Special characters are handled correctly (quotes, commas)

---

### A5. CME Export (PDF)

**Test:** Verify PDF export functionality.

**Steps:**
1. Navigate to CME Log
2. Apply filters if desired
3. Click "Export PDF" button
4. Download the file
5. Open the PDF
6. Verify the PDF contains:
   - Supervisor name and credentials
   - Date range
   - Summary statistics (total hours, sessions, average)
   - Activity breakdown
   - Detailed session list
   - Disclaimer text
   - Attestation section

**Expected Results:**
- ✅ PDF downloads successfully
- ✅ File name is descriptive
- ✅ All sections are present and formatted correctly
- ✅ Data matches the log
- ✅ PDF is suitable for submission to certifying bodies

**Admin Review:**
- [ ] Review a sample PDF export
- [ ] Confirm it would be acceptable as Category II CME documentation
- [ ] Verify disclaimer and attestation are appropriate

---

### A6. CME Summary Widget

**Test:** Verify dashboard widget displays correctly.

**Steps:**
1. Log in as supervisor
2. Navigate to dashboard
3. Locate the "Coaching & Feedback Time (CME-Eligible)" card
4. Verify it shows:
   - Total Hours (current year)
   - Total Sessions
   - Average hours per week
5. Click "View CME Log" button
6. Verify it navigates to the CME Log page

**Expected Results:**
- ✅ Widget displays current year summary
- ✅ Numbers are accurate
- ✅ Widget updates after creating new sessions (may require refresh)
- ✅ Navigation button works
- ✅ Widget handles zero sessions gracefully

---

## 📋 Section B: Adaptive Coaching Feed (Learners & Supervisors)

### B1. Coaching Corner Display (Learners)

**Test:** Verify learners see coaching content on their dashboard.

**Steps:**
1. Log in as a learner/student
2. Navigate to student dashboard
3. Locate the "Coaching Corner" card
4. Verify it displays:
   - Title
   - Content (text or video)
   - Dismiss button (X icon)

**Expected Results:**
- ✅ Coaching Corner card is visible
- ✅ Content is relevant and helpful
- ✅ Exactly one card is shown
- ✅ Content is readable and well-formatted

---

### B2. Coaching Corner Display (Supervisors)

**Test:** Verify supervisors see coaching content on their dashboard.

**Steps:**
1. Log in as supervisor
2. Navigate to supervisor dashboard
3. Locate the "Coaching Corner" card
4. Verify it displays relevant content for supervisors

**Expected Results:**
- ✅ Coaching Corner card is visible
- ✅ Content is relevant to supervisors
- ✅ Exactly one card is shown

---

### B3. Adaptive Content Selection (Learners)

**Test:** Verify content adapts based on learner activity.

**Scenario 1: No Recent WBAs**
1. Log in as a learner with **no WBAs in the last 14 days**
2. Navigate to dashboard
3. Verify Coaching Corner shows engagement-type content

**Scenario 2: Low O-SCORE**
1. Log in as a learner with **low O-SCORE (≤2) on a specific EPA**
2. Navigate to dashboard
3. Verify Coaching Corner shows EPA-specific or improvement content

**Scenario 3: Improving Scores**
1. Log in as a learner with **mid-range improving O-SCOREs**
2. Navigate to dashboard
3. Verify Coaching Corner shows self-assessment content

**Expected Results:**
- ✅ Content matches learner's activity pattern
- ✅ Content is supportive and educational
- ✅ Content is not punitive or discouraging

---

### B4. Adaptive Content Selection (Supervisors)

**Test:** Verify content adapts based on supervisor activity.

**Scenario 1: Low WBA Volume**
1. Log in as supervisor with **< 5 WBAs in last 30 days**
2. Navigate to dashboard
3. Verify Coaching Corner shows engagement content

**Scenario 2: Short Feedback**
1. Log in as supervisor with **very short feedback on average (< 200 chars)**
2. Navigate to dashboard
3. Verify Coaching Corner shows feedback quality content

**Expected Results:**
- ✅ Content matches supervisor's activity pattern
- ✅ Content is helpful and actionable

---

### B5. Video Content Embedding

**Test:** Verify YouTube videos embed correctly.

**Steps:**
1. Ensure there's coaching content with a YouTube video
2. Navigate to dashboard (learner or supervisor)
3. Locate Coaching Corner with video content
4. Verify:
   - Video iframe is visible
   - Video loads correctly
   - Video is lazy-loaded (doesn't load until scrolled into view)
   - Video has proper privacy settings (no-referrer)

**Expected Results:**
- ✅ Video embeds correctly
- ✅ Video plays when clicked
- ✅ Video doesn't auto-play
- ✅ Privacy settings are correct

---

### B6. Dismissing Coaching Content

**Test:** Verify users can dismiss coaching content.

**Steps:**
1. Navigate to dashboard
2. Locate Coaching Corner card
3. Click the dismiss button (X icon)
4. Verify the content is removed or replaced

**Expected Results:**
- ✅ Dismiss button is visible and accessible
- ✅ Clicking dismiss removes/replaces content
- ✅ Dismissed content doesn't reappear immediately
- ✅ New content may appear (if available)

---

## 📋 Section C: Smart Feedback Assistant (Supervisors)

### C1. Basic Functionality

**Test:** Verify Smart Feedback Assistant appears and works.

**Steps:**
1. Log in as supervisor
2. Navigate to create a new EPA observation
3. Navigate to Step 3 (Coach & Record)
4. Locate the "Narrative Observation" textarea
5. Verify:
   - Helper text appears: "Need help refining your feedback?"
   - "Improve Feedback" button is visible
6. Type some feedback: "Good job. Keep it up."
7. Click "Improve Feedback" button
8. Wait for analysis (may take 5-15 seconds)
9. Verify suggestions panel appears with tabs:
   - Rewrite
   - Specificity
   - Coaching
   - Tone

**Expected Results:**
- ✅ Assistant appears on all feedback fields
- ✅ Button is enabled when text is entered
- ✅ Button is disabled when text is empty
- ✅ Analysis completes successfully
- ✅ Suggestions panel appears with all tabs

---

### C2. Rewrite Suggestions

**Test:** Verify improved feedback rewrite is useful.

**Steps:**
1. Enter vague feedback: "Good job. Needs improvement."
2. Click "Improve Feedback"
3. Wait for suggestions
4. Review the "Rewrite" tab
5. Verify the improved feedback:
   - Is more specific
   - Mentions behaviors, not just praise
   - Is professional and respectful
   - Is similar length to original

**Expected Results:**
- ✅ Improved feedback is clearer and more specific
- ✅ Feedback is professional and appropriate
- ✅ Feedback doesn't fabricate details not in original
- ✅ Feedback is actionable

**User Feedback:**
- [ ] Is the improved feedback helpful?
- [ ] Would you use this suggestion?
- [ ] Is it too long/short?

---

### C3. Vague Phrase Detection

**Test:** Verify vague phrases are identified correctly.

**Steps:**
1. Enter feedback with vague phrases: "Good job. Nice work. Needs improvement."
2. Click "Improve Feedback"
3. Navigate to "Specificity" tab
4. Verify vague phrases are listed with suggestions

**Expected Results:**
- ✅ Vague phrases are identified (e.g., "good job", "nice work")
- ✅ Specific suggestions are provided for each phrase
- ✅ Suggestions can be copied to clipboard

**User Feedback:**
- [ ] Are the vague phrases correctly identified?
- [ ] Are the suggestions helpful?

---

### C4. Coaching Prompts

**Test:** Verify coaching prompts are actionable.

**Steps:**
1. Enter feedback
2. Click "Improve Feedback"
3. Navigate to "Coaching" tab
4. Review the coaching prompts
5. Click "Insert" on one prompt
6. Verify the prompt is inserted into the textarea

**Expected Results:**
- ✅ 2-4 coaching prompts are provided
- ✅ Prompts are actionable and specific
- ✅ Prompts can be inserted into feedback
- ✅ Inserted text is properly formatted

**User Feedback:**
- [ ] Are the coaching prompts useful?
- [ ] Would you incorporate them into your feedback?

---

### C5. Tone Analysis

**Test:** Verify tone analysis is helpful.

**Steps:**
1. Enter feedback with different tones:
   - **Test 1:** "You did a terrible job and this was unacceptable."
   - **Test 2:** "Good job, keep it up."
   - **Test 3:** "You demonstrated clear clinical reasoning..."
2. Click "Improve Feedback" for each
3. Navigate to "Tone" tab
4. Review tone summary and suggestions

**Expected Results:**
- ✅ Tone is analyzed correctly
- ✅ Suggestions for professionalization are provided (for harsh feedback)
- ✅ Supportive tone is confirmed (for appropriate feedback)
- ✅ Suggestions are actionable

**User Feedback:**
- [ ] Is the tone analysis accurate?
- [ ] Are the suggestions helpful?

---

### C6. Feedback Replacement

**Test:** Verify feedback can be replaced with improved version.

**Steps:**
1. Enter original feedback: "Good job."
2. Click "Improve Feedback"
3. Review improved feedback in "Rewrite" tab
4. Click "Replace my feedback with this"
5. Verify the textarea content is replaced
6. Verify you can still edit the replaced text

**Expected Results:**
- ✅ Feedback is replaced correctly
- ✅ Replaced text can still be edited
- ✅ Original text is not lost (can undo if needed)

---

### C7. Error Handling

**Test:** Verify errors are handled gracefully.

**Steps:**
1. Enter feedback
2. Click "Improve Feedback"
3. Simulate network error (disable network or block API)
4. Verify error message appears
5. Verify form is still usable
6. Verify you can try again

**Expected Results:**
- ✅ Error message is friendly and non-blocking
- ✅ Form remains functional
- ✅ User can retry or continue without suggestions

---

### C8. Feature Flag Behavior

**Test:** Verify feature can be disabled.

**Steps:**
1. Set `VITE_ENABLE_SMART_FEEDBACK_ASSISTANT=false` in environment
2. Restart application
3. Log in as supervisor
4. Navigate to assessment form
5. Verify:
   - No "Improve Feedback" button appears
   - No Smart Feedback UI is visible
   - Form works normally

**Expected Results:**
- ✅ Feature is completely hidden when disabled
- ✅ No API calls are made
- ✅ Form functionality is unaffected

---

## 📋 Section D: Integration & Edge Cases

### D1. Multiple WBAs in One Day

**Test:** Verify multiple WBAs create multiple CME sessions.

**Steps:**
1. Create 3 different WBAs in one day:
   - EPA observation
   - Direct observation
   - Narrative assessment
2. Navigate to CME Log
3. Filter by today's date
4. Verify 3 separate sessions appear

**Expected Results:**
- ✅ Each WBA creates a separate CME session
- ✅ No duplicates are created
- ✅ All sessions have correct minutes and activity types

---

### D2. WBA Updates

**Test:** Verify updating a WBA updates the CME session (not creates duplicate).

**Steps:**
1. Create an EPA observation with feedback (10 minutes)
2. Navigate to CME Log
3. Note the session ID
4. Edit the EPA observation (change feedback)
5. Navigate back to CME Log
6. Verify:
   - Only one session exists (no duplicate)
   - Session minutes are still 10 (or updated if logic changes)

**Expected Results:**
- ✅ No duplicate sessions are created
- ✅ Existing session is updated (if applicable)

---

### D3. Privacy & Security

**Test:** Verify no PHI or personal identifiers are sent to LLM.

**Steps:**
1. Open browser developer tools
2. Navigate to Network tab
3. Create an assessment with feedback containing:
   - Patient name: "John Doe"
   - Student name: "Jane Smith"
   - Email: "student@example.com"
4. Click "Improve Feedback"
5. Inspect the API request to `/functions/v1/analyze-feedback`
6. Verify the request body:
   - Contains feedback text
   - Contains generic context (EPA name, learner level)
   - **Does NOT contain** patient names
   - **Does NOT contain** student names/emails
   - **Does NOT contain** personal identifiers

**Expected Results:**
- ✅ Only feedback text and generic context are sent
- ✅ No PHI or personal identifiers in API calls
- ✅ Privacy is maintained

---

## 📊 Test Summary

### Completion Checklist

**CME Time Engine:**
- [ ] Automatic session creation works for all WBA types
- [ ] Manual entry works correctly
- [ ] Filters work correctly
- [ ] CSV export works and is accurate
- [ ] PDF export works and is suitable for submission
- [ ] Dashboard widget displays correctly

**Adaptive Coaching Feed:**
- [ ] Coaching Corner appears on learner dashboard
- [ ] Coaching Corner appears on supervisor dashboard
- [ ] Content adapts based on activity (tested multiple scenarios)
- [ ] Video content embeds correctly
- [ ] Dismiss functionality works
- [ ] Exactly one card per dashboard

**Smart Feedback Assistant:**
- [ ] Assistant appears on all assessment forms
- [ ] Rewrite suggestions are helpful
- [ ] Vague phrase detection works
- [ ] Coaching prompts are actionable
- [ ] Tone analysis is accurate
- [ ] Feedback replacement works
- [ ] Error handling is graceful
- [ ] Feature flag works correctly

**Integration:**
- [ ] Multiple WBAs create multiple sessions
- [ ] WBA updates don't create duplicates
- [ ] Privacy is maintained (no PHI sent to LLM)

---

## 🐛 Issues Found

Document any issues discovered during testing:

| Issue # | Feature | Description | Severity | Steps to Reproduce |
|---------|---------|-------------|----------|-------------------|
| 1       |         |             |          |                    |
| 2       |         |             |          |                    |

---

## ✅ Sign-Off

**Supervisor Tester:**
- Name: ________________
- Date: ________________
- Overall Assessment: ⭐⭐⭐⭐⭐ (1-5 stars)
- Comments: _________________________________

**Learner Tester:**
- Name: ________________
- Date: ________________
- Overall Assessment: ⭐⭐⭐⭐⭐ (1-5 stars)
- Comments: _________________________________

**Admin Reviewer:**
- Name: ________________
- Date: ________________
- CME Export Acceptable: ☐ Yes ☐ No
- Comments: _________________________________

---

## 📝 Notes

- Test with different browsers (Chrome, Firefox, Safari)
- Test on mobile devices if applicable
- Test with different user roles
- Test with various data scenarios (empty, many sessions, etc.)

---

**Last Updated:** [Date]
**Version:** 1.0

