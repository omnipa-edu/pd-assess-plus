import { useEffect, useState } from 'react';

import { Loader2, Shield, UserCheck, GraduationCap, CheckCircle, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/roleManagement';
import {
  assignUserRole,
  removeUserRole,
  getUsersWithRoles,
  type UserWithRoles,
} from '@/lib/roleManagement';

const roleIcons = {
  student: GraduationCap,
  supervisor: UserCheck,
  admin: Shield,
};

const roleColors = {
  student: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  supervisor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function UserRoleManagement() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await getUsersWithRoles();

    if (error) {
      toast({
        title: 'Error loading users',
        description: error.message || 'Failed to fetch users',
        variant: 'destructive',
      });
    } else {
      setUsers(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAssignRole = async (userId: string, role: UserRole) => {
    setActionLoading(`${userId}-${role}`);

    const { error } = await assignUserRole(userId, role);

    if (error) {
      toast({
        title: 'Error assigning role',
        description: error.message || 'Failed to assign role',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Role assigned',
        description: `Successfully assigned ${role} role`,
      });
      await loadUsers();
    }

    setActionLoading(null);
  };

  const handleRemoveRole = async (userId: string, role: UserRole) => {
    setActionLoading(`${userId}-remove-${role}`);

    const { error } = await removeUserRole(userId, role);

    if (error) {
      toast({
        title: 'Error removing role',
        description: error.message || 'Failed to remove role',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Role removed',
        description: `Successfully removed ${role} role`,
      });
      await loadUsers();
    }

    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Role Management</CardTitle>
        <CardDescription>
          Assign and manage roles for all users in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Roles</TableHead>
              <TableHead>Assign Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell className="font-medium">
                  {user.full_name || 'No name'}
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role) => {
                        const Icon = roleIcons[role as UserRole];
                        return (
                          <Badge
                            key={role}
                            variant="secondary"
                            className={roleColors[role as UserRole]}
                          >
                            <Icon className="mr-1 h-3 w-3" />
                            {role}
                          </Badge>
                        );
                      })
                    ) : (
                      <Badge variant="outline">No roles</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    onValueChange={(role) => handleAssignRole(user.user_id, role as UserRole)}
                    disabled={!!actionLoading}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Add role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">
                        <div className="flex items-center">
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Student
                        </div>
                      </SelectItem>
                      <SelectItem value="supervisor">
                        <div className="flex items-center">
                          <UserCheck className="mr-2 h-4 w-4" />
                          Supervisor
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {user.roles?.map((role) => (
                      <Button
                        key={`remove-${role}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRole(user.user_id, role as UserRole)}
                        disabled={actionLoading === `${user.user_id}-remove-${role}`}
                        className="h-7 text-xs"
                      >
                        {actionLoading === `${user.user_id}-remove-${role}` ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        Remove {role}
                      </Button>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {users.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            No users found
          </div>
        )}
      </CardContent>
    </Card>
  );
}

