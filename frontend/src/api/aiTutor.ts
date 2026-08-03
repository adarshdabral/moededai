import { apiClient } from './client';
import type { ApiSuccessBody, PaginationMeta } from '@/types/api';
import type { ConversationDetailDTO, ConversationSummaryDTO } from '@/types/domain';

export async function startConversation(topicId?: string): Promise<ConversationDetailDTO> {
  const res = await apiClient.post<ApiSuccessBody<ConversationDetailDTO>>(
    '/ai-tutor/conversations',
    { topicId }
  );
  return res.data.data;
}

export async function sendMessage(
  conversationId: string,
  message: string
): Promise<ConversationDetailDTO> {
  const res = await apiClient.post<ApiSuccessBody<ConversationDetailDTO>>(
    `/ai-tutor/conversations/${conversationId}/messages`,
    { message }
  );
  return res.data.data;
}

export async function getConversation(conversationId: string): Promise<ConversationDetailDTO> {
  const res = await apiClient.get<ApiSuccessBody<ConversationDetailDTO>>(
    `/ai-tutor/conversations/${conversationId}`
  );
  return res.data.data;
}

export async function listConversations(
  page = 1,
  limit = 20
): Promise<{ items: ConversationSummaryDTO[]; pagination: PaginationMeta }> {
  const res = await apiClient.get<ApiSuccessBody<ConversationSummaryDTO[]>>(
    '/ai-tutor/conversations',
    { params: { page, limit } }
  );
  return { items: res.data.data, pagination: res.data.meta!.pagination };
}
