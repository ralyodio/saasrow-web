import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BookmarkButtonProps {
  submissionId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showCount?: boolean;
}

export function BookmarkButton({ submissionId, size = 'md', showLabel = false, showCount = false }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      checkBookmarkStatus();
      if (showCount) {
        updateTotalBookmarks();
      }
    }
  }, [submissionId, userId, showCount]);

  const checkAuth = async () => {
    const email = sessionStorage.getItem('userEmail');
    if (email) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      setUserId(data?.id || null);
    }
  };

  const checkBookmarkStatus = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('submission_id', submissionId)
        .maybeSingle();

      if (error) throw error;
      setIsBookmarked(!!data);
    } catch (error) {
      console.error('Error checking bookmark:', error);
    }
  };

  const updateTotalBookmarks = async () => {
    if (!userId) return;

    try {
      const { count, error } = await supabase
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      setTotalBookmarks(count || 0);
    } catch (error) {
      console.error('Error fetching bookmark count:', error);
    }
  };

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    if (!userId) {
      alert('Please log in or create an account to save favorites');
      return;
    }

    setIsLoading(true);

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('submission_id', submissionId);

        if (error) throw error;
        setIsBookmarked(false);
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: userId,
            submission_id: submissionId
          });

        if (error) throw error;
        setIsBookmarked(true);
      }

      if (showCount) {
        await updateTotalBookmarks();
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleBookmark}
      disabled={isLoading}
      className={`flex items-center gap-2 transition-all ${
        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
      }`}
      title={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`${sizeClasses[size]} transition-colors ${
          isBookmarked
            ? 'fill-red-500 text-red-500'
            : 'text-white/70 hover:text-red-500'
        }`}
      />
      {showLabel && (
        <span className="text-sm text-white/70">
          {isBookmarked ? 'Saved' : 'Save'}
        </span>
      )}
      {showCount && totalBookmarks > 0 && (
        <span className="text-xs text-white/70 font-ubuntu">
          {totalBookmarks}
        </span>
      )}
    </button>
  );
}
