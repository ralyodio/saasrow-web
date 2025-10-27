import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BookmarkButtonProps {
  submissionId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function BookmarkButton({ submissionId, size = 'md', showLabel = false }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  useEffect(() => {
    checkAuthAndBookmark();
  }, [submissionId]);

  const checkAuthAndBookmark = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setIsAuthenticated(false);
      return;
    }

    setIsAuthenticated(true);
    await checkBookmarkStatus();
  };

  const checkBookmarkStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bookmarks?submission_id=${submissionId}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('Please log in to bookmark software');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to bookmark software');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bookmarks${isBookmarked ? `?submission_id=${submissionId}` : ''}`;

      const response = await fetch(apiUrl, {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: isBookmarked ? undefined : JSON.stringify({ submission_id: submissionId }),
      });

      if (response.ok) {
        setIsBookmarked(!isBookmarked);
      } else {
        const error = await response.json();
        console.error('Bookmark error:', error);
        alert('Failed to update bookmark. Please try again.');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

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
    </button>
  );
}
