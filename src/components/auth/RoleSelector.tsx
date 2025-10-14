import { GraduationCap, Shield, UserCheck } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { UserRole } from '@/lib/roleManagement';

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
}

const roleInfo = {
  student: {
    label: 'Student / Resident',
    description: 'I am a medical student or resident being assessed',
    icon: GraduationCap,
    color: 'text-blue-600 dark:text-blue-400',
  },
  supervisor: {
    label: 'Supervisor / Faculty',
    description: 'I provide assessments and feedback to students',
    icon: UserCheck,
    color: 'text-purple-600 dark:text-purple-400',
  },
  admin: {
    label: 'Program Administrator',
    description: 'I manage the program and user accounts',
    icon: Shield,
    color: 'text-red-600 dark:text-red-400',
  },
};

export function RoleSelector({ value, onChange, disabled = false }: RoleSelectorProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor="role-selector">I am a:</Label>
      <RadioGroup
        id="role-selector"
        value={value}
        onValueChange={(val) => onChange(val as UserRole)}
        disabled={disabled}
        className="space-y-3"
      >
        {(Object.entries(roleInfo) as [UserRole, typeof roleInfo.student][]).map(
          ([role, info]) => {
            const Icon = info.icon;
            return (
              <div
                key={role}
                className="relative flex items-start space-x-3 rounded-lg border border-border p-4 transition-all hover:border-primary/50 hover:bg-accent/5"
              >
                <RadioGroupItem value={role} id={`role-${role}`} className="mt-1" />
                <label
                  htmlFor={`role-${role}`}
                  className="flex flex-1 cursor-pointer flex-col"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${info.color}`} aria-hidden="true" />
                    <span className="font-medium text-foreground">{info.label}</span>
                  </div>
                  <span className="mt-1 text-sm text-muted-foreground">
                    {info.description}
                  </span>
                </label>
              </div>
            );
          }
        )}
      </RadioGroup>
      <p className="text-xs text-muted-foreground">
        Your role determines what features you can access. You can request additional roles later.
      </p>
    </div>
  );
}

