'use client';

import { useState, useEffect } from 'react';
import { momentsAPI } from '@/lib/moments-api';
import type { MusicMoment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { usePlayerStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';

export default function MomentsPage() {
  const [moments, setMoments] = useState<MusicMoment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { replacePlaylistAndPlay } = usePlayerStore();

  useEffect(() => {
    loadMoments();
  }, []);

  const loadMoments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await momentsAPI.getMoments();
      console.log('Moments response:', response);

      if (response && response.success) {
        // 后端返回格式: { success: true, data: [...] }
        // 而不是 { success: true, data: { data: [...] } }
        const momentsData = Array.isArray(response.data) ? response.data : [];
        console.log('Moments data:', momentsData);
        setMoments(momentsData);
      } else {
        setMoments([]);
      }
    } catch (error) {
      console.error('Failed to load moments:', error);
      setError(error instanceof Error ? error.message : '加载失败');
      setMoments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaySong = async (moment: MusicMoment) => {
    if (!moment.songId) return;
    try {
      const songResponse = await api.getSong(moment.songId);
      if (songResponse.success && songResponse.data) {
        replacePlaylistAndPlay([songResponse.data], 0);
      }
    } catch (error) {
      console.error('Failed to play song:', error);
    }
  };

  const handleLike = async (momentId: string) => {
    try {
      await momentsAPI.likeMoment(momentId);
      // Refresh moments to show updated like count
      loadMoments();
    } catch (error) {
      console.error('Failed to like moment:', error);
    }
  };

  const getEnergyLevelText = (level: number) => {
    if (level <= -3) return '极度治愈';
    if (level <= -1) return '舒缓放松';
    if (level === 0) return '平和';
    if (level <= 2) return '激昂';
    return '极度激情';
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-red-500">加载失败: {error}</p>
          <Button onClick={loadMoments}>重试</Button>
        </div>
      );
    }

    if (!moments || moments.length === 0) {
      return (
        <p className="text-muted-foreground text-center py-12">
          还没有任何音乐时刻
        </p>
      );
    }

    return moments.map((moment) => (
      <Card key={moment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          {/* Song Info */}
          <div
            className="flex items-center gap-4 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handlePlaySong(moment)}
          >
            {moment.song?.coverUrl && (
              <img
                src={moment.song.coverUrl}
                alt={moment.song.title || 'Song cover'}
                className="w-16 h-16 rounded object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{moment.song?.title || '未知歌曲'}</h3>
              <p className="text-sm text-muted-foreground">
                {moment.song?.artistName || '未知艺术家'}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <p className="text-foreground/90 mb-4 italic">&ldquo;{moment.content}&rdquo;</p>

          {/* Tags and Metadata */}
          <div className="flex items-center flex-wrap gap-2 mb-4">
            {moment.tags && moment.tags.length > 0 && moment.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
              >
                #{tag}
              </span>
            ))}
            {moment.energyLevel !== undefined && moment.energyLevel !== 0 && (
              <span className="text-xs text-muted-foreground">
                {getEnergyLevelText(moment.energyLevel)}
              </span>
            )}
            {moment.firstHeardYear && (
              <span className="text-xs text-muted-foreground">
                {moment.firstHeardYear}
                {moment.firstHeardPeriod && ` · ${moment.firstHeardPeriod}`}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLike(moment.id)}
              className="gap-2"
            >
              <Heart className="w-4 h-4" />
              <span>{moment.likeCount || 0}</span>
            </Button>
            <span className="text-xs text-muted-foreground">
              {moment.createdAt ? new Date(moment.createdAt).toLocaleDateString('zh-CN') : ''}
            </span>
          </div>

          {/* Comments for main moment */}
          {moment.comments && moment.comments.length > 0 && (
            <div className="pt-4 border-t space-y-2">
              <p className="text-xs text-muted-foreground font-semibold mb-2">跟评 ({moment.comments.length})</p>
              {moment.comments.map((comment) => (
                <div key={comment.id} className="text-sm pl-4 border-l-2 border-muted">
                  <p className="text-foreground/80">{comment.content}</p>
                  {comment.listenDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(comment.listenDate).toLocaleDateString('zh-CN')}
                      {comment.location && ` · ${comment.location}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content - 禁用滚动，底部留出播放器空间 */}
      <div className="flex-1 overflow-hidden pb-24">
        <div className="container max-w-4xl mx-auto p-6 space-y-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">音乐朋友圈</h1>
          </div>

          {renderContent()}
        </div>
      </div>
    </div>
  );
}