import { useState, useEffect } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Goal, CreateGoalInput, GoalType, GoalPeriod } from '@/hooks/useGoals';

const goalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  type: z.enum(['assessment_count', 'oscore_target', 'streak_days', 'epa_readiness', 'feedback_quality', 'weekly_active', 'custom']),
  target_value: z.number().positive('Target must be greater than 0'),
  unit: z.string().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateGoalInput) => Promise<void>;
  goal?: Goal | null;
}

export function GoalForm({ open, onOpenChange, onSubmit, goal }: GoalFormProps) {
  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: goal?.title || '',
      description: goal?.description || '',
      type: goal?.type || 'assessment_count',
      target_value: goal?.target_value || 1,
      unit: goal?.unit || '',
      period: goal?.period || 'monthly',
      start_date: goal?.start_date || new Date().toISOString().split('T')[0],
      end_date: goal?.end_date || '',
    },
  });

  useEffect(() => {
    if (goal) {
      form.reset({
        title: goal.title,
        description: goal.description || '',
        type: goal.type,
        target_value: goal.target_value,
        unit: goal.unit || '',
        period: goal.period || 'monthly',
        start_date: goal.start_date,
        end_date: goal.end_date || '',
      });
    } else {
      form.reset({
        title: '',
        description: '',
        type: 'assessment_count',
        target_value: 1,
        unit: '',
        period: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
      });
    }
  }, [goal, form]);

  const handleSubmit = async (data: z.infer<typeof goalSchema>) => {
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting goal:', error);
    }
  };

  const goalType = form.watch('type');

  // Set default unit based on type
  useEffect(() => {
    if (!goal) {
      switch (goalType) {
        case 'assessment_count':
          form.setValue('unit', 'assessments');
          break;
        case 'oscore_target':
          form.setValue('unit', 'points');
          break;
        case 'streak_days':
          form.setValue('unit', 'days');
          break;
        case 'epa_readiness':
          form.setValue('unit', '%');
          break;
        default:
          form.setValue('unit', '');
      }
    }
  }, [goalType, form, goal]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          <DialogDescription>
            Set a goal to track your progress and stay motivated.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Complete 10 assessments this month" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add more details about your goal..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="assessment_count">Assessment Count</SelectItem>
                        <SelectItem value="oscore_target">O-Score Target</SelectItem>
                        <SelectItem value="streak_days">Streak Days</SelectItem>
                        <SelectItem value="epa_readiness">EPA Readiness</SelectItem>
                        <SelectItem value="feedback_quality">Feedback Quality</SelectItem>
                        <SelectItem value="weekly_active">Weekly Activity</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., assessments, days, points" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'monthly'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{goal ? 'Update' : 'Create'} Goal</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

