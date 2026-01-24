import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminRecentActivityWidget() {
  const activity = [
    { action: 'New user registered', user: 'Dr. Sarah Chen', time: '2 hours ago', type: 'success' },
    { action: 'Role updated', user: 'Dr. Michael Rodriguez', time: '4 hours ago', type: 'info' },
    { action: 'Assessment submitted', user: 'Dr. Emily Watson', time: '6 hours ago', type: 'success' },
    { action: 'System backup completed', user: 'System', time: '12 hours ago', type: 'info' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest changes to the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 md:space-y-4">
          {activity.map((item, index) => (
            <div
              key={`${item.action}-${index}`}
              className="flex flex-col justify-between gap-2 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center md:p-4"
            >
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-foreground md:text-base">{item.action}</h4>
                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                  {item.user} • {item.time}
                </p>
              </div>
              <Badge
                variant={item.type === 'success' ? 'default' : 'secondary'}
                className="shrink-0 self-start sm:self-center"
              >
                {item.type}
              </Badge>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Link to="/admin/activity">
            <Button variant="outline" size="sm">
              View All Activity
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
