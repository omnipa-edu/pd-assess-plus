-- Seed: default button definitions, button sets, and one sample procedure with version

-- ============================================================================
-- BUTTON DEFINITIONS (default set)
-- ============================================================================

INSERT INTO public.button_definitions (id, key, label, icon, variant, size, sort_order, tooltip, action_type, action_payload, context_scope) VALUES
  ('00000000-0000-4000-a001-000000000001', 'assess_primary', 'Assess', 'ClipboardList', 'default', 'default', 10, 'Start assessment', 'OPEN_MODAL', '{"modal":"assess"}'::jsonb, 'procedure'),
  ('00000000-0000-4000-a001-000000000002', 'edit_procedure', 'Edit', 'Pencil', 'outline', 'default', 20, 'Edit procedure', 'NAVIGATE', '{"route":"/admin/procedure-library/:id/edit"}'::jsonb, 'procedure'),
  ('00000000-0000-4000-a001-000000000003', 'assign_to_program', 'Assign', 'Link', 'outline', 'default', 30, 'Add to program', 'OPEN_MODAL', '{"modal":"assign"}'::jsonb, 'procedure'),
  ('00000000-0000-4000-a001-000000000004', 'preview_procedure', 'Preview', 'Eye', 'ghost', 'default', 40, 'Preview form', 'OPEN_MODAL', '{"modal":"preview"}'::jsonb, 'procedure'),
  ('00000000-0000-4000-a001-000000000005', 'save_draft', 'Save draft', 'Save', 'outline', 'default', 10, 'Save without submitting', 'SET_FIELD_VALUE', '{"field":"_action","value":"save_draft"}'::jsonb, 'procedure_instance'),
  ('00000000-0000-4000-a001-000000000006', 'submit_observation', 'Submit', 'Check', 'default', 'default', 20, 'Submit assessment', 'SET_FIELD_VALUE', '{"field":"_action","value":"submit"}'::jsonb, 'procedure_instance'),
  ('00000000-0000-4000-a001-000000000007', 'mark_complete', 'Mark complete', 'CheckCircle', 'default', 'default', 30, 'Mark as complete', 'CUSTOM', '{}'::jsonb, 'procedure_instance'),
  ('00000000-0000-4000-a001-000000000008', 'needs_coaching', 'Needs coaching', 'MessageCircle', 'outline', 'default', 40, 'Flag for coaching', 'CUSTOM', '{}'::jsonb, 'procedure_instance')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- BUTTON SETS
-- ============================================================================

INSERT INTO public.button_sets (id, name, description, context) VALUES
  ('00000000-0000-4000-b001-000000000001', 'Procedure card default', 'Assess, Edit, Assign, Preview', 'card'),
  ('00000000-0000-4000-b001-000000000002', 'Assessment form default', 'Save draft, Submit, Mark complete, Needs coaching', 'form')
ON CONFLICT (id) DO NOTHING;

-- Button set items: card set
INSERT INTO public.button_set_items (button_set_id, button_definition_id, sort_order)
SELECT '00000000-0000-4000-b001-000000000001', id, sort_order
FROM public.button_definitions
WHERE key IN ('assess_primary', 'edit_procedure', 'assign_to_program', 'preview_procedure')
ON CONFLICT (button_set_id, button_definition_id) DO NOTHING;

-- Button set items: form set
INSERT INTO public.button_set_items (button_set_id, button_definition_id, sort_order)
SELECT '00000000-0000-4000-b001-000000000002', id, sort_order
FROM public.button_definitions
WHERE key IN ('save_draft', 'submit_observation', 'mark_complete', 'needs_coaching')
ON CONFLICT (button_set_id, button_definition_id) DO NOTHING;

-- ============================================================================
-- SAMPLE PROCEDURE (only if no procedure with code 'sample-history-taking' exists)
-- ============================================================================

DO $$
DECLARE
  v_specialty_id UUID;
  v_procedure_id UUID;
  v_version_id UUID;
BEGIN
  SELECT id INTO v_specialty_id FROM public.specialties WHERE is_active = true LIMIT 1;
  IF v_specialty_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.procedures WHERE code = 'sample-history-taking') THEN
    INSERT INTO public.procedures (id, code, title, description, status, specialty_id, indications, contraindications, tags)
    VALUES (
      gen_random_uuid(),
      'sample-history-taking',
      'Sample: History Taking',
      'Sample procedure for procedure library and builder demo.',
      'draft',
      v_specialty_id,
      '["Routine visit","Follow-up"]'::jsonb,
      '["Patient refusal"]'::jsonb,
      '["communication","history"]'::jsonb
    )
    RETURNING id INTO v_procedure_id;

    INSERT INTO public.procedure_versions (id, procedure_id, version_number, assessment_form, created_at)
    VALUES (
      gen_random_uuid(),
      v_procedure_id,
      1,
      '{
        "sections": [
          {
            "id": "sec1",
            "title": "Information gathering",
            "collapsible": false,
            "order": 0,
            "items": [
              {"id": "item1", "type": "checklist", "label": "Chief complaint documented", "required": true, "config": {}},
              {"id": "item2", "type": "likert", "label": "Quality of history", "required": true, "config": {"min": 1, "max": 5, "labels": ["Poor", "Fair", "Good", "Very good", "Excellent"]}}
            ]
          }
        ]
      }'::jsonb,
      now()
    )
    RETURNING id INTO v_version_id;

    UPDATE public.procedures SET latest_version_id = v_version_id WHERE id = v_procedure_id;
  END IF;
END $$;
