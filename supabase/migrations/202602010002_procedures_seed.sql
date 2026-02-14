-- Seed default procedures (matches former hardcoded DirectObservationForm activities)
INSERT INTO public.procedures (code, title, description, status)
VALUES
  ('patient-history', 'Patient History Taking', NULL, 'active'),
  ('physical-exam', 'Physical Examination', NULL, 'active'),
  ('procedure-performance', 'Procedure Performance', NULL, 'active'),
  ('patient-counseling', 'Patient Counseling', NULL, 'active'),
  ('interdisciplinary-rounds', 'Interdisciplinary Rounds', NULL, 'active'),
  ('emergency-response', 'Emergency Response', NULL, 'active'),
  ('diagnostic-interpretation', 'Diagnostic Interpretation', NULL, 'active'),
  ('treatment-planning', 'Treatment Planning', NULL, 'active'),
  ('family-conference', 'Family Conference', NULL, 'active'),
  ('handover-communication', 'Handover Communication', NULL, 'active')
ON CONFLICT (code) DO NOTHING;
