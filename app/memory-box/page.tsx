"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Search, Grid, List,
  Clock, Edit2, Trash2, MoreVertical,
  Download, SortAsc, SortDesc, FileText, Play, Pause,
  Star, Lock, Archive, Printer,
  Volume2, Heart, BookMarked, CalendarDays, Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useRecordModal } from '@/hooks/use-record-modal';

interface Story {
  id: string;
  title: string;
  transcript: string;
  audioUrl?: string;
  photoUrl?: string;
  photos?: Array<{
    id: string;
    url: string;
    isHero?: boolean;
  }>;
  storyYear?: number | null;
  createdAt: string;
  durationSeconds?: number;
  includeInBook: boolean;
  includeInTimeline: boolean;
  isFavorite: boolean;
  metadata?: {
    lessonsLearned?: string;
  };
}

type ViewMode = 'all' | 'timeline' | 'book' | 'private' | 'favorites' | 'undated';
type SortBy = 'newest' | 'oldest' | 'year' | 'title' | 'favorites';

// Audio Manager for single playback
class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentId: string | null = null;
  private listeners: Map<string, (playing: boolean) => void> = new Map();

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  register(id: string, callback: (playing: boolean) => void) {
    this.listeners.set(id, callback);
  }

  unregister(id: string) {
    if (this.currentId === id && this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      this.currentId = null;
    }
    this.listeners.delete(id);
  }

  async play(id: string, audioUrl: string): Promise<void> {
    if (this.currentAudio && this.currentId !== id) {
      this.currentAudio.pause();
      this.notifyListeners(this.currentId!, false);
    }

    if (this.currentId === id && this.currentAudio) {
      if (this.currentAudio.paused) {
        await this.currentAudio.play();
        this.notifyListeners(id, true);
      } else {
        this.currentAudio.pause();
        this.notifyListeners(id, false);
      }
    } else {
      this.currentAudio = new Audio(audioUrl);
      this.currentId = id;

      this.currentAudio.addEventListener('ended', () => {
        this.notifyListeners(id, false);
        this.currentAudio = null;
        this.currentId = null;
      });

      await this.currentAudio.play();
      this.notifyListeners(id, true);
    }
  }

  private notifyListeners(id: string, playing: boolean) {
    const callback = this.listeners.get(id);
    if (callback) callback(playing);
  }
}

// Story Card Component
function StoryCard({
  story,
  selected,
  onSelect,
  onToggleTimeline,
  onToggleBook,
  onToggleFavorite,
  onEdit,
  onDelete,
  viewMode
}: {
  story: Story;
  selected: boolean;
  onSelect: (id: string) => void;
  onToggleTimeline: (id: string) => void;
  onToggleBook: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  viewMode: 'grid' | 'list';
}) {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioManager = AudioManager.getInstance();

  const hasDate = story.storyYear != null;
  const canAddToTimeline = hasDate;

  useEffect(() => {
    audioManager.register(story.id, setIsPlaying);
    return () => audioManager.unregister(story.id);
  }, [story.id]);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (story.audioUrl) {
      await audioManager.play(story.id, story.audioUrl);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const heroPhoto = story.photos?.find(p => p.isHero) || story.photos?.[0];
  const photoUrl = heroPhoto?.url || story.photoUrl;

  const isPrivate = !story.includeInTimeline && !story.includeInBook;

  if (viewMode === 'list') {
    return (
      <Card className={`p-4 hover:shadow-lg transition-all ${selected ? 'ring-2 ring-coral-500' : ''}`}>
        <div className="flex items-center gap-4">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onSelect(story.id)}
            className="w-6 h-6"
          />

          {photoUrl && (
            <div
              className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
              onClick={() => router.push(`/book?storyId=${story.id}`)}
            >
              <img src={photoUrl} alt={story.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <h3
                className="font-semibold text-lg flex-1 truncate cursor-pointer hover:text-coral-600"
                onClick={() => router.push(`/book?storyId=${story.id}`)}
              >
                {story.title}
              </h3>
              {story.isFavorite && <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />}
              {isPrivate && <Lock className="w-5 h-5 text-gray-400" />}
              {!hasDate && <Badge variant="outline" className="text-xs">No Date</Badge>}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              {hasDate ? (
                <span>{story.storyYear}</span>
              ) : (
                <span className="text-amber-600">Undated Memory</span>
              )}
              <span>•</span>
              <span>{formatDuration(story.durationSeconds)}</span>
              {story.transcript && (
                <>
                  <span>•</span>
                  <span>{story.transcript.split(' ').length} words</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-6">
              <label className={`flex items-center gap-2 ${canAddToTimeline ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                <Checkbox
                  checked={story.includeInTimeline && canAddToTimeline}
                  onCheckedChange={() => canAddToTimeline && onToggleTimeline(story.id)}
                  disabled={!canAddToTimeline}
                  className="w-5 h-5"
                />
                <CalendarDays className="w-4 h-4" />
                <span className="text-sm">Timeline</span>
                {!canAddToTimeline && <span className="text-xs text-amber-600">(needs date)</span>}
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={story.includeInBook}
                  onCheckedChange={() => onToggleBook(story.id)}
                  className="w-5 h-5"
                />
                <BookMarked className="w-4 h-4" />
                <span className="text-sm">Book</span>
              </label>

              <div className="flex items-center gap-2 ml-auto">
                {story.audioUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlay}
                    className="w-8 h-8 p-0"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(story.id);
                  }}
                  className="w-8 h-8 p-0"
                >
                  <Star className={`w-4 h-4 ${story.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(story.id);
                  }}
                  className="w-8 h-8 p-0"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(story.id);
                  }}
                  className="w-8 h-8 p-0 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid View
  return (
    <Card className={`overflow-hidden hover:shadow-xl transition-all ${selected ? 'ring-2 ring-coral-500' : ''}`}>
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onSelect(story.id)}
          className="w-6 h-6 bg-white/90"
        />
      </div>

      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {story.isFavorite && (
          <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
            <Star className="w-4 h-4 fill-white text-white" />
          </div>
        )}
        {isPrivate && (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
        {!hasDate && (
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center" title="No date assigned">
            <CalendarDays className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {photoUrl ? (
        <div
          className="h-48 bg-gray-100 overflow-hidden cursor-pointer"
          onClick={() => router.push(`/book?storyId=${story.id}`)}
        >
          <img src={photoUrl} alt={story.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className="h-48 bg-gradient-to-br from-coral-100 to-coral-200 flex items-center justify-center cursor-pointer"
          onClick={() => router.push(`/book?storyId=${story.id}`)}
        >
          <FileText className="w-16 h-16 text-coral-400" />
        </div>
      )}

      <div className="p-4">
        <h3
          className="font-bold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-coral-600"
          onClick={() => router.push(`/book?storyId=${story.id}`)}
        >
          {story.title}
        </h3>

        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
          {hasDate ? (
            <span>{story.storyYear}</span>
          ) : (
            <Badge variant="outline" className="text-xs text-amber-600">No Date</Badge>
          )}
          {story.durationSeconds && (
            <>
              <span>•</span>
              <Clock className="w-3 h-3" />
              <span>{formatDuration(story.durationSeconds)}</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mb-3">
          <label className={`flex items-center gap-1.5 text-sm ${canAddToTimeline ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
            <Checkbox
              checked={story.includeInTimeline && canAddToTimeline}
              onCheckedChange={() => canAddToTimeline && onToggleTimeline(story.id)}
              disabled={!canAddToTimeline}
              className="w-5 h-5"
            />
            <CalendarDays className="w-4 h-4" />
            <span>Timeline</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <Checkbox
              checked={story.includeInBook}
              onCheckedChange={() => onToggleBook(story.id)}
              className="w-5 h-5"
            />
            <BookMarked className="w-4 h-4" />
            <span>Book</span>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {story.audioUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlay}
                className="w-9 h-9 p-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(story.id);
              }}
              className="w-9 h-9 p-0"
            >
              <Star className={`w-5 h-5 ${story.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(story.id);
              }}
              className="w-9 h-9 p-0"
            >
              <Edit2 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(story.id);
              }}
              className="w-9 h-9 p-0 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function MemoryBoxPage() {
  const router = useRouter();
  const { user, session } = useAuth();
  const { openRecordModal } = useRecordModal();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterMode, setFilterMode] = useState<ViewMode>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());

  const { data: stories = [], isLoading, refetch } = useQuery<Story[]>({
    queryKey: ['/api/stories', session?.access_token],
    queryFn: async () => {
      const token = session?.access_token;
      if (!token) throw new Error('No authentication token');

      const response = await fetch('/api/stories', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch stories');
      const data = await response.json();
      return data.stories || [];
    },
    enabled: !!session?.access_token && !!user,
  });

  const updateStory = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Story> }) => {
      const response = await fetch(`/api/stories/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update story');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({ title: 'Memory updated successfully' });
    },
  });

  const deleteStory = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/stories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to delete story');
    },
    onSuccess: () => {
      refetch();
      toast({ title: 'Memory deleted successfully' });
    },
  });

  const processedStories = useMemo(() => {
    let filtered = [...stories];

    switch (filterMode) {
      case 'timeline':
        filtered = filtered.filter(s => s.includeInTimeline);
        break;
      case 'book':
        filtered = filtered.filter(s => s.includeInBook);
        break;
      case 'private':
        filtered = filtered.filter(s => !s.includeInTimeline && !s.includeInBook);
        break;
      case 'favorites':
        filtered = filtered.filter(s => s.isFavorite);
        break;
      case 'undated':
        filtered = filtered.filter(s => !s.storyYear);
        break;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(query) ||
        story.transcript?.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'year':
          return (b.storyYear || 0) - (a.storyYear || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'favorites':
          return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [stories, filterMode, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const totalDuration = stories.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    const timelineCount = stories.filter(s => s.includeInTimeline).length;
    const bookCount = stories.filter(s => s.includeInBook).length;
    const privateCount = stories.filter(s => !s.includeInTimeline && !s.includeInBook).length;
    const favoritesCount = stories.filter(s => s.isFavorite).length;
    const undatedCount = stories.filter(s => !s.storyYear).length;

    return {
      total: stories.length,
      timeline: timelineCount,
      book: bookCount,
      private: privateCount,
      favorites: favoritesCount,
      undated: undatedCount,
      duration: totalDuration,
      words: stories.reduce((sum, s) => sum + (s.transcript?.split(' ').length || 0), 0),
    };
  }, [stories]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleToggleTimeline = (id: string) => {
    const story = stories.find(s => s.id === id);
    if (story && story.storyYear) {
      updateStory.mutate({ id, updates: { includeInTimeline: !story.includeInTimeline } });
    }
  };

  const handleToggleBook = (id: string) => {
    const story = stories.find(s => s.id === id);
    if (story) {
      updateStory.mutate({ id, updates: { includeInBook: !story.includeInBook } });
    }
  };

  const handleToggleFavorite = (id: string) => {
    const story = stories.find(s => s.id === id);
    if (story) {
      updateStory.mutate({ id, updates: { isFavorite: !story.isFavorite } });
    }
  };

  const handleSelectStory = (id: string) => {
    const newSelection = new Set(selectedStories);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedStories(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedStories.size === processedStories.length) {
      setSelectedStories(new Set());
    } else {
      setSelectedStories(new Set(processedStories.map(s => s.id)));
    }
  };

  const handleBulkAction = (action: 'timeline' | 'book' | 'private' | 'delete') => {
    const selectedIds = Array.from(selectedStories);

    if (action === 'delete') {
      if (confirm(`Delete ${selectedIds.length} memories? This cannot be undone.`)) {
        selectedIds.forEach(id => deleteStory.mutate(id));
        setSelectedStories(new Set());
      }
    } else {
      const updates: Partial<Story> = {};
      if (action === 'timeline') {
        updates.includeInTimeline = true;
        updates.includeInBook = false;
      } else if (action === 'book') {
        updates.includeInBook = true;
        updates.includeInTimeline = false;
      } else if (action === 'private') {
        updates.includeInTimeline = false;
        updates.includeInBook = false;
      }

      selectedIds.forEach(id => updateStory.mutate({ id, updates }));
      setSelectedStories(new Set());
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: 'linear-gradient(to bottom, #fef3f2, #ffffff)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/timeline')}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Timeline
              </Button>
              <div className="flex items-center gap-3">
                <Box className="w-8 h-8 text-coral-500" />
                <h1 className="text-2xl font-bold">Memory Box</h1>
              </div>
            </div>

            <Button
              onClick={openRecordModal}
              className="bg-coral-500 hover:bg-coral-600 text-white text-lg px-6 py-3"
            >
              <FileText className="w-5 h-5 mr-2" />
              Add New Memory
            </Button>
          </div>
        </div>
      </header>

      {/* Statistics Dashboard */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            <Card className="p-4 text-center bg-gradient-to-br from-coral-50 to-coral-100">
              <div className="text-3xl font-bold text-coral-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Memories</div>
            </Card>

            <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-3xl font-bold text-blue-600">{stats.timeline}</div>
              <div className="text-sm text-gray-600">In Timeline</div>
            </Card>

            <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-3xl font-bold text-green-600">{stats.book}</div>
              <div className="text-sm text-gray-600">In Book</div>
            </Card>

            <Card className="p-4 text-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-3xl font-bold text-gray-600">{stats.private}</div>
              <div className="text-sm text-gray-600">Private</div>
            </Card>

            <Card className="p-4 text-center bg-gradient-to-br from-yellow-50 to-yellow-100">
              <div className="text-3xl font-bold text-yellow-600">{stats.favorites}</div>
              <div className="text-sm text-gray-600">Favorites</div>
            </Card>

            <Card className="p-4 text-center bg-gradient-to-br from-amber-50 to-amber-100">
              <div className="text-3xl font-bold text-amber-600">{stats.undated}</div>
              <div className="text-sm text-gray-600">No Date</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-2xl font-bold">{formatDuration(stats.duration)}</div>
              <div className="text-sm text-gray-600">Total Time</div>
            </Card>

            <Card className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.words.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Words</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Filters and Controls */}
      <section className="bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { value: 'all', label: 'Show All', icon: Grid },
              { value: 'timeline', label: 'Timeline Only', icon: CalendarDays },
              { value: 'book', label: 'Book Only', icon: BookMarked },
              { value: 'undated', label: 'No Date', icon: Box },
              { value: 'private', label: 'Private Vault', icon: Lock },
              { value: 'favorites', label: 'Favorites', icon: Star },
            ].map(filter => (
              <Button
                key={filter.value}
                variant={filterMode === filter.value ? 'default' : 'outline'}
                onClick={() => setFilterMode(filter.value as ViewMode)}
                className={`text-base px-4 py-2 ${
                  filterMode === filter.value
                    ? 'bg-coral-500 text-white border-coral-500'
                    : 'hover:bg-coral-50'
                }`}
              >
                <filter.icon className="w-5 h-5 mr-2" />
                {filter.label}
                {filter.value !== 'all' && (
                  <Badge className="ml-2" variant="secondary">
                    {stats[filter.value as keyof typeof stats]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search memories by title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-base h-12"
              />
            </div>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-12 px-4">
                    <SortDesc className="w-5 h-5 mr-2" />
                    Sort: {sortBy}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy('newest')}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('year')}>
                    By Year
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('title')}>
                    By Title
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('favorites')}>
                    Favorites First
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-white' : ''}`}
                >
                  <Grid className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${viewMode === 'list' ? 'bg-white' : ''}`}
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bulk Actions Bar */}
      {selectedStories.size > 0 && (
        <section className="bg-coral-50 border-b sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedStories.size === processedStories.length}
                  onCheckedChange={handleSelectAll}
                  className="w-6 h-6"
                />
                <span className="font-medium">
                  {selectedStories.size} selected
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleBulkAction('timeline')}
                  className="text-sm"
                >
                  Add to Timeline
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkAction('book')}
                  className="text-sm"
                >
                  Add to Book
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkAction('private')}
                  className="text-sm"
                >
                  Make Private
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkAction('delete')}
                  className="text-sm text-red-600 hover:bg-red-50"
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stories Content */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading your memories...</p>
          </div>
        ) : processedStories.length === 0 ? (
          <Card className="text-center py-16">
            <Box className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-semibold mb-2">
              {filterMode === 'all' && !searchQuery ? 'Your Memory Box is empty' : 'No memories found'}
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              {filterMode === 'all' && !searchQuery
                ? 'Start adding memories to build your collection'
                : 'Try adjusting your filters or search terms'
              }
            </p>
            {filterMode === 'all' && !searchQuery && (
              <Button
                onClick={openRecordModal}
                className="bg-coral-500 hover:bg-coral-600 text-white text-lg px-6 py-3"
              >
                Add Your First Memory
              </Button>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {processedStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                selected={selectedStories.has(story.id)}
                onSelect={handleSelectStory}
                onToggleTimeline={handleToggleTimeline}
                onToggleBook={handleToggleBook}
                onToggleFavorite={handleToggleFavorite}
                onEdit={(id) => router.push(`/review/${id}`)}
                onDelete={(id) => deleteStory.mutate(id)}
                viewMode="grid"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {processedStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                selected={selectedStories.has(story.id)}
                onSelect={handleSelectStory}
                onToggleTimeline={handleToggleTimeline}
                onToggleBook={handleToggleBook}
                onToggleFavorite={handleToggleFavorite}
                onEdit={(id) => router.push(`/review/${id}`)}
                onDelete={(id) => deleteStory.mutate(id)}
                viewMode="list"
              />
            ))}
          </div>
        )}
      </section>

      {/* Export Section */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <Card className="p-6 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-xl font-bold mb-4">Export Your Memories</h3>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Download className="w-6 h-6 mb-2" />
              <span>Download PDF</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Printer className="w-6 h-6 mb-2" />
              <span>Print Stories</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Archive className="w-6 h-6 mb-2" />
              <span>Backup All</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Volume2 className="w-6 h-6 mb-2" />
              <span>Audio Collection</span>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
