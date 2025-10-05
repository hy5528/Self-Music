import type { MusicMoment, MomentComment, ApiResponse, PaginatedResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface MomentFilters {
  page?: number;
  limit?: number;
  tags?: string;
  energyLevel?: number;
  year?: number;
}

class MomentsAPI {
  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async getMoments(filters?: MomentFilters): Promise<ApiResponse<PaginatedResponse<MusicMoment>>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }

    const response = await fetch(`${API_BASE_URL}/moments?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch moments');
    return response.json();
  }

  async getMoment(id: string): Promise<MusicMoment> {
    const response = await fetch(`${API_BASE_URL}/moments/${id}`);
    if (!response.ok) throw new Error('Failed to fetch moment');
    return response.json();
  }

  async getSongMoment(songId: string): Promise<ApiResponse<MusicMoment | null>> {
    const response = await fetch(`${API_BASE_URL}/songs/${songId}/moment`);
    if (!response.ok) throw new Error('Failed to fetch song moment');
    return response.json();
  }

  async likeMoment(momentId: string): Promise<ApiResponse<{ momentId: string; likeCount: number }>> {
    const response = await fetch(`${API_BASE_URL}/moments/${momentId}/like`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to like moment');
    return response.json();
  }

  // Admin methods
  async createMoment(moment: Partial<MusicMoment>): Promise<ApiResponse<MusicMoment>> {
    const response = await fetch(`${API_BASE_URL}/admin/moments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(moment)
    });
    if (!response.ok) throw new Error('Failed to create moment');
    return response.json();
  }

  async updateMoment(id: string, moment: Partial<MusicMoment>): Promise<ApiResponse<MusicMoment>> {
    const response = await fetch(`${API_BASE_URL}/admin/moments/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(moment)
    });
    if (!response.ok) throw new Error('Failed to update moment');
    return response.json();
  }

  async deleteMoment(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/admin/moments/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete moment');
    return response.json();
  }

  async addComment(momentId: string, comment: Partial<MomentComment>): Promise<ApiResponse<MomentComment>> {
    const response = await fetch(`${API_BASE_URL}/admin/moments/${momentId}/comments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(comment)
    });
    if (!response.ok) throw new Error('Failed to add comment');
    return response.json();
  }

  async deleteComment(momentId: string, commentId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/admin/moments/${momentId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete comment');
    return response.json();
  }
}

export const momentsAPI = new MomentsAPI();
