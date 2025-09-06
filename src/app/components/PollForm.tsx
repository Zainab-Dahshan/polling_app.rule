'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

// Define the form schema with Zod
const pollFormSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters'),
  options: z.array(
    z.object({
      text: z.string().min(1, 'Option must not be empty')
    })
  ).min(2, 'At least 2 options are required')
});

// TypeScript type for the form data
type PollFormData = z.infer<typeof pollFormSchema>;

export default function PollForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PollFormData>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      question: '',
      options: [
        { text: '' },
        { text: '' }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options'
  });

  const onSubmit = async (data: PollFormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      toast({
        title: 'Success',
        description: 'Poll created successfully!',
      });

      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create poll. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="question">Question</Label>
        <Input
          id="question"
          {...form.register('question')}
          placeholder="Enter your poll question"
        />
        {form.formState.errors.question && (
          <p className="text-sm text-red-500">{form.formState.errors.question.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label>Options</Label>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <Input
              {...form.register(`options.${index}.text`)}
              placeholder={`Option ${index + 1}`}
            />
            {index >= 2 && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => remove(index)}
              >
                ×
              </Button>
            )}
          </div>
        ))}
        {form.formState.errors.options && (
          <p className="text-sm text-red-500">{form.formState.errors.options.message}</p>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ text: '' })}
        >
          Add Option
        </Button>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Poll'}
      </Button>
    </form>
  );
}