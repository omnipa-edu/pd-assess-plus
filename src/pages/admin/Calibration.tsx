import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type Row = {
  supervisorName: string;
  wbaCount: number;
  supervisorMedian: number;
  cohortMedian: number;
  category: 'Aligned' | 'More lenient' | 'Stricter';
  distribution: number[]; // counts for scores 1..5
};

const Calibration = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [specialty, setSpecialty] = useState<string>('all');
  const [epa, setEpa] = useState<string>('all');
  const [window, setWindow] = useState<string>('6m');

  useEffect(() => {
    // Placeholder: fetch analytics via RPC in future
    setRows([]);
  }, [specialty, epa, window]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Supervisor Calibration</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select value={specialty} onValueChange={setSpecialty}>
          <SelectTrigger><SelectValue placeholder="Specialty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All specialties</SelectItem>
          </SelectContent>
        </Select>
        <Select value={epa} onValueChange={setEpa}>
          <SelectTrigger><SelectValue placeholder="EPA" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All EPAs</SelectItem>
          </SelectContent>
        </Select>
        <Select value={window} onValueChange={setWindow}>
          <SelectTrigger><SelectValue placeholder="Time window" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="6m">Last 6 months</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supervisors</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data yet for the selected filters.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.supervisorName} className="flex items-center justify-between border rounded-md p-3">
                  <div className="space-y-1">
                    <div className="font-medium">{r.supervisorName}</div>
                    <div className="text-xs text-muted-foreground">
                      WBAs: {r.wbaCount} • Median: {r.supervisorMedian.toFixed(1)} vs cohort {r.cohortMedian.toFixed(1)}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      r.category === 'Aligned'
                        ? ''
                        : r.category === 'More lenient'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white'
                    }
                  >
                    {r.category}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Use this view to support calibration and faculty development. Do not share individual labels widely or use them punitively.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Calibration;


