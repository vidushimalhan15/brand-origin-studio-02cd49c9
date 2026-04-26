import React from 'react';

interface WorkflowCard3DProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

export const WorkflowCard3D: React.FC<WorkflowCard3DProps> = ({ icon, title, description, gradient }) => {
  return (
    <div className="w-[350px] h-[370px] group" style={{ perspective: '1200px' }}>
      <div
        className="h-full rounded-[28px] transition-all duration-[600ms] ease-in-out"
        style={{
          background: `${gradient}`,
          backdropFilter: 'blur(24px)',
          border: '1.5px solid transparent',
          borderImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.6), rgba(150,120,255,0.5)) 1',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 4px 16px rgba(120,90,255,0.15), inset 0 0 24px rgba(255,255,255,0.25)',
          transformStyle: 'preserve-3d',
          transition: 'all 0.6s ease-in-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'rotate3d(1, -1, 0, 25deg)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12), 0 6px 20px rgba(120,90,255,0.2), inset 0 0 28px rgba(255,255,255,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'rotate3d(0, 0, 0, 0deg)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08), 0 4px 16px rgba(120,90,255,0.15), inset 0 0 24px rgba(255,255,255,0.25)';
        }}
      >
        {/* Glass effect */}
        <div
          className="absolute inset-[10px] rounded-[24px] rounded-tl-[100%] bg-gradient-to-b from-white/18 to-white/8 border-r border-b border-white/20 transition-all duration-[600ms] ease-in-out"
          style={{ transform: 'translate3d(0px, 0px, 30px)', transformStyle: 'preserve-3d' }}
        />

        {/* Content */}
        <div
          className="pt-[90px] px-[25px]"
          style={{ transform: 'translate3d(0, 0, 31px)' }}
        >
          <span className="block text-[#3c2f80] font-black text-[22px]">{title}</span>
          <span className="block text-[rgba(60,47,128,0.8)] text-[14px] mt-[15px]">{description}</span>
        </div>

        {/* Logo/Icon area */}
        <div className="absolute left-0 top-0" style={{ transformStyle: 'preserve-3d' }}>
          {/* Icon glow backdrop */}
          <span
            className="block absolute rounded-full top-[25px] left-[25px] w-[40px] h-[40px] bg-gradient-to-br from-purple-300/40 to-blue-300/40 blur-sm"
            style={{ transform: 'translate3d(0, 0, 103px)' }}
          />
          {/* Icon container */}
          <span
            className="circle-5 block absolute aspect-square rounded-full top-[25px] left-[25px] w-[40px] bg-[rgba(147,112,219,0.65)] transition-all duration-[600ms] ease-in-out grid place-content-center text-white"
            style={{
              transform: 'translate3d(0, 0, 105px)',
              transitionDelay: '1.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 8px rgba(120,90,255,0.2)'
            }}
          >
            {icon}
          </span>
        </div>
      </div>

      <style>{`
        .group:hover .circle-5 {
          transform: translate3d(0, 0, 125px) !important;
        }
      `}</style>
    </div>
  );
};
