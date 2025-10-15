// Social media URL validation
export const socialPlatforms = [
  { id: 'instagram', name: 'Instagram', pattern: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/, icon: 'Instagram' },
  { id: 'youtube', name: 'YouTube', pattern: /^https?:\/\/(www\.)?(youtube\.com\/(c\/|channel\/|user\/|@)?[a-zA-Z0-9_-]+|youtu\.be\/[a-zA-Z0-9_-]+)/, icon: 'Youtube' },
  { id: 'discord', name: 'Discord', pattern: /^https?:\/\/(www\.)?(discord\.gg\/[a-zA-Z0-9]+|discord\.com\/invite\/[a-zA-Z0-9]+)/, icon: 'MessageSquare' },
  { id: 'github', name: 'GitHub', pattern: /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/, icon: 'Github' },
  { id: 'twitter', name: 'Twitter/X', pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/, icon: 'Twitter' },
  { id: 'linkedin', name: 'LinkedIn', pattern: /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9_-]+\/?$/, icon: 'Linkedin' },
  { id: 'tiktok', name: 'TikTok', pattern: /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9._]+\/?$/, icon: 'Music' },
  { id: 'twitch', name: 'Twitch', pattern: /^https?:\/\/(www\.)?twitch\.tv\/[a-zA-Z0-9_]+\/?$/, icon: 'Tv' },
] as const;

export type SocialPlatformId = typeof socialPlatforms[number]['id'];

export const validateSocialUrl = (platform: SocialPlatformId, url: string): boolean => {
  const socialPlatform = socialPlatforms.find(p => p.id === platform);
  if (!socialPlatform) return false;
  return socialPlatform.pattern.test(url);
};

export const getSocialPlatformIcon = (platform: SocialPlatformId): string => {
  const socialPlatform = socialPlatforms.find(p => p.id === platform);
  return socialPlatform?.icon || 'Link';
};
