import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface BookmarkButtonProps {
  submissionId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function BookmarkButton({ submissionId, size = 'md', showLabel = false }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  useEffect(() => {
    checkLocalBookmark();
  }, [submissionId]);

  const checkLocalBookmark = () => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      setIsBookmarked(bookmarks.includes(submissionId));
    } catch (error) {
      console.error('Error checking local bookmark:', error);
    }
  };

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);

    try {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      let newBookmarks;

      if (isBookmarked) {
        newBookmarks = bookmarks.filter((id: string) => id !== submissionId);
      } else {
        newBookmarks = [...bookmarks, submissionId];
      }

      localStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
      setIsBookmarked(!isBookmarked);
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
    </button>
  );
}
