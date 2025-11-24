declare global {
  interface Window {
    datafast?: (eventName: string, eventData?: Record<string, unknown>) => void;
  }
}

export const trackEvent = (eventName: string, eventData?: Record<string, unknown>) => {
  try {
    if (typeof window !== 'undefined' && window.datafast) {
      window.datafast(eventName, eventData);
    }
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

export const analyticsEvents = {
  SOFTWARE_SUBMISSION_STARTED: 'software_submission_started',
  SOFTWARE_SUBMISSION_COMPLETED: 'software_submission_completed',
  SOFTWARE_SUBMISSION_FAILED: 'software_submission_failed',

  NEWSLETTER_SUBSCRIBED: 'newsletter_subscribed',
  NEWSLETTER_UNSUBSCRIBED: 'newsletter_unsubscribed',

  LISTING_UPGRADE_INITIATED: 'listing_upgrade_initiated',
  LISTING_UPGRADE_COMPLETED: 'listing_upgrade_completed',

  VOTE_CAST: 'vote_cast',
  COMMENT_POSTED: 'comment_posted',
  FAVORITE_ADDED: 'favorite_added',
  FAVORITE_REMOVED: 'favorite_removed',

  COMMUNITY_POST_CREATED: 'community_post_created',

  SOFTWARE_VIEW: 'software_view',
  SOFTWARE_CLICK: 'software_click',

  SEARCH_PERFORMED: 'search_performed',
  CATEGORY_VIEWED: 'category_viewed',
  TAG_CLICKED: 'tag_clicked',
};
