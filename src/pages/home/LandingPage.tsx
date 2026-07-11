import React, { useEffect, useState } from 'react';
import {
  Zap, Play, Users, Trophy, BarChart3, TrendingUp,
  Cloud, Cpu, Globe, Star, ExternalLink, ChevronRight, Layout, Code
} from 'lucide-react';
import HeroImage from '@/assets/landing-page.png';
import { useNavigate } from 'react-router-dom';
import { LandingService } from '@/services/landing.service';

// Standardized Container Component
const Container = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`max-w-7xl mx-auto px-5 sm:px-10 lg:px-12 ${className}`}>
    {children}
  </div>
);

const Navbar = () => {
  const navigate = useNavigate();

  // Smooth scroll function
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Offset for the sticky navbar height (approx 80px)
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className="bg-white border-b border-slate-50 sticky top-0 z-50 w-full">
      <Container className="flex items-center justify-between py-5">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => scrollToSection('home')}
        >
          <div className="bg-[#4F46E5] p-1.5 rounded-lg">
            <Zap className="text-white fill-white" size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">ForgeInsight</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {[
            { label: 'Home', id: 'home' },
            { label: 'Courses', id: 'courses' },
            { label: 'Hackathons', id: 'hackathons' },
            { label: 'Leaderboard', id: 'leaderboard' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="text-[14px] font-bold text-slate-500 hover:text-[#4F46E5] transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            className="text-[14px] font-bold text-slate-700 px-4 py-2 hover:text-[#4F46E5]"
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
          <button
            className="text-[14px] font-bold bg-[#4F46E5] text-white px-6 py-2.5 rounded-xl hover:bg-[#4338CA] transition-all shadow-lg shadow-indigo-100"
            onClick={() => navigate('/register')}
          >
            Sign Up
          </button>
        </div>
      </Container>
    </nav>
  );
};

const Hero = () => {
  const navigate = useNavigate();

  const handleNavigation = (role: string) => {
    navigate(`/register?role=${role}`);
  };
  return (
    <section id="home" className="py-16 lg:py-24 bg-white w-full overflow-hidden">
      <Container className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="text-left space-y-8">
          <div className="inline-block px-3 py-1 rounded-md bg-indigo-50 text-[#4F46E5] text-[11px] font-bold uppercase tracking-widest">
            Build, Learn, Win. Together.
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-[80px] font-extrabold text-slate-900 leading-[1] tracking-tight">
            Learn. Build. <br />
            <span className="text-[#4F46E5]">Compete.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 max-w-md leading-relaxed font-medium">
            The #1 Platform for Developers to Train Skills & Win Hackathons.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => handleNavigation('student')}
              className="flex items-center gap-2 bg-[#4F46E5] text-white px-8 py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl shadow-indigo-200/50"
            >
              <Play size={18} fill="white" />
              Start Learning
            </button>
            <button
              onClick={() => handleNavigation('participant')}
              className="flex items-center gap-2 border-2 border-slate-100 bg-slate-50/30 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all"
            >
              <ChevronRight size={18} className="text-[#4F46E5]" />
              Join Hackathon
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-6">
            {['Hands-on Learning', 'Real-world Projects', 'Rank & Win Prizes', 'Global Community'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-[13px] font-bold text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <img
            src={HeroImage}
            alt="Hero Illustration"
            className="w-full max-w-xl h-auto drop-shadow-2xl"
          />
        </div>
      </Container>
    </section>
  )
};

const ImpactStats = ({ stats }: { stats: any }) => {
  const metrics = [
    { icon: Users, val: stats.developersSkilled, sub: 'Developers skilled through our programs' },
    { icon: Layout, val: stats.industryExperts, sub: 'Mentors & Industry experts across tracks' },
    { icon: BarChart3, val: stats.skillImprovementRate, sub: 'Learners report improved technical skills' },
    { icon: TrendingUp, val: stats.placementMultiplier, sub: 'More placements after completing programs' },
  ];

  return (
    <section className="bg-[#0B0E14] py-24 w-full">
      <Container className="text-center space-y-20">
        <div className="space-y-3">
          <h3 className="text-white text-[15px] font-bold uppercase tracking-[0.3em]">Delivered Impact</h3>
          <p className="text-slate-500 text-sm font-medium">Every program is designed to create outcomes that matter to the business.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-16 gap-x-8">
          {metrics.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-6 group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white border border-white/5">
                <s.icon size={24} />
              </div>
              <div className="text-5xl font-extrabold text-white tracking-tight">{s.val}</div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-[180px] mx-auto">{s.sub}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

const TRACK_ICONS: Record<string, any> = { cloud: Cloud, cpu: Cpu, code: Code, globe: Globe };

const ContentGrid = ({ courses, hackathons, categories }: { courses: any[]; hackathons: any[]; categories: string[] }) => (
  <section className="py-24 bg-[#F9FAFC]">
    <Container className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">

      {/* Training Tracks */}
      <div id="courses" className="space-y-6">
        <div className="flex items-center gap-2 text-[#4F46E5] font-extrabold uppercase text-[11px] tracking-widest ml-1">
          <TrendingUp size={16} strokeWidth={3} /> Training Tracks
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
          <p className="text-[12px] text-slate-400 font-bold leading-relaxed pr-8">Expert-curated learning paths to master in-demand skills.</p>
          <div className="space-y-3">
            {courses.map((track: any) => {
              const Icon = TRACK_ICONS[track.icon ?? "cpu"] ?? Cpu;
              return (
                <div key={track.id ?? track.name} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${track.bgClass ?? "bg-slate-100"} ${track.colorClass ?? "text-slate-600"} p-2 rounded-lg`}><Icon size={18} /></div>
                    <span className="text-sm font-bold text-slate-800">{track.name ?? track.title}</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-300">{track.progress ?? ""}</span>
                </div>
              );
            })}
          </div>
          <button className="w-full text-center py-2 text-[#4F46E5] text-sm font-bold hover:underline">Explore all courses →</button>
        </div>
      </div>

      {/* Upcoming Hackathons */}
      <div id="hackathons" className="space-y-6">
        <div className="flex items-center gap-2 text-[#4F46E5] font-extrabold uppercase text-[11px] tracking-widest ml-1">
          <Zap size={16} strokeWidth={3} /> UpComing Hackathons
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
          <p className="text-[12px] text-slate-400 font-bold leading-relaxed pr-8">Compete. Build. Win exciting prizes.</p>
          <div className="space-y-3">
            {hackathons.map((h: any) => {
              const Icon = TRACK_ICONS[h.type ?? "zap"] ?? Zap;
              return (
                <div key={h.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 text-indigo-500 p-2 rounded-lg"><Icon size={18} /></div>
                    <span className="text-sm font-bold text-slate-800">{h.title}</span>
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase ml-11 tracking-tighter">
                    {h.date}  |  {h.registrations} registered
                  </div>
                </div>
              );
            })}
          </div>
          <button className="w-full text-center py-2 text-[#4F46E5] text-sm font-bold hover:underline">View all hackathons →</button>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6 md:col-span-2 lg:col-span-1">
        <div className="flex items-center gap-2 text-[#4F46E5] font-extrabold uppercase text-[11px] tracking-widest ml-1">
          <Layout size={16} strokeWidth={3} /> Categories
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-2 h-full">
          <p className="text-[12px] text-slate-400 font-bold leading-relaxed pr-8 mb-4">Browse challenges by domain.</p>
          {categories.map((cat, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl cursor-pointer group transition-colors">
              <span className="text-sm font-bold text-slate-700">{cat}</span>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-[#4F46E5] group-hover:translate-x-1 transition-all" />
            </div>
          ))}
          <button className="w-full text-center py-2 mt-4 text-[#4F46E5] text-sm font-bold border-t border-slate-50 pt-6">View all categories →</button>
        </div>
      </div>
    </Container>
  </section>
);

const SocialProof = ({ leaderboard, reviews }: { leaderboard: any[]; reviews: any[] }) => (
  <section id="leaderboard" className="py-24 bg-white">
    <Container className="grid lg:grid-cols-2 gap-20">
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#4F46E5] font-extrabold uppercase text-[11px] tracking-widest ml-1">
            <Star size={16} fill="currentColor" /> Leader Board
          </div>
          <button className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-widest hover:underline">View Full Leaderboard →</button>
        </div>

        <div className="space-y-8 bg-slate-50/50 p-6 md:p-10 rounded-[40px] border border-slate-100">
          {leaderboard.map((user) => (
            <div key={user.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-3 md:gap-5">
                <div className="text-xs font-bold text-slate-400 w-4">{user.rank}</div>
                <img src={user.img} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                <span className="text-[14px] md:text-[15px] font-bold text-slate-800">{user.name}</span>
              </div>
              <div className="flex items-center gap-4 md:gap-6">
                <div className="h-2 w-20 md:w-32 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                  <div className="h-full bg-[#4F46E5]" style={{ width: `${user.pct}%` }} />
                </div>
                <span className="text-[13px] font-bold text-slate-600 w-20 text-right">{user.pts}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="space-y-10">
        <div className="flex items-center gap-2 text-[#4F46E5] font-extrabold uppercase text-[11px] tracking-widest ml-1">
          <Users size={16} strokeWidth={3} /> What Developers Say
        </div>

        <div className="space-y-8">
          {reviews.map((t, i) => (
            <div key={i} className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-100 shadow-sm relative group hover:shadow-md transition-shadow">
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => <Star key={j} size={14} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-[15px] text-slate-600 font-medium italic mb-8 leading-relaxed">{t.text}</p>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-slate-100 border border-white shadow-sm" />
                <div>
                  <div className="text-sm font-bold text-slate-900">{t.name}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  </section>
);

const Footer = () => (
  <footer className="pt-24 pb-12 bg-white border-t border-slate-50">
    <Container className="grid grid-cols-2 md:grid-cols-5 gap-16 mb-24">
      <div className="col-span-2 space-y-8">
        <div className="flex items-center gap-2">
          <div className="bg-[#4F46E5] p-1 rounded-lg">
            <Zap className="text-white fill-white" size={16} />
          </div>
          <span className="text-lg font-bold tracking-tight">ForgeInsight</span>
        </div>
        <p className="text-slate-500 text-[13px] font-medium leading-relaxed max-w-xs">
          The #1 platform to learn, build and compete in hackathons worldwide.
        </p>
      </div>

      {[
        { t: 'Platform', links: ['Courses', 'Hackathons', 'Leaderboard', 'Resources'] },
        { t: 'Company', links: ['About Us', 'Careers', 'Blog', 'Contact'] },
        { t: 'Support', links: ['Help Center', 'Community', 'Terms of Service', 'Privacy Policy'] }
      ].map(col => (
        <div key={col.t} className="space-y-6">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">{col.t}</h4>
          <ul className="space-y-4">
            {col.links.map(l => (
              <li key={l}><a href="#" className="text-[13px] font-bold text-slate-400 hover:text-[#4F46E5] transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>
      ))}
    </Container>

    <Container className="pt-10 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-widest gap-4">
      <p>© 2024 ForgeInsight Inc. All rights reserved.</p>
      <div className="flex gap-8">
        <a href="#" className="hover:text-slate-900">Follow Us</a>
        <div className="flex gap-4">
          <Globe size={14} className="cursor-pointer hover:text-slate-900" />
          <ExternalLink size={14} className="cursor-pointer hover:text-slate-900" />
        </div>
      </div>
    </Container>
  </footer>
);

export default function LandingPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [content, setContent] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [metricsData, contentData, leaderboardData, reviewsData] = await Promise.all([
        LandingService.getImpactMetrics(),
        LandingService.getLandingContent(),
        LandingService.getLeaderboard(),
        LandingService.getReviews(),
      ]);
      setMetrics(metricsData);
      setContent(contentData);
      setLeaderboard(leaderboardData);
      setReviews(reviewsData);
    };
    loadData();
  }, []);

  if (!metrics || !content) return null;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100">
      <Navbar />
      <Hero />
      <ImpactStats stats={metrics} />
      <ContentGrid
        courses={content.courses ?? []}
        hackathons={content.hackathons ?? []}
        categories={content.categories ?? []}
      />
      <SocialProof leaderboard={leaderboard} reviews={reviews} />
      <Footer />
    </div>
  );
}