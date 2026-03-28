import { useState } from 'react';

import { Plus, X, ClipboardList, FileText, BookOpen, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'secondary';
}

export function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const isSupervisor = hasRole('supervisor');

  if (!isSupervisor) return null;

  const quickActions: QuickAction[] = [
    {
      label: 'Quick feedback',
      icon: <Zap className="h-4 w-4" />,
      onClick: () => {
        navigate('/supervisor?assessment=quick');
        setOpen(false);
      },
      variant: 'default',
    },
    {
      label: 'EPA Observation',
      icon: <ClipboardList className="h-4 w-4" />,
      onClick: () => {
        navigate('/supervisor');
        setOpen(false);
      },
      variant: 'default',
    },
    {
      label: 'Direct Observation',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => {
        navigate('/supervisor');
        setOpen(false);
      },
      variant: 'default',
    },
    {
      label: 'Narrative Assessment',
      icon: <BookOpen className="h-4 w-4" />,
      onClick: () => {
        navigate('/supervisor');
        setOpen(false);
      },
      variant: 'default',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        {/* Quick Actions */}
        <div
          className={cn(
            "absolute bottom-16 right-0 flex flex-col gap-2 transition-all duration-300",
            open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          {quickActions.map((action, index) => (
            <Button
              key={action.label}
              variant={action.variant || 'default'}
              size="sm"
              className={cn(
                "shadow-lg whitespace-nowrap justify-start gap-2",
                "animate-in fade-in slide-in-from-bottom-2",
                open && `delay-${index * 50}`
              )}
              onClick={action.onClick}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>

        {/* Main FAB Button */}
        <Button
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
            open && "rotate-45"
          )}
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </div>
    </div>
  );
}

