import React from 'react';

// Custom brand-styled social media icons
const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center min-w-[16px] min-h-[16px]`}>
    <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 text-white fill-current">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  </div>
);

const TikTokIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} bg-black rounded-sm flex items-center justify-center relative min-w-[16px] min-h-[16px]`}>
    <svg viewBox="0 0 24 24" className="w-4/5 h-4/5 fill-current">
      <path fill="#ff0050" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      <path fill="#25f4ee" d="M15.9 2.44a4.83 4.83 0 0 1-3.77-4.25V2h3.45c.11.8.45 1.54.97 2.14.52.6 1.2 1.05 1.96 1.3v3.4a8.16 8.16 0 0 1-4.77-1.52v7A6.34 6.34 0 0 1 5 20.1a6.33 6.33 0 0 1 4.36-9.75 6.84 6.84 0 0 1 1 .05v3.5a2.93 2.93 0 0 0-.88-.13 2.89 2.89 0 0 0-2.31 4.64 2.89 2.89 0 0 0 5.2-1.74V2.44z" opacity="0.9" />
    </svg>
  </div>
);

const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} bg-black rounded-full flex items-center justify-center min-w-[16px] min-h-[16px]`}>
    <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 text-white fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  </div>
);

const LinkedInIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} bg-[#0A66C2] rounded-sm flex items-center justify-center min-w-[16px] min-h-[16px] aspect-square`}>
    <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 text-white fill-current">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  </div>
);

const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} bg-[#1877F2] rounded-sm flex items-center justify-center min-w-[16px] min-h-[16px]`}>
    <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 text-white fill-current">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  </div>
);

const PinterestIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} bg-[#BD081C] rounded-sm flex items-center justify-center min-w-[16px] min-h-[16px] aspect-square`}>
    <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 text-white fill-current">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.348-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-12.014C24.007 5.36 18.641.001.001 12.017z" />
    </svg>
  </div>
);

const YouTubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} bg-[#FF0000] rounded-sm flex items-center justify-center min-w-[16px] min-h-[16px]`}>
    <svg viewBox="0 0 24 24" className="w-4/5 h-4/5 text-white fill-current">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  </div>
);

const BlogIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} bg-[#FF6B35] rounded-sm flex items-center justify-center min-w-[16px] min-h-[16px]`}>
    <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 text-white fill-current">
      <path d="M19 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V6h10v2z" />
    </svg>
  </div>
);

const NewsletterIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <div className={`${className} bg-[#4A90E2] rounded-sm flex items-center justify-center min-w-[16px] min-h-[16px]`}>
    <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 text-white fill-current">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  </div>
);

// Platform icon mapping with official brand icons - optimally sized for capsules
export const getPlatformIcon = (platform: string, className: string = "w-4 h-4") => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <InstagramIcon className={className} />;
    case 'tiktok':
      return <TikTokIcon className={className} />;
    case 'twitter':
    case 'x':
      return <XIcon className={className} />;
    case 'linkedin':
      return <LinkedInIcon className={className} />;
    case 'facebook':
      return <FacebookIcon className={className} />;
    case 'blog':
      return <BlogIcon className={className} />;
    case 'newsletter':
      return <NewsletterIcon className={className} />;
    default:
      return <div className={`${className} bg-gray-500 rounded-sm flex items-center justify-center text-white text-xs font-bold`}>#</div>;
  }
};

// Platform color mapping for consistent branding
export const getPlatformColor = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'instagram': return 'text-pink-500';
    case 'tiktok': return 'text-black';
    case 'twitter':
    case 'x': return 'text-black';
    case 'linkedin': return 'text-blue-600';
    case 'facebook': return 'text-blue-500';
    case 'blog': return 'text-orange-600';
    case 'newsletter': return 'text-blue-400';
    default: return 'text-gray-500';
  }
};

export const getPlatformBgColor = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500';
    case 'tiktok': return 'bg-black';
    case 'twitter':
    case 'x': return 'bg-black';
    case 'linkedin': return 'bg-blue-600';
    case 'facebook': return 'bg-blue-500';
    case 'blog': return 'bg-orange-600';
    case 'newsletter': return 'bg-blue-400';
    default: return 'bg-gray-500';
  }
};