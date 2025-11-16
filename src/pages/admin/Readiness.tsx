import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Row = {
  learnerName: string;
  status: 'Needs attention' | 'Emerging' | 'On track' | 'Ready';
  lastWbaAt: string | null;
  avgOscore: number | null;
};

const ReadinessAdmin = () => {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    // Placeholder: will be backed by SQL view/RPC
    setRows([]);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Learner Readiness</h1>
      <Card>
        <CardHeader>
          <CardTitle>Stalled learners</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stalled learners detected for the current filters.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.learnerName} className="flex items-center justify-between border rounded-md p-3">
                  <div className="space-y-1">
                    <div className="font-medium">{r.learnerName}</div>
                    <div className="text-xs text-muted-foreground">
                      Last WBA: {r.lastWbaAt ? new Date(r.lastWbaAt).toLocaleDateString() : '—'} • Avg O-SCORE:{' '}
                      {r.avgOscore?.toFixed(1) ?? '—'}
                    </div>
                  </div>
                  <Badge variant="secondary">{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReadinessAdmin;


