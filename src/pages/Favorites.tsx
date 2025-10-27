import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';
import { Heart, ExternalLink } from 'lucide-react';
import { BookmarkButton } from '../components/BookmarkButton';

interface Bookmark {
  id: string;
  created_at: string;
  software_submissions: {
    id: string;
    name: string;
    tagline: string;
    website_url: string;
    logo_url: string;
    category: string;
    tier: string;
    upvotes: number;
    downvotes: number;
  };
}

export function Favorites() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndLoadBookmarks();
  }, []);

  const checkAuthAndLoadBookmarks = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(true);
    await loadBookmarks(session.access_token);
  };

  const loadBookmarks = async (accessToken: string) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bookmarks`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookmarks(data.bookmarks || []);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmarkRemoved = (submissionId: string) => {
    setBookmarks(prev => prev.filter(b => b.software_submissions.id !== submissionId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#222222] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#222222] flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Heart className="w-16 h-16 text-white/30 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">My Favorites</h1>
            <p className="text-white/70 text-lg mb-8">
              Please log in to view your saved software
            </p>
            <Link
              to="/"
              className="inline-block bg-[#3a3a3a] text-white px-8 py-3 rounded-lg hover:bg-[#4a4a4a] transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#222222] flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            <h1 className="text-4xl font-bold text-white">My Favorites</h1>
          </div>

          {bookmarks.length === 0 ? (
            <div className="bg-[#3a3a3a] rounded-2xl p-12 text-center">
              <Heart className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/70 text-lg mb-6">
                You haven't saved any software yet
              </p>
              <Link
                to="/explore"
                className="inline-block bg-white text-[#222222] px-8 py-3 rounded-lg hover:bg-white/90 transition-colors font-semibold"
              >
                Explore Software
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarks.map((bookmark) => {
                const software = bookmark.software_submissions;
                const netVotes = software.upvotes - software.downvotes;

                return (
                  <div
                    key={bookmark.id}
                    className="bg-[#3a3a3a] rounded-xl p-6 hover:bg-[#4a4a4a] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <Link to={`/software/${software.id}`} className="flex items-center gap-3 flex-1">
                        {software.logo_url && (
                          <img
                            src={software.logo_url}
                            alt={software.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-lg truncate">
                            {software.name}
                          </h3>
                          <span className="text-white/50 text-sm capitalize">
                            {software.category}
                          </span>
                        </div>
                      </Link>
                      <div onClick={() => handleBookmarkRemoved(software.id)}>
                        <BookmarkButton submissionId={software.id} size="md" />
                      </div>
                    </div>

                    <p className="text-white/70 text-sm mb-4 line-clamp-2">
                      {software.tagline}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-white/70 text-sm">
                          {netVotes} {netVotes === 1 ? 'vote' : 'votes'}
                        </div>
                        {software.tier && (
                          <span className="text-xs px-2 py-1 rounded bg-[#222222] text-white/70 capitalize">
                            {software.tier}
                          </span>
                        )}
                      </div>
                      <a
                        href={software.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/70 hover:text-white transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
