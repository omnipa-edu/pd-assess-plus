import { useNavigate } from 'react-router-dom';

import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';

export function AdminOnboardingWidget() {
  const navigate = useNavigate();

  return (
    <OnboardingChecklist
      onTaskClick={(taskId) => {
        if (taskId === 'configure_institution') {
          navigate('/admin/institutions');
        } else if (taskId === 'import_epas') {
          navigate('/admin/epas/import');
        } else if (taskId === 'manage_users') {
          navigate('/admin/users');
        } else if (taskId === 'setup_promo_codes') {
          navigate('/admin/promo-codes');
        }
      }}
    />
  );
}
