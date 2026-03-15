import { useMemo, useState } from "react";

import { format } from "date-fns";
import { ArrowLeft, Eye } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type LearnerAssessmentFeedItem, useLearnerAssessmentFeed } from "@/hooks/useLearnerAssessmentFeed";

const ASSESSMENT_TYPE_OPTIONS = [
  { value: "all", label: "All assessment types" },
  { value: "epa", label: "EPA assessments" },
  { value: "direct", label: "Direct observations" },
  { value: "narrative", label: "Narrative assessments" },
  { value: "procedure", label: "Procedure observations" },
] as const;

const getSummary = (item: LearnerAssessmentFeedItem): string => {
  if (!item.summaryText) return "";
  return item.summaryText.length > 240 ? `${item.summaryText.slice(0, 240)}...` : item.summaryText;
};

const LearnerAssessmentsList = () => {
  const [filterType, setFilterType] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { feed = [], isLoading } = useLearnerAssessmentFeed();

  const filteredAssessments = useMemo(() => {
    return feed.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (dateFrom && new Date(item.created_at) < new Date(`${dateFrom}T00:00:00`)) return false;
      if (dateTo && new Date(item.created_at) > new Date(`${dateTo}T23:59:59`)) return false;
      return true;
    });
  }, [dateFrom, dateTo, feed, filterType]);

  return (
    <div className="container max-w-5xl space-y-6 py-8">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/student">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold">My assessments</h1>
        <p className="mt-2 text-muted-foreground">
          View EPA, direct, narrative, and procedure observations in one place.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Narrow by assessment type and date range</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Assessment type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSESSMENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>From date</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          </div>

          <div className="space-y-2">
            <Label>To date</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>{filteredAssessments.length} assessment(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredAssessments.length === 0 ? (
            <p className="text-muted-foreground">No assessments match your filters.</p>
          ) : (
            <ul className="space-y-3">
              {filteredAssessments.map((item) => (
                <li key={`${item.type}-${item.id}`} className="rounded-md border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.type === "procedure"
                          ? `${item.subtitle} · Observed by ${item.observerName ?? "Unknown"} · ${format(new Date(item.created_at), "PPp")}`
                          : `${item.subtitle} · ${item.observerName ? `Assessor ${item.observerName} · ` : ""}${format(new Date(item.created_at), "PPp")}`}
                      </p>
                    </div>
                    {item.statusOrRating && (
                      <Badge variant={item.type === "procedure" && item.statusOrRating === "submitted" ? "default" : "secondary"}>
                        {item.statusOrRating}
                      </Badge>
                    )}
                  </div>

                  {getSummary(item) ? (
                    <p className="mt-3 text-sm text-muted-foreground">{getSummary(item)}</p>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">No additional comments were provided.</p>
                  )}

                  {item.detailHref && (
                    <div className="mt-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={item.detailHref}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LearnerAssessmentsList;
