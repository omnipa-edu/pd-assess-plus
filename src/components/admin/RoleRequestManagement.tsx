import { useEffect, useState } from 'react';

import { CheckCircle, Loader2, Shield, UserCheck, GraduationCap, XCircle, Clock } from 'lucide-react';

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
import { useToast } from '@/hooks/use-toast';
import type { UserRole, RoleRequest } from '@/lib/roleManagement';
import {
  approveRoleRequest,
  rejectRoleRequest,
  getPendingRoleRequests,
} from '@/lib/roleManagement';

const roleIcons = {
  student: GraduationCap,
  supervisor: UserCheck,
  admin: Shield,
};

export function RoleRequestManagement() {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await getPendingRoleRequests();

    if (error) {
      toast({
        title: 'Error loading requests',
        description: error.message || 'Failed to fetch role requests',
        variant: 'destructive',
      });
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (request: RoleRequest) => {
    setActionLoading(`approve-${request.id}`);

    const { error } = await approveRoleRequest(
      request.id,
      request.user_id,
      request.requested_role
    );

    if (error) {
      toast({
        title: 'Error approving request',
        description: error.message || 'Failed to approve request',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Request approved',
        description: `User granted ${request.requested_role} role`,
      });
      await loadRequests();
    }

    setActionLoading(null);
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(`reject-${requestId}`);

    const { error } = await rejectRoleRequest(requestId);

    if (error) {
      toast({
        title: 'Error rejecting request',
        description: error.message || 'Failed to reject request',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Request rejected',
        description: 'Role request has been rejected',
      });
      await loadRequests();
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
        <CardTitle>Pending Role Requests</CardTitle>
        <CardDescription>
          Review and approve or reject role change requests from users
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>No pending role requests</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Requested Role</TableHead>
                <TableHead>Justification</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => {
                const Icon = roleIcons[request.requested_role];
                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{request.user_id}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Icon className="mr-1 h-3 w-3" />
                        {request.requested_role}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm text-muted-foreground">
                        {request.justification || 'No justification provided'}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          disabled={!!actionLoading}
                          className="h-8"
                        >
                          {actionLoading === `approve-${request.id}` ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                          disabled={!!actionLoading}
                          className="h-8"
                        >
                          {actionLoading === `reject-${request.id}` ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <XCircle className="mr-1 h-3 w-3" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

