import { supabase } from '@/integrations/supabase/client';

export type ResourceType =
  | 'guideline'
  | 'review'
  | 'article'
  | 'video'
  | 'podcast'
  | 'pathway'
  | 'policy'
  | 'other';

export type ResourceLevel = 'student' | 'supervisor' | 'both';

export type ResourceStatus = 'pending' | 'approved' | 'archived';

export interface ResourceTag {
  id: string;
  tag_type: 'epa' | 'specialty' | 'keyword' | 'level';
  tag_value: string;
}

export interface ResourceTagGroup {
  epa: string[];
  specialty: string[];
  keyword: string[];
  level: string[];
}

export interface ResourceRow {
  id: string;
  title: string;
  url: string;
  resource_type: ResourceType;
  publisher: string | null;
  summary: string | null;
  estimated_minutes: number;
  level: ResourceLevel;
  status: ResourceStatus;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  tags?: ResourceTagGroup;
}

export interface ResourceRecommendationRow {
  id: string;
  student_id: string;
  supervisor_id: string;
  assessment_id: string | null;
  resource_id: string | null;
  url: string | null;
  title: string | null;
  resource_type: ResourceType | null;
  publisher: string | null;
  estimated_minutes: number;
  level: ResourceLevel;
  why_suggested: string;
  status: 'active' | 'removed';
  created_at: string;
  supervisor_name?: string | null;
  resource?: ResourceRow | null;
  tags?: ResourceTagGroup;
}

export interface LearningPlanItem {
  id: string;
  student_id: string;
  resource_recommendation_id: string;
  notes: string | null;
  status: 'saved' | 'completed' | 'archived';
  saved_at: string;
  completed_at: string | null;
  recommendation?: ResourceRecommendationRow | null;
}

const EMPTY_TAGS: ResourceTagGroup = {
  epa: [],
  specialty: [],
  keyword: [],
  level: [],
};

const groupTags = (tags: ResourceTag[] = []): ResourceTagGroup => {
  return tags.reduce<ResourceTagGroup>((acc, tag) => {
    acc[tag.tag_type] = [...acc[tag.tag_type], tag.tag_value];
    return acc;
  }, { ...EMPTY_TAGS });
};

const uniqueTags = (tags: Array<{ tag_type: ResourceTag['tag_type']; tag_value: string }>) => {
  const map = new Map<string, { tag_type: ResourceTag['tag_type']; tag_value: string }>();
  tags.forEach((tag) => {
    const key = `${tag.tag_type}:${tag.tag_value.trim().toLowerCase()}`;
    map.set(key, { tag_type: tag.tag_type, tag_value: tag.tag_value.trim() });
  });
  return Array.from(map.values()).filter((tag) => tag.tag_value.length > 0);
};

const fetchResourceTags = async (resourceIds: string[]) => {
  if (resourceIds.length === 0) return new Map<string, ResourceTagGroup>();
  const { data, error } = await supabase
    .from('resource_tag_map')
    .select('resource_id, tag:resource_tags(id, tag_type, tag_value)')
    .in('resource_id', resourceIds);

  if (error) throw error;

  const map = new Map<string, ResourceTag[]>();
  (data || []).forEach((row: any) => {
    if (!row.tag) return;
    const list = map.get(row.resource_id) || [];
    list.push(row.tag as ResourceTag);
    map.set(row.resource_id, list);
  });

  const grouped = new Map<string, ResourceTagGroup>();
  Array.from(map.entries()).forEach(([resourceId, tags]) => {
    grouped.set(resourceId, groupTags(tags));
  });
  return grouped;
};

const fetchRecommendationTags = async (recommendationIds: string[]) => {
  if (recommendationIds.length === 0) return new Map<string, ResourceTagGroup>();
  const { data, error } = await supabase
    .from('resource_recommendation_tag_map')
    .select('recommendation_id, tag:resource_tags(id, tag_type, tag_value)')
    .in('recommendation_id', recommendationIds);

  if (error) throw error;

  const map = new Map<string, ResourceTag[]>();
  (data || []).forEach((row: any) => {
    if (!row.tag) return;
    const list = map.get(row.recommendation_id) || [];
    list.push(row.tag as ResourceTag);
    map.set(row.recommendation_id, list);
  });

  const grouped = new Map<string, ResourceTagGroup>();
  Array.from(map.entries()).forEach(([recId, tags]) => {
    grouped.set(recId, groupTags(tags));
  });
  return grouped;
};

const upsertTags = async (tags: Array<{ tag_type: ResourceTag['tag_type']; tag_value: string }>) => {
  const cleaned = uniqueTags(tags);
  if (cleaned.length === 0) return [];

  const { data, error } = await supabase
    .from('resource_tags')
    .upsert(cleaned, { onConflict: 'tag_type,tag_value' })
    .select('id, tag_type, tag_value');

  if (error) throw error;
  return (data || []) as ResourceTag[];
};

const replaceResourceTags = async (resourceId: string, tagIds: string[]) => {
  await supabase.from('resource_tag_map').delete().eq('resource_id', resourceId);
  if (tagIds.length === 0) return;
  const payload = tagIds.map((tagId) => ({ resource_id: resourceId, tag_id: tagId }));
  const { error } = await supabase.from('resource_tag_map').insert(payload);
  if (error) throw error;
};

const replaceRecommendationTags = async (recommendationId: string, tagIds: string[]) => {
  await supabase.from('resource_recommendation_tag_map').delete().eq('recommendation_id', recommendationId);
  if (tagIds.length === 0) return;
  const payload = tagIds.map((tagId) => ({ recommendation_id: recommendationId, tag_id: tagId }));
  const { error } = await supabase.from('resource_recommendation_tag_map').insert(payload);
  if (error) throw error;
};

export async function searchApprovedResources(filters?: {
  query?: string;
  type?: ResourceType | 'all';
  level?: ResourceLevel | 'all';
  tagFilters?: Partial<Record<ResourceTag['tag_type'], string[]>>;
}): Promise<ResourceRow[]> {
  let query = supabase
    .from('resources')
    .select('*')
    .eq('status', 'approved')
    .is('archived_at', null)
    .order('title', { ascending: true });

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('resource_type', filters.type);
  }

  if (filters?.level && filters.level !== 'all') {
    query = query.eq('level', filters.level);
  }

  if (filters?.query) {
    const safe = filters.query.trim();
    if (safe) {
      query = query.or(`title.ilike.%${safe}%,publisher.ilike.%${safe}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  const resources = (data || []) as ResourceRow[];
  const tagsMap = await fetchResourceTags(resources.map((r) => r.id));

  const withTags = resources.map((resource) => ({
    ...resource,
    tags: tagsMap.get(resource.id) || { ...EMPTY_TAGS },
  }));

  if (filters?.tagFilters) {
    return withTags.filter((resource) => {
      const tags = resource.tags || EMPTY_TAGS;
      return Object.entries(filters.tagFilters || {}).every(([tagType, values]) => {
        if (!values || values.length === 0) return true;
        const tagValues = tags[tagType as ResourceTag['tag_type']] || [];
        return values.some((value) => tagValues.includes(value));
      });
    });
  }

  return withTags;
}

export async function adminCreateResource(payload: {
  title: string;
  url: string;
  resource_type: ResourceType;
  publisher?: string | null;
  summary?: string | null;
  estimated_minutes: number;
  level: ResourceLevel;
  tags?: Array<{ tag_type: ResourceTag['tag_type']; tag_value: string }>;
  created_by: string;
}): Promise<ResourceRow> {
  const { data, error } = await supabase
    .from('resources')
    .insert({
      title: payload.title,
      url: payload.url,
      resource_type: payload.resource_type,
      publisher: payload.publisher || null,
      summary: payload.summary || null,
      estimated_minutes: payload.estimated_minutes,
      level: payload.level,
      created_by: payload.created_by,
    })
    .select()
    .single();

  if (error) throw error;

  const resource = data as ResourceRow;
  if (payload.tags && payload.tags.length > 0) {
    const tags = await upsertTags(payload.tags);
    await replaceResourceTags(resource.id, tags.map((tag) => tag.id));
  }

  return resource;
}

export async function adminUpdateResource(resourceId: string, payload: Partial<ResourceRow> & {
  tags?: Array<{ tag_type: ResourceTag['tag_type']; tag_value: string }>;
}): Promise<ResourceRow> {
  const { tags, ...updates } = payload;
  const { data, error } = await supabase
    .from('resources')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', resourceId)
    .select()
    .single();

  if (error) throw error;
  const resource = data as ResourceRow;

  if (tags) {
    const tagRows = await upsertTags(tags);
    await replaceResourceTags(resourceId, tagRows.map((tag) => tag.id));
  }

  return resource;
}

export async function adminApproveResource(resourceId: string, approverId: string) {
  const { error } = await supabase
    .from('resources')
    .update({
      status: 'approved',
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      archived_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', resourceId);

  if (error) throw error;
}

export async function adminArchiveResource(resourceId: string) {
  const { error } = await supabase
    .from('resources')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', resourceId);

  if (error) throw error;
}

export async function createRecommendation(payload: {
  student_id: string;
  supervisor_id: string;
  assessment_id?: string | null;
  resource_id?: string | null;
  url?: string | null;
  title?: string | null;
  resource_type?: ResourceType | null;
  publisher?: string | null;
  estimated_minutes: number;
  level: ResourceLevel;
  why_suggested: string;
  tags?: Array<{ tag_type: ResourceTag['tag_type']; tag_value: string }>;
}): Promise<ResourceRecommendationRow> {
  const { data, error } = await supabase
    .from('resource_recommendations')
    .insert({
      student_id: payload.student_id,
      supervisor_id: payload.supervisor_id,
      assessment_id: payload.assessment_id || null,
      resource_id: payload.resource_id || null,
      url: payload.url || null,
      title: payload.title || null,
      resource_type: payload.resource_type || null,
      publisher: payload.publisher || null,
      estimated_minutes: payload.estimated_minutes,
      level: payload.level,
      why_suggested: payload.why_suggested,
    })
    .select()
    .single();

  if (error) throw error;

  const recommendation = data as ResourceRecommendationRow;

  if (payload.tags && payload.tags.length > 0) {
    const tags = await upsertTags(payload.tags);
    await replaceRecommendationTags(recommendation.id, tags.map((tag) => tag.id));
  }

  return recommendation;
}

export async function getSupervisorRecommendations(supervisorId: string, limit = 10) {
  const { data, error } = await supabase
    .from('resource_recommendations')
    .select('*, student:profiles!resource_recommendations_student_id_fkey(full_name), resource:resources(*)')
    .eq('supervisor_id', supervisorId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const recommendations = (data || []).map((row: any) => ({
    ...row,
    student_name: row.student?.full_name || 'Student',
    resource: row.resource || null,
  })) as Array<ResourceRecommendationRow & { student_name?: string }>;

  const resourceIds = recommendations
    .filter((rec) => rec.resource_id)
    .map((rec) => rec.resource_id as string);
  const tagsByResource = await fetchResourceTags(resourceIds);

  return recommendations.map((rec) => ({
    ...rec,
    tags: rec.resource_id ? tagsByResource.get(rec.resource_id) || { ...EMPTY_TAGS } : rec.tags,
  }));
}

export async function getStudentRecommendations(studentId: string): Promise<ResourceRecommendationRow[]> {
  const { data, error } = await supabase
    .from('resource_recommendations')
    .select('*, supervisor:profiles!resource_recommendations_supervisor_id_fkey(full_name), resource:resources(*)')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const recommendations = (data || []).map((row: any) => ({
    ...row,
    supervisor_name: row.supervisor?.full_name || 'Supervisor',
    resource: row.resource || null,
  })) as ResourceRecommendationRow[];

  const resourceIds = recommendations
    .filter((rec) => rec.resource_id)
    .map((rec) => rec.resource_id as string);

  const recIds = recommendations.map((rec) => rec.id);
  const tagsByResource = await fetchResourceTags(resourceIds);
  const tagsByRecommendation = await fetchRecommendationTags(recIds);

  return recommendations.map((rec) => ({
    ...rec,
    tags: rec.resource_id ? tagsByResource.get(rec.resource_id) || { ...EMPTY_TAGS } : tagsByRecommendation.get(rec.id) || { ...EMPTY_TAGS },
  }));
}

export async function saveToLearningPlan(studentId: string, recommendationId: string) {
  const { data, error } = await supabase
    .from('learning_plan_items')
    .upsert({
      student_id: studentId,
      resource_recommendation_id: recommendationId,
    }, {
      onConflict: 'student_id,resource_recommendation_id',
    })
    .select()
    .single();

  if (error) throw error;
  return data as LearningPlanItem;
}

export async function getLearningPlanItems(studentId: string): Promise<LearningPlanItem[]> {
  const { data, error } = await supabase
    .from('learning_plan_items')
    .select('*, recommendation:resource_recommendations(*)')
    .eq('student_id', studentId)
    .order('saved_at', { ascending: false });

  if (error) throw error;
  return (data || []) as LearningPlanItem[];
}

export async function updateLearningPlanItem(itemId: string, payload: {
  status?: LearningPlanItem['status'];
  notes?: string | null;
}) {
  const update: Record<string, any> = {
    ...payload,
  };

  if (payload.status === 'completed') {
    update.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('learning_plan_items')
    .update(update)
    .eq('id', itemId);

  if (error) throw error;
}
