import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import centerIcon from '@/assets/center-icon.png';
import linkedinLogo from '@/assets/Linkedin.png';
import instagramLogo from '@/assets/Instagram.png';
import wordpressLogo from '@/assets/Wordpress.png';
import peecLogo from '@/assets/peec-ai-icon-filled-256.png';
import claudeLogo from '@/assets/claude .jpg';
import tavilyLogo from '@/assets/tavily.png';
import perplexityLogo from '@/assets/Perplexity.avif';
import geminiLogo from '@/assets/gemini.webp';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

.lp { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1A1A1A; overflow-x: hidden; background: #fff; -webkit-font-smoothing: antialiased; }
.lp *, .lp *::before, .lp *::after { box-sizing: border-box; margin: 0; padding: 0; }
.lp-heading { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }

/* ANNOUNCEMENT BANNER */
.lp-banner { background: #111; color: #fff; display: flex; align-items: center; justify-content: center; gap: 16px; padding: 10px 40px; font-size: 13px; font-weight: 400; position: sticky; top: 0; z-index: 200; letter-spacing: .01em; }
.lp-banner-btn { background: #4f46e5; color: #fff; font-size: 11px; font-weight: 600; padding: 4px 11px; border-radius: 5px; text-decoration: none; white-space: nowrap; letter-spacing: .03em; transition: opacity .2s; }
.lp-banner-btn:hover { opacity: .82; }

/* NAV */
.lp-nav { position: sticky; top: 40px; z-index: 100; background: rgba(255,255,255,.95); backdrop-filter: blur(12px); border-bottom: 1px solid #F0F0F0; display: flex; align-items: center; justify-content: space-between; padding: 0 60px; height: 64px; }
.lp-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; }
.lp-logo-name { font-size: 17px; font-weight: 600; color: #1A1A1A; letter-spacing: -.01em; }
.lp-nav-mid { display: flex; align-items: center; gap: 32px; }
.lp-nav-mid a { color: #555; text-decoration: none; font-size: 14px; font-weight: 400; transition: color .2s; }
.lp-nav-mid a:hover { color: #1A1A1A; }
.lp-nav-right { display: flex; align-items: center; gap: 10px; }
.lp-nav-link { font-size: 14px; font-weight: 400; color: #555; text-decoration: none; transition: color .2s; }
.lp-nav-link:hover { color: #1A1A1A; }
.lp-btn-outline { font-size: 14px; font-weight: 500; color: #1A1A1A; border: 1px solid #D0D0D0; background: transparent; border-radius: 7px; padding: 9px 18px; text-decoration: none; transition: border-color .2s; cursor: pointer; }
.lp-btn-outline:hover { border-color: #999; }
.lp-btn-dark { font-size: 14px; font-weight: 500; color: #fff; background: #111; border: none; border-radius: 7px; padding: 9px 20px; text-decoration: none; transition: opacity .2s; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.lp-btn-dark:hover { opacity: .82; }

/* HERO */
.lp-hero { background-color: #F8F8F6; background-image: radial-gradient(circle, #D4D4D4 1px, transparent 1px); background-size: 28px 28px; padding: 130px 60px 110px; text-align: center; }
.lp-hero-inner { max-width: 820px; margin: 0 auto; }
.lp-hero-badge { display: inline-flex; align-items: center; gap: 7px; background: #fff; border: 1px solid #E8E8E8; border-radius: 100px; padding: 5px 14px; font-size: 12px; font-weight: 500; color: #555; margin-bottom: 36px; box-shadow: 0 1px 3px rgba(0,0,0,.05); }
.lp-hero-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: #4D6AFF; animation: lp-blink 2s infinite; }
.lp-h1 { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: clamp(40px, 5.5vw, 64px); font-weight: 800; line-height: 1.08; letter-spacing: -.04em; color: #111; margin-bottom: 28px; }
.lp-h1 .lp-yellow { color: #111; position: relative; display: inline-block; }
.lp-h1 .lp-yellow::after { content: ''; position: absolute; left: 0; bottom: -2px; width: 100%; height: 4px; background: #4f46e5; border-radius: 2px; opacity: 0.5; }
.lp-hero-sub { font-size: 18px; font-weight: 300; color: #777; line-height: 1.75; max-width: 540px; margin: 0 auto 48px; }
.lp-hero-cta { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.lp-btn-yellow { font-size: 15px; font-weight: 600; color: #fff; background: #4f46e5; border: none; border-radius: 7px; padding: 13px 26px; text-decoration: none; transition: opacity .2s; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; }
.lp-btn-yellow:hover { opacity: .85; }
.lp-hero-note { font-size: 12px; color: #ABABAB; margin-top: 20px; letter-spacing: .01em; }

/* LLM cycling animation */
.lp-llm-cycle { display: inline-flex; align-items: center; gap: 10px; vertical-align: middle; position: relative; }
.lp-llm-word { display: inline-flex; align-items: center; gap: 7px; }
.lp-llm-logo { width: 28px; height: 28px; border-radius: 6px; object-fit: contain; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.12); flex-shrink: 0; }
.lp-llm-name { font-weight: 800; letter-spacing: -.04em; }
.lp-llm-slide-enter { animation: lp-slide-in .45s cubic-bezier(.22,.68,0,1.2) forwards; }
.lp-llm-slide-exit { animation: lp-slide-out .3s ease-in forwards; }
@keyframes lp-slide-in {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes lp-slide-out {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-16px); }
}

/* LOGOS */
.lp-logos { background: #fff; padding: 56px 60px; border-bottom: 1px solid #F0F0F0; text-align: center; }
.lp-logos-label { font-size: 11px; font-weight: 500; color: #ABABAB; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 32px; }
.lp-logos-row { display: flex; align-items: center; justify-content: center; gap: 56px; flex-wrap: wrap; }
.lp-logo-item { font-size: 14px; font-weight: 500; color: #C8C8C8; letter-spacing: -.005em; }

/* SECTIONS */
.lp-section { padding: 120px 60px; }
.lp-section-dark { padding: 80px 60px; background: #111; color: #fff; }
.lp-section-gray { padding: 120px 60px; background: #F8F8F6; }
.lp-inner { max-width: 1160px; margin: 0 auto; }
.lp-section-label { font-size: 11px; font-weight: 500; letter-spacing: .12em; text-transform: uppercase; color: #ABABAB; margin-bottom: 18px; }
.lp-section-label-dark { color: rgba(255,255,255,.4); }
.lp-section-title { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: clamp(28px, 3.5vw, 44px); font-weight: 800; line-height: 1.1; letter-spacing: -.035em; color: #111; margin-bottom: 18px; }
.lp-section-title-light { color: #fff; }
.lp-section-sub { font-size: 17px; font-weight: 300; color: #888; line-height: 1.75; max-width: 520px; }
.lp-section-sub-light { color: rgba(255,255,255,.5); }

/* FEATURE GRID */
.lp-feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; margin-top: 64px; background: #F0F0F0; border: 1px solid #F0F0F0; border-radius: 16px; overflow: hidden; }
.lp-feat-card { background: #fff; padding: 36px 32px; transition: background .2s; }
.lp-feat-card:hover { background: #FAFAF8; }
.lp-feat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 20px; }
.lp-feat-title { font-size: 15px; font-weight: 600; color: #111; margin-bottom: 10px; }
.lp-feat-desc { font-size: 14px; font-weight: 300; color: #888; line-height: 1.75; }

/* WORKFLOW */
.lp-wf-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-top: 64px; }
.lp-wf-step { padding: 40px 32px; border: 1px solid #F0F0F0; border-right: none; background: #fff; position: relative; }
.lp-wf-step:first-child { border-radius: 14px 0 0 14px; }
.lp-wf-step:last-child { border-right: 1px solid #F0F0F0; border-radius: 0 14px 14px 0; }
.lp-wf-num { font-size: 10px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; color: #C0C0C0; margin-bottom: 24px; }
.lp-wf-ico { font-size: 26px; margin-bottom: 16px; }
.lp-wf-title { font-size: 15px; font-weight: 600; color: #111; margin-bottom: 10px; }
.lp-wf-desc { font-size: 13px; font-weight: 300; color: #888; line-height: 1.75; }
.lp-wf-tag { margin-top: 20px; display: inline-block; font-size: 11px; font-weight: 500; padding: 4px 10px; border-radius: 5px; }

/* PERSONAS */
.lp-ps-tabs { display: flex; gap: 0; border-bottom: 1px solid #F0F0F0; margin-top: 56px; }
.lp-ps-tab { background: transparent; border: none; border-bottom: 1.5px solid transparent; padding: 14px 24px; font-size: 13px; font-weight: 500; color: #ABABAB; cursor: pointer; margin-bottom: -1px; transition: color .2s, border-color .2s; font-family: inherit; }
.lp-ps-tab:hover { color: #111; }
.lp-ps-tab-active { color: #111 !important; border-bottom-color: #4f46e5 !important; }
.lp-ps-panel { background: #fff; border: 1px solid #F0F0F0; border-top: none; border-radius: 0 0 14px 14px; padding: 48px 52px; }
.lp-ps-metric { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: clamp(32px, 4vw, 48px); font-weight: 800; color: #111; line-height: 1; letter-spacing: -.04em; margin-bottom: 8px; }
.lp-ps-sub { font-size: 14px; font-weight: 300; color: #888; margin-bottom: 24px; }
.lp-ps-pain { font-size: 14px; font-weight: 300; color: #ABABAB; font-style: italic; margin-bottom: 24px; line-height: 1.7; }
.lp-ps-list { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }
.lp-ps-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; font-weight: 300; color: #333; line-height: 1.6; }
.lp-ps-check { width: 16px; height: 16px; background: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 3px; font-size: 9px; font-weight: 700; }
.lp-ps-tag { display: inline-flex; font-size: 12px; font-weight: 500; padding: 6px 14px; border-radius: 6px; background: #F8F8F6; color: #555; border: 1px solid #EEEEEE; }

/* COMPARE */
.lp-cmp { border: 1px solid #F0F0F0; border-radius: 14px; overflow: hidden; margin-top: 64px; }
.lp-cmp-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; border-bottom: 1px solid #F0F0F0; }
.lp-cmp-row:last-child { border-bottom: none; }
.lp-cmp-hdr { background: #F8F8F6; font-size: 12px; font-weight: 500; }
.lp-cmp-cell { padding: 16px 22px; font-size: 13px; font-weight: 300; color: #888; border-right: 1px solid #F0F0F0; display: flex; align-items: center; }
.lp-cmp-cell:last-child { border-right: none; }
.lp-cmp-cell.lp-fn { color: #333; font-weight: 400; }
.lp-cmp-cell.lp-hi { background: #FFFDF0; justify-content: center; }
.lp-cmp-cell.lp-ctr { justify-content: center; }

/* CTA */
.lp-cta-box { background: #111; border-radius: 20px; padding: 80px 64px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; position: relative; overflow: hidden; }
.lp-cta-t { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; font-size: clamp(26px, 3vw, 40px); font-weight: 800; color: #fff; line-height: 1.12; letter-spacing: -.035em; margin-bottom: 14px; }
.lp-cta-s { font-size: 15px; font-weight: 300; color: rgba(255,255,255,.5); line-height: 1.8; }
.lp-cta-opts { display: flex; flex-direction: column; gap: 12px; }
.lp-cta-opt { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 14px; transition: border-color .2s; }
.lp-cta-opt:hover { border-color: rgba(255,255,255,.2); }
.lp-cta-ot { font-size: 13px; font-weight: 500; color: #fff; margin-bottom: 2px; }
.lp-cta-os { font-size: 12px; font-weight: 300; color: rgba(255,255,255,.4); }

/* FOOTER */
.lp-footer { background: #F8F8F6; border-top: 1px solid #F0F0F0; padding: 72px 60px 40px; }
.lp-foot-inner { max-width: 1160px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
.lp-foot-brand { font-size: 16px; font-weight: 600; color: #111; letter-spacing: -.01em; margin-bottom: 10px; }
.lp-foot-tag { font-size: 13px; font-weight: 300; color: #ABABAB; line-height: 1.75; max-width: 200px; }
.lp-foot-col-title { font-size: 10px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; color: #C8C8C8; margin-bottom: 18px; }
.lp-foot-links { display: flex; flex-direction: column; gap: 12px; }
.lp-foot-links a { font-size: 13px; font-weight: 300; color: #888; text-decoration: none; transition: color .2s; }
.lp-foot-links a:hover { color: #111; }
.lp-foot-bot { max-width: 1160px; margin: 0 auto; padding-top: 28px; border-top: 1px solid #EEEEEE; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #C8C8C8; }

/* PEEC WORKFLOW SVG */
.lp-wf-stage { position: relative; width: 100%; height: 160px; margin: 52px 0 40px; }
.lp-wf-svg-abs { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.lp-wf-nodes { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; pointer-events: none; }
.lp-node-group { display: flex; align-items: center; gap: 14px; }
.lp-node-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.lp-node { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid #EEEEEE; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,.08); }
.lp-node-label { font-size: 10px; font-weight: 600; color: #9B9B9B; white-space: nowrap; }
.lp-engine { width: 80px; height: 80px; border-radius: 20px; background: #050038; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(5,0,56,.35); position: relative; }
.lp-engine::before { content: ''; position: absolute; inset: -8px; border-radius: 28px; border: 1.5px solid rgba(5,0,56,.2); animation: lp-ring 2.4s ease-out infinite; pointer-events: none; }
.lp-engine-label { font-size: 11px; font-weight: 700; color: #050038; }

/* REVEAL */
.lp .lp-reveal { opacity: 0; transform: translateY(18px); transition: opacity .55s ease, transform .55s ease; }
.lp .lp-reveal.visible { opacity: 1; transform: translateY(0); }

/* ANIMATIONS */
@keyframes lp-blink { 0%,100%{opacity:1} 50%{opacity:.2} }
@keyframes lp-ring { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(1.9);opacity:0} }

/* RESPONSIVE */
@media(max-width:1024px){
  .lp-nav { padding: 0 20px; }
  .lp-nav-mid { display: none; }
  .lp-section, .lp-section-dark, .lp-section-gray, .lp-hero, .lp-logos, .lp-footer { padding-left: 20px; padding-right: 20px; }
  .lp-feat-grid { grid-template-columns: 1fr 1fr; }
  .lp-wf-grid { grid-template-columns: 1fr 1fr; }
  .lp-cta-box { grid-template-columns: 1fr; padding: 40px 28px; }
  .lp-foot-inner { grid-template-columns: 1fr 1fr; }
  .lp-cmp-row { grid-template-columns: 2fr 1fr 1fr; }
  .lp-cmp-cell:nth-child(4) { display: none; }
}
@media(max-width:640px){
  .lp-feat-grid { grid-template-columns: 1fr; }
  .lp-wf-grid { grid-template-columns: 1fr; }
  .lp-wf-step { border-right: 1px solid #EEEEEE; border-bottom: none; border-radius: 0; }
  .lp-wf-step:first-child { border-radius: 12px 12px 0 0; }
  .lp-wf-step:last-child { border-bottom: 1px solid #EEEEEE; border-radius: 0 0 12px 12px; }
  .lp-foot-inner { grid-template-columns: 1fr; }
  .lp-banner { font-size: 12px; padding: 10px 16px; }
  .lp-ps-tabs { overflow-x: auto; }
  .lp-ps-tab { padding: 12px 16px; white-space: nowrap; }
  .lp-ps-panel { padding: 28px 20px; }
}
`;

const personas = [
  {
    label: 'Solopreneurs',
    metric: '10×',
    sub: 'faster content production',
    pain: '"I spend more time writing posts than actually running my business."',
    benefits: ['Generate a full month of content in one session', 'Maintain consistent brand voice without hiring writers', 'Multi-platform output from a single workflow'],
    tag: 'No team needed',
  },
  {
    label: 'Social Media Managers',
    metric: '40+',
    sub: 'hours saved per month',
    pain: '"I\'m stuck in a constant loop of briefs, revisions, and last-minute posts."',
    benefits: ['Batch-produce weeks of client content in one sitting', 'Platform-specific formats auto-generated', 'AI search visibility built into every post'],
    tag: 'Agency-ready',
  },
  {
    label: 'Founders & Teams',
    metric: '3×',
    sub: 'more content, same team',
    pain: '"We know what to say. We just don\'t have time to say it consistently."',
    benefits: ['Turn strategy inputs into publish-ready posts', 'Consistent voice across all team members', 'Zero creative bottlenecks'],
    tag: 'Scale without hiring',
  },
];

const LLM_ITEMS = [
  { name: 'Perplexity', logo: perplexityLogo, color: '#20B2AA' },
  { name: 'Claude', logo: claudeLogo, color: '#D97706' },
  { name: 'Gemini', logo: geminiLogo, color: '#4285F4' },
];

function LLMCycler() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    const exitTimer = setTimeout(() => setPhase('exit'), 1800);
    const nextTimer = setTimeout(() => {
      setIndex(i => (i + 1) % LLM_ITEMS.length);
      setPhase('enter');
    }, 2150);
    return () => { clearTimeout(exitTimer); clearTimeout(nextTimer); };
  }, [index]);

  const item = LLM_ITEMS[index];
  return (
    <span className="lp-llm-cycle" style={{ overflow: 'hidden', display: 'inline-flex', alignItems: 'center' }}>
      <span
        key={index}
        className={`lp-llm-word ${phase === 'enter' ? 'lp-llm-slide-enter' : 'lp-llm-slide-exit'}`}
      >
        <img src={item.logo} alt={item.name} className="lp-llm-logo" />
        <span className="lp-llm-name" style={{ color: item.color }}>{item.name}</span>
      </span>
    </span>
  );
}

const LandingPage: React.FC = () => {
  const [activePersona, setActivePersona] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.lp .lp-reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const p = personas[activePersona];

  return (
    <>
      <style>{CSS}</style>
      <div className="lp">

        {/* ANNOUNCEMENT BANNER */}
        <div className="lp-banner">
          <span>🚀 SocialFlow now ranks your content in ChatGPT, Perplexity & Gemini, powered by Peec AI</span>
          <Link to="/post-generation" className="lp-banner-btn">TRY IT FREE →</Link>
        </div>

        {/* NAV */}
        <nav className="lp-nav">
          <div style={{ display:'flex', alignItems:'center', gap:36 }}>
            <Link to="/" className="lp-logo">
              <img src={centerIcon} alt="logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              <span className="lp-logo-name">SocialFlow</span>
            </Link>
            <div className="lp-nav-mid">
              <a href="#features">Features</a>
              <a href="#who">Who It's For</a>
              <a href="#how">How It Works</a>
            </div>
          </div>
          <div className="lp-nav-right">
            <Link to="/post-generation" className="lp-nav-link">Login</Link>
            <Link to="/strategy" className="lp-btn-outline">Set up brand</Link>
            <Link to="/post-generation" className="lp-btn-dark">Get started free →</Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <div className="lp-hero-badge"><span className="lp-hero-badge-dot" />Powered by Peec AI · GEO Content</div>
            <h1 className="lp-h1">
              Your brand. Your voice.<br />
              Content that gets found on <LLMCycler />.
            </h1>
            <p className="lp-hero-sub">
              SocialFlow turns your ideas into weeks of on-brand social content, optimised for human audiences and AI search engines. From blank page to published, in one session.
            </p>
            <div className="lp-hero-cta">
              <Link to="/post-generation" className="lp-btn-yellow">Get started free →</Link>
              <a href="#how" className="lp-btn-outline">See how it works</a>
            </div>
            <p className="lp-hero-note">No credit card required · Set up in 5 minutes</p>
          </div>
        </section>


        {/* PEEC AI — DARK SECTION */}
        <section style={{ padding:'48px 40px', background:'#1B1B2F', color:'#fff' }}>
          <div className="lp-inner">
            <div style={{ textAlign:'center', marginBottom:32 }}>
<h2 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:'clamp(22px,2.8vw,34px)', fontWeight:400, letterSpacing:'-.01em', color:'#fff', marginBottom:8 }}>
                Content built for the age of <span style={{ color:'#4f46e5' }}>AI Search.</span>
              </h2>
              <p style={{ fontSize:15, color:'rgba(255,255,255,.55)', lineHeight:1.6, maxWidth:600, margin:'0 auto' }}>
                The first social content tool powered by Peec AI's MCP. Every post ranks in ChatGPT, Perplexity, and Gemini, not just Google.
              </p>
            </div>

            {/* Workflow diagram — seamless hub-and-spoke */}
            <div style={{ position:'relative', width:'100%', padding:'8px 0 16px' }}>
              {/* SVG connector lines layer */}
              <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', overflow:'visible', pointerEvents:'none' }} viewBox="0 0 1000 200" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="lg-in" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0"/>
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.8"/>
                  </linearGradient>
                  <linearGradient id="lg-out" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#4D6AFF" stopOpacity="0"/>
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                {/* Input lines — left nodes to center */}
                {[
                  "M 100 40 C 260 40, 380 100, 480 100",
                  "M 100 80 C 260 80, 380 100, 480 100",
                  "M 100 120 C 260 120, 380 100, 480 100",
                  "M 100 160 C 260 160, 380 100, 480 100",
                ].map((d, i) => <path key={i} d={d} stroke="url(#lg-in)" strokeWidth="1.5" fill="none" strokeDasharray="6 5" opacity="0.7"/>)}
                {/* Output lines — center to right nodes */}
                {[
                  "M 520 100 C 620 100, 740 40, 900 40",
                  "M 520 100 C 620 100, 740 80, 900 80",
                  "M 520 100 C 620 100, 740 120, 900 120",
                  "M 520 100 C 620 100, 740 160, 900 160",
                ].map((d, i) => <path key={i} d={d} stroke="url(#lg-out)" strokeWidth="1.5" fill="none" strokeDasharray="6 5" opacity="0.7"/>)}
                {/* Animated dots — inputs */}
                {[
                  { path:"M 100 40 C 260 40, 380 100, 480 100",  color:"#4f46e5", dur:"2.2s", begin:"0s" },
                  { path:"M 100 80 C 260 80, 380 100, 480 100",  color:"#A78BFA", dur:"2.2s", begin:"0.55s" },
                  { path:"M 100 120 C 260 120, 380 100, 480 100", color:"#4f46e5", dur:"2.2s", begin:"1.1s" },
                  { path:"M 100 160 C 260 160, 380 100, 480 100", color:"#6EE7B7", dur:"2.2s", begin:"1.65s" },
                  /* outputs */
                  { path:"M 520 100 C 620 100, 740 40, 900 40",  color:"#0A66C2", dur:"2.2s", begin:"0.3s" },
                  { path:"M 520 100 C 620 100, 740 80, 900 80",  color:"#E1306C", dur:"2.2s", begin:"0.85s" },
                  { path:"M 520 100 C 620 100, 740 120, 900 120", color:"#fff",    dur:"2.2s", begin:"1.4s" },
                  { path:"M 520 100 C 620 100, 740 160, 900 160", color:"#21759B", dur:"2.2s", begin:"1.95s" },
                ].map((dot, i) => (
                  <circle key={i} r="4" fill={dot.color} filter="url(#glow)">
                    <animateMotion dur={dot.dur} begin={dot.begin} repeatCount="indefinite" path={dot.path}/>
                  </circle>
                ))}
              </svg>

              {/* Nodes layout */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative', zIndex:1, minHeight:160 }}>

                {/* LEFT — Input sources */}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { label:'Brand Voice', bg:'rgba(77,106,255,.15)', border:'rgba(77,106,255,.3)', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 15c3.314 0 6-2.686 6-6S15.314 3 12 3 6 5.686 6 9s2.686 6 6 6z" stroke="#4D6AFF" strokeWidth="1.8"/><path d="M3 21c0-3.314 4.029-6 9-6s9 2.686 9 6" stroke="#4D6AFF" strokeWidth="1.8" strokeLinecap="round"/></svg> },
                    { label:'Your Ideas',  bg:'rgba(255,208,47,.12)',  border:'rgba(255,208,47,.3)',  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L15 17H9l-.7-2C6.3 13.7 5 11.5 5 9a7 7 0 0 1 7-7z" stroke="#4f46e5" strokeWidth="1.8"/><path d="M9 21h6" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round"/></svg> },
                    { label:'Peec AI',     bg:'rgba(255,208,47,.12)',  border:'rgba(255,208,47,.3)',  img: peecLogo },
                    { label:'Claude AI',   bg:'rgba(200,150,80,.12)',  border:'rgba(200,150,80,.3)',  img: claudeLogo },
                    { label:'Tavily',      bg:'rgba(100,180,120,.12)', border:'rgba(100,180,120,.3)', img: tavilyLogo },
                  ].map(n => (
                    <div key={n.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:n.bg, border:`1px solid ${n.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {n.img ? <img src={n.img} alt={n.label} style={{ width:22, height:22, objectFit:'contain', borderRadius:4 }}/> : n.icon}
                      </div>
                      <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,.55)', whiteSpace:'nowrap' }}>{n.label}</span>
                    </div>
                  ))}
                </div>

                {/* CENTER — SocialFlow engine */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <div style={{ width:72, height:72, borderRadius:18, background:'linear-gradient(135deg,#0D0A2E,#1E1060)', border:'1.5px solid rgba(255,208,47,.35)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 28px rgba(255,208,47,.15), 0 6px 24px rgba(0,0,0,.5)', position:'relative' }}>
                    <div style={{ position:'absolute', inset:-8, borderRadius:26, border:'1px solid rgba(255,208,47,.12)', animation:'lp-ring 2.4s ease-out infinite' }}/>
                    <img src={centerIcon} alt="SocialFlow" style={{ width:38, height:38, objectFit:'contain' }}/>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:'#4f46e5', letterSpacing:'0.02em' }}>SocialFlow</span>
                </div>

                {/* RIGHT — Output platforms */}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { label:'LinkedIn',   img: linkedinLogo,   bg:'rgba(10,102,194,.2)', border:'rgba(10,102,194,.4)' },
                    { label:'Instagram',  img: instagramLogo,  bg:'rgba(225,48,108,.15)', border:'rgba(225,48,108,.4)' },
                    { label:'X / Twitter', bg:'rgba(255,255,255,.08)', border:'rgba(255,255,255,.2)', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                    { label:'WordPress',  img: wordpressLogo,  bg:'rgba(33,117,155,.2)', border:'rgba(33,117,155,.4)' },
                  ].map(n => (
                    <div key={n.label} style={{ display:'flex', alignItems:'center', gap:8, flexDirection:'row-reverse' }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:n.bg, border:`1px solid ${n.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {n.img ? <img src={n.img} alt={n.label} style={{ width:22, height:22, objectFit:'contain', borderRadius:4 }}/> : n.icon}
                      </div>
                      <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,.55)', whiteSpace:'nowrap' }}>{n.label}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="lp-section" id="features">
          <div className="lp-inner">
            <div className="lp-reveal">
              <div className="lp-section-label">What SocialFlow does</div>
              <h2 className="lp-section-title">One workflow.<br />Every platform.</h2>
              <p className="lp-section-sub">From idea to scheduled post, without switching tools or hiring writers.</p>
            </div>
            <div className="lp-feat-grid lp-reveal">
              {[
                { bg:'#FFFBEA', icon:'🔍', title:'AI Search Visibility (GEO)', desc:'Every post is informed by real-time Peec AI data: what ChatGPT, Perplexity, and Gemini say about your brand right now.' },
                { bg:'#F0FDF4', icon:'📅', title:'Bulk Content Calendar',     desc:'Generate weeks of content in one session. Campaign-aware, platform-specific, strategically distributed.' },
                { bg:'#FFF7ED', icon:'🖼️', title:'Visual + Text in One',      desc:'Carousels, Reels scripts, LinkedIn posts, newsletters. All from the same idea, no designer needed.' },
                { bg:'#FDF4FF', icon:'⚡', title:'Peec AI Competitor Gaps',   desc:'See what your competitors are missing in AI search, and create content to fill those gaps first.' },
                { bg:'#F0F9FF', icon:'🚀', title:'Campaign Intelligence',     desc:'Set goals, pillars, and audience. SocialFlow builds a full campaign strategy and generates to match.' },
              ].map(f => (
                <div key={f.title} className="lp-feat-card">
                  <div className="lp-feat-icon" style={{ background: f.bg }}>{f.icon}</div>
                  <div className="lp-feat-title">{f.title}</div>
                  <div className="lp-feat-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="lp-section-gray" id="who">
          <div className="lp-inner">
            <div className="lp-reveal">
              <div className="lp-section-label">Built for</div>
              <h2 className="lp-section-title">Who SocialFlow is for</h2>
            </div>
            <div className="lp-ps-tabs">
              {personas.map((per, i) => (
                <button key={per.label} className={`lp-ps-tab ${activePersona === i ? 'lp-ps-tab-active' : ''}`} onClick={() => setActivePersona(i)}>{per.label}</button>
              ))}
            </div>
            <div className="lp-ps-panel">
              <div className="lp-ps-metric">{p.metric}</div>
              <div className="lp-ps-sub">{p.sub}</div>
              <p className="lp-ps-pain">{p.pain}</p>
              <ul className="lp-ps-list">
                {p.benefits.map(b => (
                  <li key={b}><span className="lp-ps-check">✓</span>{b}</li>
                ))}
              </ul>
              <span className="lp-ps-tag">{p.tag}</span>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="lp-section" id="how">
          <div className="lp-inner">
            <div style={{ textAlign:'center', marginBottom: 0 }}>
              <div className="lp-section-label" style={{ textAlign:'center' }}>The process</div>
              <h2 className="lp-section-title" style={{ textAlign:'center' }}>From blank page to published<br />in one session</h2>
            </div>
            <div className="lp-wf-grid">
              {[
                { n:'Step 1', ico:'🏷️', t:'Set Up Your Brand',  d:'Upload your brand profile, tone, and target audience. Add product details and campaign goals.', tag:'5 min setup', tagStyle:{background:'#EEF2FF',color:'#4D6AFF'} },
                { n:'Step 2', ico:'💡', t:'Generate Ideas',       d:'AI pulls Peec GEO signals, trending news, and your content pillars to generate a full campaign of ideas.', tag:'Peec-powered', tagStyle:{background:'#FFFBEA',color:'#B45309'} },
                { n:'Step 3', ico:'✍️', t:'Produce Content',      d:'Select ideas, pick platforms and formats, and generate full copy, captions, and carousels in batch.', tag:'Multi-platform', tagStyle:{background:'#F0FDF4',color:'#166534'} },
                { n:'Step 4', ico:'🚀', t:'Export & Schedule',    d:'Export to your scheduler, download assets, or copy directly to your platforms. Done.', tag:'Ready to publish', tagStyle:{background:'#FDF4FF',color:'#7E22CE'} },
              ].map(s => (
                <div key={s.n} className="lp-wf-step">
                  <div className="lp-wf-num">{s.n}</div>
                  <div className="lp-wf-ico">{s.ico}</div>
                  <div className="lp-wf-title">{s.t}</div>
                  <div className="lp-wf-desc">{s.d}</div>
                  <span className="lp-wf-tag" style={s.tagStyle}>{s.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARE */}
        <section className="lp-section-gray">
          <div className="lp-inner">
            <div style={{ textAlign:'center' }}>
              <div className="lp-section-label" style={{ textAlign:'center' }}>Why SocialFlow</div>
              <h2 className="lp-section-title" style={{ textAlign:'center' }}>How we compare</h2>
            </div>
            <div className="lp-cmp">
              <div className="lp-cmp-row lp-cmp-hdr">
                <div className="lp-cmp-cell lp-fn">Feature</div>
                <div className="lp-cmp-cell lp-hi" style={{ justifyContent:'center', color:'#050038', fontWeight:700 }}>SocialFlow</div>
                <div className="lp-cmp-cell lp-ctr">Generic AI</div>
                <div className="lp-cmp-cell lp-ctr">Schedulers</div>
              </div>
              {[
                ['Brand voice consistency',        '✓','✗','✗'],
                ['AI search (GEO) optimisation',   '✓','✗','✗'],
                ['Bulk campaign generation',       '✓','~','✗'],
                ['Platform-specific formats',      '✓','~','✓'],
                ['Peec AI competitor signals',     '✓','✗','✗'],
                ['Carousel + visual creation',     '✓','~','✗'],
                ['Content pillar strategy',        '✓','✗','✗'],
              ].map(([feat, sf, ai, ss]) => (
                <div key={String(feat)} className="lp-cmp-row">
                  <div className="lp-cmp-cell lp-fn">{feat}</div>
                  {[sf, ai, ss].map((v, i) => (
                    <div key={i} className={`lp-cmp-cell ${i===0?'lp-hi':''} lp-ctr`}>
                      {v === '✓' ? <span style={{color:'#16A34A',fontSize:18,fontWeight:700}}>✓</span>
                       : v === '✗' ? <span style={{color:'#D1D5DB',fontSize:16}}>✗</span>
                       : <span style={{fontSize:12,fontWeight:600,color:'#D97706',background:'#FFFBEA',padding:'2px 8px',borderRadius:4}}>Partial</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer">
          <div className="lp-foot-inner">
            <div>
              <div className="lp-foot-brand">SocialFlow</div>
              <div className="lp-foot-tag">The AI content co-pilot for founders, social media managers, and growing teams.</div>
            </div>
            <div>
              <div className="lp-foot-col-title">Product</div>
              <div className="lp-foot-links">
                <a href="#features">Features</a>
                <a href="#how">How It Works</a>
                <Link to="/post-generation">Dashboard</Link>
              </div>
            </div>
            <div>
              <div className="lp-foot-col-title">Navigate</div>
              <div className="lp-foot-links">
                <Link to="/strategy">Brand Setup</Link>
                <Link to="/post-ideation">Post Ideation</Link>
                <Link to="/post-generation">Post Generation</Link>
              </div>
            </div>
            <div>
              <div className="lp-foot-col-title">Company</div>
              <div className="lp-foot-links">
                <a href="#who">Who It's For</a>
                <a href="mailto:hello@socialflow.ai">Contact</a>
              </div>
            </div>
          </div>
          <div className="lp-foot-bot">
            <span>© 2025 SocialFlow. All rights reserved.</span>
            <span style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#4D6AFF',display:'inline-block'}}/>
              Powered by Peec AI
            </span>
          </div>
        </footer>

      </div>
    </>
  );
};

export default LandingPage;
