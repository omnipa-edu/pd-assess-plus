import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { content } from '@/content/strings';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  showStrength?: boolean;
  required?: boolean;
  'aria-describedby'?: string;
}

export const PasswordInput = ({
  id,
  value,
  onChange,
  showStrength = false,
  required = false,
  'aria-describedby': ariaDescribedBy,
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (password: string): { level: string; color: string; width: string } => {
    if (password.length === 0) return { level: '', color: '', width: '0%' };
    if (password.length < 8) return { level: content.auth.passwordStrength.weak, color: 'bg-red-500', width: '25%' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: content.auth.passwordStrength.fair, color: 'bg-orange-500', width: '50%' };
    if (strength <= 3) return { level: content.auth.passwordStrength.good, color: 'bg-yellow-500', width: '75%' };
    return { level: content.auth.passwordStrength.strong, color: 'bg-green-500', width: '100%' };
  };

  const strength = showStrength ? getPasswordStrength(value) : null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          aria-describedby={ariaDescribedBy}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? content.auth.buttons.hidePassword : content.auth.buttons.showPassword}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Password strength indicator */}
      {showStrength && value.length > 0 && strength && (
        <div className="space-y-1" role="status" aria-live="polite">
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${strength.color}`}
              style={{ width: strength.width }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {strength.level}
          </p>
        </div>
      )}
    </div>
  );
};

