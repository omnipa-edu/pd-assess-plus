import { useState } from 'react';

import { Target, Plus, Trophy } from 'lucide-react';

import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useGoals, type CreateGoalInput } from '@/hooks/useGoals';
import { useToast } from '@/hooks/use-toast';

interface GoalsDisplayProps {
  className?: string;
}

export function GoalsDisplay({ className }: GoalsDisplayProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const { toast } = useToast();
  const { goals, activeGoals, completedGoals, isLoading, createGoal, updateGoal, deleteGoal } = useGoals();

  const handleCreateGoal = async (data: CreateGoalInput) => {
    try {
      await createGoal(data);
      toast({
        title: 'Goal created!',
        description: 'Your new goal has been set.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create goal',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateGoal = async (data: CreateGoalInput) => {
    if (!editingGoal) return;
    
    try {
      await updateGoal({ id: editingGoal.id, updates: data });
      toast({
        title: 'Goal updated!',
        description: 'Your goal has been updated.',
      });
      setEditingGoal(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update goal',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      toast({
        title: 'Goal deleted',
        description: 'Your goal has been removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete goal',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn(className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goals
              </CardTitle>
              <CardDescription>
                {activeGoals.length} active, {completedGoals.length} completed
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No goals yet"
              description="Set your first goal to start tracking your progress and stay motivated!"
              primaryAction={{
                label: 'Create Goal',
                onClick: () => setShowForm(true),
              }}
            />
          ) : (
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">
                  Active ({activeGoals.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedGoals.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-4 space-y-4">
                {activeGoals.length === 0 ? (
                  <EmptyState
                    icon={Target}
                    title="No active goals"
                    description="Create a new goal to get started!"
                    primaryAction={{
                      label: 'Create Goal',
                      onClick: () => setShowForm(true),
                    }}
                  />
                ) : (
                  <div className="grid gap-4">
                    {activeGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onEdit={setEditingGoal}
                        onDelete={handleDeleteGoal}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="mt-4 space-y-4">
                {completedGoals.length === 0 ? (
                  <EmptyState
                    icon={Trophy}
                    title="No completed goals yet"
                    description="Complete your active goals to see them here!"
                  />
                ) : (
                  <div className="grid gap-4">
                    {completedGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <GoalForm
        open={showForm || !!editingGoal}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingGoal(null);
          }
        }}
        onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
        goal={editingGoal}
      />
    </>
  );
}

