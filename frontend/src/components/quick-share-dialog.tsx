'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { Song, MusicMoment } from '@/types';
import { momentsAPI } from '@/lib/moments-api';
import { X } from 'lucide-react';

interface QuickShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  onSuccess?: () => void;
}

export function QuickShareDialog({ isOpen, onClose, song, onSuccess }: QuickShareDialogProps) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [energyLevel, setEnergyLevel] = useState([0]);
  const [firstHeardYear, setFirstHeardYear] = useState('');
  const [firstHeardPeriod, setFirstHeardPeriod] = useState('');
  const [listenDate, setListenDate] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingMoment, setExistingMoment] = useState<MusicMoment | null>(null);
  const [isFirstShare, setIsFirstShare] = useState(true);

  // 检查这首歌是否已经有朋友圈
  useEffect(() => {
    if (isOpen && song) {
      checkExistingMoment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, song]);

  const checkExistingMoment = async () => {
    if (!song) return;

    try {
      const response = await momentsAPI.getSongMoment(song.id);
      if (response.success && response.data) {
        setExistingMoment(response.data);
        setIsFirstShare(false);
      } else {
        setExistingMoment(null);
        setIsFirstShare(true);
      }
    } catch (error) {
      console.error('Failed to check existing moment:', error);
      setIsFirstShare(true);
    }
  };

  const handleSubmit = async () => {
    if (!song || !content.trim()) return;

    setIsSubmitting(true);
    try {
      if (isFirstShare) {
        // 第一次分享：创建朋友圈
        await momentsAPI.createMoment({
          songId: song.id,
          content: content.trim(),
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          energyLevel: energyLevel[0],
          firstHeardYear: firstHeardYear ? parseInt(firstHeardYear) : undefined,
          firstHeardPeriod: firstHeardPeriod.trim() || undefined
        });
      } else if (existingMoment) {
        // 后续分享：作为评论添加
        await momentsAPI.addComment(existingMoment.id, {
          content: content.trim(),
          listenDate: listenDate || new Date().toISOString().split('T')[0],
          location: location.trim() || undefined
        });
      }

      // Reset form
      setContent('');
      setTags('');
      setEnergyLevel([0]);
      setFirstHeardYear('');
      setFirstHeardPeriod('');
      setListenDate('');
      setLocation('');

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to share moment:', error);
      alert('分享失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEnergyLevelText = (level: number) => {
    if (level <= -3) return '极度治愈';
    if (level <= -1) return '舒缓放松';
    if (level === 0) return '平和';
    if (level <= 2) return '激昂';
    return '极度激情';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isFirstShare ? '分享音乐时刻' : '添加新的聆听记录'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Song info */}
          {song && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
              <img
                src={song.coverUrl}
                alt={song.title}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{song.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {song.artist?.name || 'Unknown Artist'}
                </p>
              </div>
            </div>
          )}

          {!isFirstShare && existingMoment && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground mb-1">原始分享：</p>
              <p className="italic">&ldquo;{existingMoment.content}&rdquo;</p>
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              {isFirstShare ? '乐评 *' : '这次的感受 *'}
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isFirstShare ? '分享你对这首歌的感受...' : '这次听到这首歌的新感受...'}
              rows={4}
            />
          </div>

          {isFirstShare ? (
            <>
              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">标签</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="震撼, 治愈, 回忆 (逗号分隔)"
                />
              </div>

              {/* Energy Level */}
              <div className="space-y-2">
                <Label>精力影响: {getEnergyLevelText(energyLevel[0])}</Label>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">恢复</span>
                  <Slider
                    value={energyLevel}
                    onValueChange={setEnergyLevel}
                    min={-5}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground">消耗</span>
                </div>
              </div>

              {/* First heard */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">初次接触年份</Label>
                  <Input
                    id="year"
                    type="number"
                    value={firstHeardYear}
                    onChange={(e) => setFirstHeardYear(e.target.value)}
                    placeholder="2020"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">时期</Label>
                  <Input
                    id="period"
                    value={firstHeardPeriod}
                    onChange={(e) => setFirstHeardPeriod(e.target.value)}
                    placeholder="高中"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Listen date and location for comments */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="listenDate">聆听日期</Label>
                  <Input
                    id="listenDate"
                    type="date"
                    value={listenDate}
                    onChange={(e) => setListenDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">地点/场景</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="咖啡厅"
                  />
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? '发布中...' : '发布'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
