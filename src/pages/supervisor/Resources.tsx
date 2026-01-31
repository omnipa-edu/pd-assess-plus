/**
 * Supervisor Resource Library
 * View approved resources; add to library or recommend to students.
 */
import { useEffect, useState } from 'react';

import { ArrowLeft, BookOpen, ExternalLink, Loader2, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { ResourceLibraryDialog } from '@/components/resources/ResourceLibraryDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  searchApprovedResources,
  type ResourceLevel,
  type ResourceRow,
  type ResourceType,
} from '@/lib/resources';

const RESOURCE_TYPES: ResourceType[] = [
  'guideline',
  'review',
  'article',
  'video',
  'podcast',
  'pathway',
  'policy',
  'other',
];

const RESOURCE_LEVELS: ResourceLevel[] = ['student', 'supervisor', 'both'];

export default function SupervisorResources() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<ResourceLevel | 'all'>('all');
  const [addLibraryOpen, setAddLibraryOpen] = useState(false);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await searchApprovedResources({
        query: search.trim() || undefined,
        type: typeFilter,
        level: levelFilter,
      });
      setResources(data);
    } catch (e: any) {
      toast({
        title: 'Failed to load resources',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [typeFilter, levelFilter]);

  const handleSearch = () => loadResources();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/supervisor')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Resource Library</h1>
                <p className="text-sm text-muted-foreground">
                  Browse approved resources to recommend to learners
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setAddLibraryOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add to library
              </Button>
              <Button variant="outline" asChild>
                <Link to="/supervisor">Back to dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px] space-y-2">
            <Label>Search</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Title or publisher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="secondary" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ResourceType | 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {RESOURCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Level</Label>
            <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as ResourceLevel | 'all')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {RESOURCE_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : resources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BookOpen className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No resources match your filters.</p>
              <p className="text-sm">Add a resource to the library from the dashboard or above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <Card key={resource.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-2 text-base">{resource.title}</CardTitle>
                  <CardDescription className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {resource.resource_type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {resource.level}
                    </Badge>
                    {resource.estimated_minutes > 0 && (
                      <span className="text-xs">~{resource.estimated_minutes} min</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  {resource.summary && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{resource.summary}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <ResourceLibraryDialog
        open={addLibraryOpen}
        onOpenChange={setAddLibraryOpen}
        onCreated={() => {
          loadResources();
        }}
      />
    </div>
  );
}
