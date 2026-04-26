
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Spline from '@splinetool/react-spline';
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, CheckCircle2, Instagram, Twitter, Linkedin, Facebook, Mail, MapPin, Share2, LogIn, Loader2 } from "lucide-react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/hooks/useAuth";
import UserMenu from "@/components/auth/UserMenu";
import { AnimatedBeamDemo } from "@/components/ui/animated-beam-demo";
import ParallaxText from "@/components/ui/ParallaxText";
import { MascotSmiley } from "@/components/ui/MascotSmiley";
import { PostMockup } from "@/components/ui/PostMockup";
import { WaitlistDialog } from "@/components/WaitlistDialog";

import { InteractiveBlobs } from "@/components/ui/InteractiveBlobs";
import { WhirlingSpark } from "@/components/ui/WhirlingSpark";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/LOGO.png";
import avatar1 from "@/assets/avatar-1.jpg";
import creatorImg from "@/assets/built-for/Creator 1.jpg";
import contentCreatorImg from "@/assets/built-for/Founder.jpg";
import earlyStageStartupsImg from "@/assets/built-for/early-stage-startups.png";
import socialMediaImg from "@/assets/built-for/social-media-manager.png";
import startupGrowthImg from "@/assets/built-for/Teams.png";
import agencyWorkspaceImg from "@/assets/built-for/Creator 1.jpg";


import exampleCarouselImg from "@/assets/Example Carousel 2.jpg";
import socialFloImpactImg from "@/assets/socialflo-impact.png";
import bulkContentCalendarImg from "@/assets/bulk-content-calendar.png";
import linkedinPostImg from "@/assets/linkedin-post-image.png";
import founderPortrait from "@/assets/built-for/Founder image.png";



// ── Stripe Price IDs ────────────────────────────────────────────────────────
// Replace these placeholders with the actual price IDs from your Stripe Dashboard.
// Dashboard → Products → [Your Product] → Pricing → Copy price_xxx ID
const PRICE_IDS = {
  starter: {
    monthly: "price_1TKJ9A7ldyNJN3oEHHw6Ndo6",
    yearly:  "price_1TKJAa7ldyNJN3oEZpqWmaNW",
  },
  growth: {
    monthly: "price_1TKJCW7ldyNJN3oEINTC02lW",
    yearly:  "price_1TKJD47ldyNJN3oEYnUxU6Ao",
  },
  pro: {
    monthly: "price_1TKJDj7ldyNJN3oEWXQicVou",
    yearly:  "price_1TKJF67ldyNJN3oEia8iJGDk",
  },
};

const Index = () => {
  const { user } = useAuth();
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const { toast } = useToast();
  const { redirectToCheckout, isLoading: isCheckoutLoading } = useStripeCheckout();

  const handleEmailClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigator.clipboard.writeText("vidushi@socialflo.de");
    toast({
      title: "Email copied!",
      description: "vidushi@socialflo.de copied to clipboard.",
    });
    // Fallback: still try to open it after copying
    window.location.href = "mailto:vidushi@socialflo.de";
  };

  return (
    <div className="dark min-h-screen bg-background selection:bg-purple-500/30 font-sans text-foreground overflow-x-hidden transition-colors duration-300">

      {/* 1. Custom Cursor */}


      {/* 2. Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <img src={logo} alt="SocialFlo" className="h-8" />

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                <a href="#who-is-it-for" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Who it's for</a>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!user ? (
                <div className="flex items-center space-x-2">
                  <Link to="/auth">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                      <LogIn className="mr-2 h-4 w-4" /> Sign In
                    </Button>
                  </Link>
                  <Link to="/auth" state={{ isSignUp: true }}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-full px-6">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <UserMenu />
                  <Link to="/campaign">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
                      Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 3. Hero Section (Static Mascot) */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 border-b border-border">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-24 text-center lg:text-left">

            {/* Left Content */}
            <div className="flex-1 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-muted/50 backdrop-blur-sm mb-8 overflow-hidden relative">
                <WhirlingSpark className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-foreground z-10">Built by People Who Actually Run Social</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-8xl font-display font-bold mb-8 tracking-wide text-foreground leading-[1.1]">
                Your social <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300">AI co-pilot.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground/80 mb-14 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                From idea to on-brand content in 15 minutes. Create a full month of posts without any burnout.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => setWaitlistDialogOpen(true)}
                  className="group px-10 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] transition-all duration-300"
                >
                  Join Waitlist
                  <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>

            {/* Right Mascot (Static) */}
            <div className="flex-1 flex justify-center lg:justify-end overflow-visible">
              <div className="relative w-[500px] h-[500px] overflow-visible">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-[60px]" />
                <MascotSmiley />
              </div>
            </div>

          </div>
        </div>
      </section >

      {/* 4. Parallax Text */}
      < div className="py-16 border-y border-border bg-muted/30" >
        <ParallaxText baseVelocity={-1}>AUTOMATE • CREATE • ANALYZE • GROW •</ParallaxText>
      </div >


      {/* 5. How It Works (Premium Grid) */}
      < section id="features" className="py-32 px-4 relative" >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground">Built for B2B Founders & Brands</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We take care of content strategy and execution, so you can focus on building, selling, and growing.
            </p>

          </div>

          <div className="grid lg:grid-cols-3 gap-8">

            {/* Feature 1: Instagram */}
            <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-colors group">
              <div className="mb-8 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl group-hover:scale-105 transition-transform">
                <div className="flex justify-center transform md:rotate-[-5deg]">
                  <PostMockup type="instagram" content="Just launched our new AI features! 🚀 #SocialFlo #AI #Growth" image={socialFloImpactImg} handle="@socialflo" />


                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 font-display text-card-foreground">Generate Visuals & Text</h3>
              <p className="text-muted-foreground leading-relaxed">
                Generate high-quality visuals and captions tailored to your brand voice in seconds. No design dependency required.
              </p>

            </div>

            {/* Feature 2: Twitter/X - Central Focus */}
            <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-colors group">
              <div className="mb-8 p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl group-hover:scale-105 transition-transform space-y-4">
                <div className="flex justify-center transform md:rotate-[2deg]">
                  <PostMockup type="twitter" content="Stop wrestling with content calendars. Let AI handle your entire social media strategy, from ideation to posting. 🤖✨" author="SocialFlo" handle="@socialflo" />
                </div>
                <div className="flex justify-center transform md:rotate-[-1deg]">
                  <PostMockup type="linkedin" content="We're hiring a Project Manager! 🚀 Join our team at Thynk Unlimited and lead innovative projects." author="SocialFlo" handle="@socialflo" image={linkedinPostImg} />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 font-display text-card-foreground">Multi-Platform by Design</h3>
              <p className="text-muted-foreground leading-relaxed">
                One workflow. Platform-specific content for LinkedIn, Instagram, X, newsletters, and more.
              </p>

            </div>

            {/* Feature 3: Strategic Bulk Content Generation */}
            <div className="bg-card border border-border rounded-3xl p-8 hover:bg-accent/50 transition-colors group">
              <div className="mb-8 p-4 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-2xl group-hover:scale-105 transition-transform overflow-hidden">
                <div className="flex justify-center transform md:rotate-[3deg]">
                  <img
                    src={bulkContentCalendarImg}
                    alt="Bulk Content Calendar Dashboard"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 font-display text-card-foreground">Create weeks of content at once</h3>
              <p className="text-muted-foreground leading-relaxed">
                Create weeks of content in one sitting, with a clear strategy instead of stressing about what to post every day.
              </p>


            </div>

          </div>
        </div>
      </section >

      {/* 6. Integration Beam */}
      < section className="py-24 bg-background relative overflow-hidden" >
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1">
            <AnimatedBeamDemo />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-4xl font-display font-bold mb-6 text-foreground">One Platform. All Your Social Tools.</h2>
            <p className="text-lg text-muted-foreground">
              SocialFlo brings content creation, visuals, and workflows into one place — so you don’t have to jump between tools.
            </p>
          </div>

        </div>
      </section >

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-4 relative bg-background border-t border-border overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 text-foreground">
              Simple & scalable pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Create content at scale without hiring a team
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className="relative inline-flex h-7 w-14 items-center rounded-full bg-purple-500/20 border border-purple-500/30 transition-colors focus:outline-none"
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-purple-500 transition-transform ${isYearly ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium flex items-center gap-2 ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
                Yearly <span className="text-xs py-0.5 px-2 rounded-full bg-green-500/20 text-green-400 border border-green-500/20">Save 20%</span>
              </span>
            </div>

          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12 items-center">

            {/* Starter Plan */}
            <motion.div
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 flex flex-col hover:border-purple-500/30 transition-colors h-full"
            >
              <h3 className="text-2xl font-display font-bold mb-2">Starter</h3>
              <div className="h-12 flex items-baseline mb-6">
                <div className={`transition-all duration-500 overflow-hidden ease-in-out ${isYearly ? 'opacity-100 mr-2' : 'opacity-0 mr-0'}`} style={{ maxWidth: isYearly ? '5rem' : '0' }}>
                  <span className="text-2xl font-medium text-muted-foreground/50 line-through whitespace-nowrap">
                    €29
                  </span>
                </div>
                <div className="inline-grid items-baseline">
                  <span className={`col-start-1 row-start-1 text-4xl font-bold transition-all duration-500 ease-out ${isYearly ? 'opacity-0 translate-y-3 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                    €29
                  </span>
                  <span className={`col-start-1 row-start-1 text-4xl font-bold transition-all duration-500 ease-out ${isYearly ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}`}>
                    €24
                  </span>
                </div>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-8">Billed {isYearly ? 'annually' : 'monthly'}</p>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">250 posts/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">25 AI carousels</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">50 basic carousels</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Basic support</span>
                </li>
              </ul>

              <button
                id="starter-plan-cta"
                onClick={() => redirectToCheckout(isYearly ? PRICE_IDS.starter.yearly : PRICE_IDS.starter.monthly)}
                disabled={isCheckoutLoading}
                className="w-full py-3 rounded-full border border-purple-500/30 hover:bg-purple-500/10 text-foreground font-medium transition-colors mt-auto flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCheckoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}

                Subscribe
              </button>
            </motion.div>

            {/* Growth Plan */}
            <motion.div
              className="bg-card relative backdrop-blur-sm border border-purple-500/50 rounded-3xl p-8 flex flex-col shadow-2xl shadow-purple-500/20 lg:scale-[1.05] z-10 h-full"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-xs font-bold text-white shadow-lg">
                Most Popular
              </div>

              <h3 className="text-2xl font-display font-bold mb-2">Growth</h3>
              <div className="h-12 flex items-baseline mb-6">
                <div className={`transition-all duration-500 overflow-hidden ease-in-out ${isYearly ? 'opacity-100 mr-2' : 'opacity-0 mr-0'}`} style={{ maxWidth: isYearly ? '5rem' : '0' }}>
                  <span className="text-2xl font-medium text-muted-foreground/50 line-through whitespace-nowrap">
                    €69
                  </span>
                </div>
                <div className="inline-grid items-baseline">
                  <span className={`col-start-1 row-start-1 text-4xl font-bold transition-all duration-500 ease-out ${isYearly ? 'opacity-0 translate-y-3 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                    €69
                  </span>
                  <span className={`col-start-1 row-start-1 text-4xl font-bold transition-all duration-500 ease-out ${isYearly ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}`}>
                    €55
                  </span>
                </div>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-8">Billed {isYearly ? 'annually' : 'monthly'}</p>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-foreground flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">Everything in Starter, plus:</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">700 posts/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">70 AI carousels</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Priority generation speed</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Priority support</span>
                </li>
              </ul>

              <button
                id="growth-plan-cta"
                onClick={() => redirectToCheckout(isYearly ? PRICE_IDS.growth.yearly : PRICE_IDS.growth.monthly)}
                disabled={isCheckoutLoading}
                className="w-full py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white font-medium transition-opacity shadow-lg shadow-purple-500/25 mt-auto flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCheckoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}

                Subscribe
              </button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 flex flex-col hover:border-blue-500/30 transition-colors h-full md:col-span-2 lg:col-span-1"
            >
              <h3 className="text-2xl font-display font-bold mb-2">Pro</h3>
              <div className="h-12 flex items-baseline mb-6">
                <div className={`transition-all duration-500 overflow-hidden ease-in-out ${isYearly ? 'opacity-100 mr-2' : 'opacity-0 mr-0'}`} style={{ maxWidth: isYearly ? '5rem' : '0' }}>
                  <span className="text-2xl font-medium text-muted-foreground/50 line-through whitespace-nowrap">
                    €129
                  </span>
                </div>
                <div className="inline-grid items-baseline">
                  <span className={`col-start-1 row-start-1 text-4xl font-bold transition-all duration-500 ease-out ${isYearly ? 'opacity-0 translate-y-3 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                    €129
                  </span>
                  <span className={`col-start-1 row-start-1 text-4xl font-bold transition-all duration-500 ease-out ${isYearly ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}`}>
                    €99
                  </span>
                </div>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-8">Billed {isYearly ? 'annually' : 'monthly'}</p>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-foreground flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">Everything in Growth, plus:</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">1500 posts/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">150 AI carousels</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Fastest generation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Early access features</span>
                </li>
              </ul>

              <button
                id="pro-plan-cta"
                onClick={() => redirectToCheckout(isYearly ? PRICE_IDS.pro.yearly : PRICE_IDS.pro.monthly)}
                disabled={isCheckoutLoading}
                className="w-full py-3 rounded-full border border-blue-500/30 hover:bg-blue-500/10 text-foreground font-medium transition-colors mt-auto flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCheckoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}

                Subscribe
              </button>
            </motion.div>
          </div>

          {/* Below Pricing Information */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Instant access</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6.5. Why Teams Love SocialFlo Section */}
      <section id="who-is-it-for" className="pt-32 pb-32 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-display font-bold mb-6 text-foreground">
              Why Teams Love{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                SocialFlo
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From solo creators to enterprise teams—SocialFlo's AI agents save hours every week, maintain your unique voice, and scale your social presence effortlessly.
            </p>
          </div>

          {/* Grid of Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">

            {/* Feature 1: Fully automated content pipeline */}
            <motion.div
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                <CheckCircle2 className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4 text-card-foreground tracking-tight">
                Fully automated content pipeline
              </h3>
              <p className="text-muted-foreground/80 leading-relaxed">
                From strategy inputs to publish-ready posts, SocialFlo handles the workflow for you.
              </p>
            </motion.div>

            {/* Feature 2: Content at scale, instantly */}
            <motion.div
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
                <Zap className="w-7 h-7 text-purple-500" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4 text-card-foreground tracking-tight">
                Content at scale, instantly
              </h3>
              <p className="text-muted-foreground/80 leading-relaxed">
                Batch-produce weeks of content in minutes, tailored to each platform.
              </p>
            </motion.div>

            {/* Feature 3: Always sounds like you */}
            <motion.div
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center mb-6 border border-cyan-500/20">
                <svg className="w-7 h-7 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" strokeWidth="2" fill="currentColor" />
                </svg>
              </div>
              <h3 className="text-2xl font-display font-bold mb-4 text-card-foreground tracking-tight">
                Always sounds like you
              </h3>
              <p className="text-muted-foreground/80 leading-relaxed">
                Messaging that feels exactly like you, accurate, consistent, and aligned with your brand identity.
              </p>
            </motion.div>

            {/* Feature 4: Works everywhere you post */}
            <motion.div
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center mb-6 border border-green-500/20">
                <Share2 className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4 text-card-foreground tracking-tight">
                Works everywhere you post
              </h3>
              <p className="text-muted-foreground/80 leading-relaxed">
                Instagram, LinkedIn, Facebook, X, blogs, newsletters, all covered.
              </p>
            </motion.div>

            {/* Feature 5: Zero creative burnout */}
            <motion.div
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center mb-6 border border-orange-500/20">
                <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3l14 9-14 9V3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12l7-4v8l-7-4z" />
                </svg>
              </div>
              <h3 className="text-2xl font-display font-bold mb-4 text-card-foreground tracking-tight">
                Zero creative burnout
              </h3>
              <p className="text-muted-foreground/80 leading-relaxed">
                Avoid burnout. Focus on direction while AI handles production.
              </p>
            </motion.div>

          </div>

          {/* Section Title for B2B Personas */}
          <div className="text-center mb-16 mt-48">
            <h2 className="text-5xl md:text-6xl font-display font-bold text-foreground">
              Who SocialFlo is for
            </h2>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 gap-8">

            {/* Card 1: B2B Founders & Co-Founders */}
            <motion.div
              className="group relative bg-card border border-border rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300"
              whileHover={{ y: -8 }}
            >
              {/* Image Header */}
              <div className="relative h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                <img
                  src={contentCreatorImg}
                  alt="B2B Founders Workspace"
                  className="w-full h-full object-cover object-top scale-150 md:object-center md:scale-110"
                />
                {/* Floating badge */}
                <div className="absolute top-4 right-4 px-4 py-2 bg-purple-500 text-white text-sm font-bold rounded-full shadow-lg">
                  For Founders
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-3xl font-display font-bold mb-4 text-card-foreground">
                  B2B Founders & Co-Founders
                </h3>

                <p className="text-muted-foreground mb-6 leading-relaxed text-base">
                  Build a strong B2B presence without spending hours on content planning and execution. SocialFlo helps you turn ideas and expertise into consistent, strategic content without hiring a full team.
                </p>

                {/* Features List */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Generate a full month of content in one go</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Create carousel visuals without relying on designers</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Stay consistent across platforms without overthinking</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Early-Stage Startups & Small Teams */}
            <motion.div
              className="group relative bg-card border border-border rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
              whileHover={{ y: -8 }}
            >
              {/* Image Header */}
              <div className="relative h-64 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                <img
                  src={earlyStageStartupsImg}
                  alt="Startup Team Workspace"
                  className="w-full h-full object-cover"
                />
                {/* Floating badge */}
                <div className="absolute top-4 right-4 px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-full shadow-lg">
                  For Startups
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-3xl font-display font-bold mb-4 text-card-foreground">
                  Early-Stage Startups & Small Teams
                </h3>

                <p className="text-muted-foreground mb-6 leading-relaxed text-base">
                  For lean teams that need to move fast without adding more tools or people. SocialFlo replaces fragmented workflows with one simple system for content creation.
                </p>

                {/* Features List */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Bulk-generate on-brand content and visuals</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Cover LinkedIn, Instagram, X, newsletters, and more</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Save time, cost, and constant back-and-forth</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 3: In-House Marketing & Growth Teams */}
            <motion.div
              className="group relative bg-card border border-border rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300"
              whileHover={{ y: -8 }}
            >
              {/* Image Header */}
              <div className="relative h-64 bg-gradient-to-br from-green-500/20 to-emerald-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                <img
                  src={startupGrowthImg}
                  alt="Marketing Team Workspace"
                  className="w-full h-full object-cover"
                />
                {/* Floating badge */}
                <div className="absolute top-4 right-4 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-full shadow-lg">
                  For Teams
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-3xl font-display font-bold mb-4 text-card-foreground">
                  In-House Marketing & Growth Teams
                </h3>

                <p className="text-muted-foreground mb-6 leading-relaxed text-base">
                  Plan and execute multi-platform content without jumping between tools. SocialFlo helps teams create structured, platform-ready content at scale.
                </p>

                {/* Features List */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Generate platform-specific content from one workflow</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Create carousel visuals without design bottlenecks</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Maintain consistency across campaigns and channels</span>
                  </div>
                </div>
              </div>
            </motion.div>





            {/* Card 4: Founder-Led & Personal Brands (B2B) */}
            <motion.div
              className="group relative bg-card border border-border rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300"
              whileHover={{ y: -8 }}
            >
              {/* Image Header */}
              <div className="relative h-64 bg-gradient-to-br from-orange-500/20 to-amber-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                <img
                  src={agencyWorkspaceImg}
                  alt="Personal Brand Workspace"
                  className="w-full h-full object-cover"
                />
                {/* Floating badge */}
                <div className="absolute top-4 right-4 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
                  For Personal Brands
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-3xl font-display font-bold mb-4 text-card-foreground">
                  Founder-Led & Personal Brands (B2B)
                </h3>

                <p className="text-muted-foreground mb-6 leading-relaxed text-base">
                  For professionals who want to build credibility and authority rather than chase trends. SocialFlo helps you show up thoughtfully and consistently.
                </p>

                {/* Features List */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Turn expertise into structured, high-quality content</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Focus on long-term visibility, not daily posting</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Stay consistent without content burnout</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section >

      {/* Founder Quote Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card/50 border border-border/50 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Founder Image */}
              <div className="flex-shrink-0">
                <img
                  src={founderPortrait}
                  alt="Founder"
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-primary/10"
                />
              </div>

              {/* Quote Content */}
              <div className="flex-1">
                <svg className="w-8 h-8 text-white mb-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                </svg>
                <blockquote className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
                  Founders don't struggle with ideas, they struggle with time and consistency. SocialFlo handles the strategy, structure, visuals, and copy so social media doesn't feel like another job. Think of it as a senior social media manager, without the full-time cost.
                </blockquote>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-foreground text-sm">Vidushi Malhan</p>
                    <p className="text-xs text-muted-foreground">Founder, SocialFlo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Waitlist Section (New Interactive Background) */}
      <section id="waitlist" className="h-[600px] relative overflow-hidden flex items-center justify-center z-10">
        {/* Interactive Blobs Background */}
        < InteractiveBlobs />

        <div className="relative z-20 text-center max-w-3xl px-4">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-8 text-foreground drop-shadow-xl tracking-tight">Ready to jump in?</h2>
          <p className="text-lg md:text-xl text-muted-foreground/90 mb-14 drop-shadow-md font-medium leading-relaxed">
            Join the waitlist to be selected for the next cohort of beta users. We're approving a limited group of early testers.
          </p>
          <button
            onClick={() => setWaitlistDialogOpen(true)}
            className="group px-12 py-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-xl shadow-2xl shadow-purple-500/30 hover:shadow-3xl hover:shadow-purple-500/50 hover:scale-[1.02] transition-all duration-300"
          >
            Join the Beta Waitlist
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </section >

      {/* 8. Full Demo Footer */}
      <footer className="relative z-20 bg-background border-t border-border pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand Info */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <img src={logo} alt="SocialFlo" className="h-8" />
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                The AI-powered social media management platform designed for the modern creator economy. Automate, create, and grow.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-lg font-bold mb-6 font-display text-foreground">Product</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#waitlist" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-lg font-bold mb-6 font-display text-foreground">Company</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="#about-us" className="hover:text-foreground transition-colors">About Us</a></li>
                <li>
                  <a
                    href="mailto:vidushi@socialflo.de"
                    onClick={handleEmailClick}
                    className="hover:text-foreground transition-colors cursor-pointer"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-bold mb-6 font-display text-foreground">Connect</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-center gap-3">
                  <Linkedin className="w-5 h-5 text-blue-500" />
                  <a href="https://www.linkedin.com/company/usesocialflo/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
                    linkedin.com/in/usesocialflo
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <a
                    href="mailto:vidushi@socialflo.de"
                    onClick={handleEmailClick}
                    className="hover:text-blue-500 transition-colors cursor-pointer"
                  >
                    vidushi@socialflo.de
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-blue-500" />
                  <a href="https://www.instagram.com/usesocialflo/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
                    instagram.com/usesocialflo
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <span>Berlin, Germany</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-muted-foreground text-sm">© 2025 SocialFlo Inc. All rights reserved.</p>
              <Link to="/login" className="text-muted-foreground/30 hover:text-muted-foreground text-[10px] transition-colors">
                Admin Login
              </Link>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Privacy Policy</a>
              <a href="#" className="hover:text-foreground">Terms of Service</a>
              <a href="#" className="hover:text-foreground">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Waitlist Dialog */}
      <WaitlistDialog
        open={waitlistDialogOpen}
        onOpenChange={setWaitlistDialogOpen}
      />
    </div>
  );
};

export default Index;
