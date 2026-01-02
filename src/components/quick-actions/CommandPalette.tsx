import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useAuth } from '@/hooks/useAuth';

interface CommandAction {
  id: string;
  label: string;
  shortcut?: string;
  icon?: string;
  group: string;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { hasRole, signOut } = useAuth();

  const isSupervisor = hasRole('supervisor');
  const isStudent = hasRole('student');
  const isAdmin = hasRole('admin');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands: CommandAction[] = [
    // Navigation
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      shortcut: '⌘D',
      group: 'Navigation',
      action: () => {
        navigate('/dashboard');
        setOpen(false);
      },
    },
    ...(isStudent
      ? [
          {
            id: 'student-dashboard',
            label: 'Student Dashboard',
            shortcut: '⌘S',
            group: 'Navigation',
            action: () => {
              navigate('/student');
              setOpen(false);
            },
          },
        ]
      : []),
    ...(isSupervisor
      ? [
          {
            id: 'supervisor-dashboard',
            label: 'Supervisor Dashboard',
            shortcut: '⌘V',
            group: 'Navigation',
            action: () => {
              navigate('/supervisor');
              setOpen(false);
            },
          },
          {
            id: 'my-students',
            label: 'My Students',
            group: 'Navigation',
            action: () => {
              navigate('/supervisor/students');
              setOpen(false);
            },
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            id: 'admin-dashboard',
            label: 'Admin Dashboard',
            shortcut: '⌘A',
            group: 'Navigation',
            action: () => {
              navigate('/admin');
              setOpen(false);
            },
          },
        ]
      : []),

    // Quick Actions
    ...(isSupervisor
      ? [
          {
            id: 'new-assessment',
            label: 'New Assessment',
            shortcut: '⌘N',
            group: 'Quick Actions',
            action: () => {
              navigate('/dashboard');
              setOpen(false);
            },
          },
          {
            id: 'epa-observation',
            label: 'EPA Observation',
            group: 'Quick Actions',
            action: () => {
              navigate('/dashboard');
              setOpen(false);
            },
          },
          {
            id: 'direct-observation',
            label: 'Direct Observation',
            group: 'Quick Actions',
            action: () => {
              navigate('/dashboard');
              setOpen(false);
            },
          },
        ]
      : []),

    // Settings
    {
      id: 'notifications',
      label: 'Notifications',
      shortcut: '⌘K',
      group: 'Settings',
      action: () => {
        // Open notifications - you can implement this
        setOpen(false);
      },
    },
    {
      id: 'sign-out',
      label: 'Sign Out',
      shortcut: '⌘⇧Q',
      group: 'Settings',
      action: async () => {
        await signOut();
        navigate('/auth');
        setOpen(false);
      },
    },
  ];

  const groupedCommands = commands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) {
      acc[cmd.group] = [];
    }
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, CommandAction[]>);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedCommands).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((cmd) => (
              <CommandItem key={cmd.id} onSelect={cmd.action}>
                <span>{cmd.label}</span>
                {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
            <CommandSeparator />
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

