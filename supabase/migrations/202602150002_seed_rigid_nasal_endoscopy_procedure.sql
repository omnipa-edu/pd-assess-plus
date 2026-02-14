-- Optional seed: Rigid Nasal Endoscopy procedure for competency evaluations
INSERT INTO public.procedures (code, title, description, status)
VALUES (
  'rigid_nasal_endoscopy',
  'Rigid Nasal Endoscopy',
  'Competency evaluation for rigid nasal endoscopy procedure.',
  'active'
)
ON CONFLICT (code) DO NOTHING;
