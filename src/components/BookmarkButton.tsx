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
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userEmail) {
      checkBookmarkStatus();
      if (showCount) {
        updateTotalBookmarks();
      }
    }
  }, [submissionId, userEmail, showCount]);

  const checkAuth = () => {
    const email = sessionStorage.getItem('userEmail');
    setUserEmail(email);
  };

  const checkBookmarkStatus = async () => {
    if (!userEmail) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_email', userEmail)
        .eq('submission_id', submissionId)
        .maybeSingle();

      if (error) throw error;
      setIsBookmarked(!!data);
    } catch (error) {
      console.error('Error checking bookmark:', error);
    }
  };

  const updateTotalBookmarks = async () => {
    if (!userEmail) return;

    try {
      const { count, error } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_email', userEmail);

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

    if (!userEmail) {
      alert('Please log in or create an account to save favorites');
      return;
    }

    setIsLoading(true);

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_email', userEmail)
          .eq('submission_id', submissionId);

        if (error) throw error;
        setIsBookmarked(false);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_email: userEmail,
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
