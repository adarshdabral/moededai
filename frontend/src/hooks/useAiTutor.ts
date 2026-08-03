import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as aiTutorApi from '@/api/aiTutor';

export function useConversations(page = 1) {
  return useQuery({
    queryKey: ['conversations', page],
    queryFn: () => aiTutorApi.listConversations(page),
  });
}

export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', 'detail', conversationId],
    queryFn: () => aiTutorApi.getConversation(conversationId!),
    enabled: Boolean(conversationId),
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiTutorApi.startConversation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { conversationId: string; message: string }) =>
      aiTutorApi.sendMessage(input.conversationId, input.message),
    onSuccess: (updated, input) => {
      queryClient.setQueryData(['conversations', 'detail', input.conversationId], updated);
      queryClient.invalidateQueries({ queryKey: ['conversations'], exact: false });
    },
  });
}
