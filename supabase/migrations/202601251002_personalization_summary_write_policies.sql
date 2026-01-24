-- Allow authenticated users to upsert their own personalization summaries
DROP POLICY IF EXISTS learner_personalization_write ON public.learner_personalization_summaries;
CREATE POLICY learner_personalization_write ON public.learner_personalization_summaries
  FOR INSERT WITH CHECK (learner_id = auth.uid());

DROP POLICY IF EXISTS learner_personalization_update ON public.learner_personalization_summaries;
CREATE POLICY learner_personalization_update ON public.learner_personalization_summaries
  FOR UPDATE USING (learner_id = auth.uid())
  WITH CHECK (learner_id = auth.uid());

DROP POLICY IF EXISTS supervisor_personalization_write ON public.supervisor_personalization_summaries;
CREATE POLICY supervisor_personalization_write ON public.supervisor_personalization_summaries
  FOR INSERT WITH CHECK (supervisor_id = auth.uid());

DROP POLICY IF EXISTS supervisor_personalization_update ON public.supervisor_personalization_summaries;
CREATE POLICY supervisor_personalization_update ON public.supervisor_personalization_summaries
  FOR UPDATE USING (supervisor_id = auth.uid())
  WITH CHECK (supervisor_id = auth.uid());
