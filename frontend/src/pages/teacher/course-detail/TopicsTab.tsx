import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, ChevronRight, Link as LinkIcon, Plus, Trash2, Upload } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { FileDropzone } from '@/components/upload/FileDropzone';
import {
  useCreateLinkResource,
  useCreateTopic,
  useDeleteResource,
  useDeleteTopic,
  useResources,
  useTopics,
  useUploadResource,
} from '@/hooks/useCourses';
import { toast } from '@/components/ui/toastStore';
import { getApiErrorMessage } from '@/api/client';

const topicSchema = z.object({ title: z.string().min(1).max(150), order: z.coerce.number().int().min(0) });
type TopicFormValues = z.infer<typeof topicSchema>;

function TopicResources({ topicId }: { topicId: string }) {
  const { data: resources, isLoading } = useResources(topicId);
  const createLink = useCreateLinkResource(topicId);
  const uploadResource = useUploadResource(topicId);
  const deleteResource = useDeleteResource(topicId);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkType, setLinkType] = useState<'document' | 'video' | 'link'>('link');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  return (
    <div className="space-y-3 border-t border-border bg-paper-sunken/40 p-4">
      {isLoading && <Skeleton className="h-10" />}
      <ul className="space-y-1.5">
        {resources?.map((r) => (
          <li key={r.id} className="flex items-center justify-between rounded-md bg-paper-raised px-3 py-2 text-sm">
            <span className="flex items-center gap-2 text-ink">
              <LinkIcon className="size-3.5 text-board" />
              {r.title}
            </span>
            <button onClick={() => deleteResource.mutate(r.id)} aria-label="Delete resource" className="text-ink-faint hover:text-flag">
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[7rem_1fr_1fr_auto]">
        <Select value={linkType} onChange={(e) => setLinkType(e.target.value as typeof linkType)}>
          <option value="link">Link</option>
          <option value="document">Document</option>
          <option value="video">Video</option>
        </Select>
        <Input placeholder="Title" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
        <Input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
        <Button
          size="sm"
          isLoading={createLink.isPending}
          onClick={() => {
            if (!linkTitle || !linkUrl) return;
            createLink.mutate(
              { type: linkType, title: linkTitle, url: linkUrl },
              {
                onSuccess: () => {
                  setLinkTitle('');
                  setLinkUrl('');
                },
                onError: (error) => toast.error('Could not add resource', getApiErrorMessage(error)),
              }
            );
          }}
        >
          Add link
        </Button>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <FileDropzone
            selectedFile={file}
            onFileSelected={setFile}
            onClear={() => setFile(null)}
            uploadProgress={uploadResource.isPending ? progress : undefined}
          />
        </div>
        {file && (
          <Button
            size="sm"
            leftIcon={<Upload className="size-3.5" />}
            isLoading={uploadResource.isPending}
            onClick={() =>
              uploadResource.mutate(
                { title: file.name, file, onProgress: setProgress },
                {
                  onSuccess: () => setFile(null),
                  onError: (error) => toast.error('Upload failed', getApiErrorMessage(error)),
                }
              )
            }
          >
            Upload
          </Button>
        )}
      </div>
    </div>
  );
}

export function TopicsTab({ courseId }: { courseId: string }) {
  const { data: topics, isLoading } = useTopics(courseId);
  const createTopic = useCreateTopic(courseId);
  const deleteTopic = useDeleteTopic(courseId);
  const [expanded, setExpanded] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TopicFormValues>({ resolver: zodResolver(topicSchema), defaultValues: { order: (topics?.length ?? 0) + 1 } });

  return (
    <div className="space-y-4">
      <form
        className="flex items-end gap-2"
        onSubmit={handleSubmit((values) =>
          createTopic.mutate(values, {
            onSuccess: () => reset({ title: '', order: values.order + 1 }),
            onError: (error) => toast.error('Could not add topic', getApiErrorMessage(error)),
          })
        )}
      >
        <div className="flex-1">
          <Label htmlFor="topic-title">New topic</Label>
          <Input id="topic-title" placeholder="Topic title" {...register('title')} error={errors.title?.message} />
        </div>
        <div className="w-24">
          <Label htmlFor="topic-order">Order</Label>
          <Input id="topic-order" type="number" {...register('order')} />
        </div>
        <Button type="submit" leftIcon={<Plus className="size-4" />} isLoading={createTopic.isPending}>
          Add
        </Button>
      </form>

      {isLoading && <Skeleton className="h-24" />}
      {!isLoading && topics?.length === 0 && <EmptyState title="No topics yet" description="Add your first topic above." />}

      <div className="space-y-2">
        {topics?.map((topic) => (
          <Card key={topic.id}>
            <button
              onClick={() => setExpanded(expanded === topic.id ? null : topic.id)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                {expanded === topic.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                {topic.order}. {topic.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTopic.mutate(topic.id);
                }}
                aria-label="Delete topic"
                className="text-ink-faint hover:text-flag"
              >
                <Trash2 className="size-4" />
              </button>
            </button>
            {expanded === topic.id && <TopicResources topicId={topic.id} />}
          </Card>
        ))}
      </div>
    </div>
  );
}
