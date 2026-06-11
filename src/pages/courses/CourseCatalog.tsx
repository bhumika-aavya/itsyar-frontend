import React from 'react';
import { Book, Clock, Star, Users, Code, Layout, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContinueCard = ({ title, icon: Icon, level, lessons, iconColor }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
    <div className={`${iconColor} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
      <Icon size={24} />
    </div>
    <h4 className="font-bold text-slate-900 mb-4 leading-tight">{title}</h4>
    <div className="flex items-center justify-between mb-4">
      <div className="text-[11px] font-bold text-slate-400">0% Complete</div>
      <div className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase">{level}</div>
    </div>
    <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
      <div className="w-0 h-full bg-[#4F39F6] rounded-full transition-all duration-1000 group-hover:w-[5%]" />
    </div>
    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
      <Book size={14} /> {lessons}
    </div>
  </div>
);

const CourseGridCard = ({ title, tag, duration, instructor, description, image, badge }: any) => {
    const navigate = useNavigate();

  return(
  <div 
  onClick={() => navigate(`/courses/${'234'}`)}
  className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group flex flex-col">
    <div className="h-48 overflow-hidden relative">
      {badge && (
        <span className="absolute top-4 left-4 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg z-10">
          {badge}
        </span>
      )}
      <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    </div>
    <div className="p-6 flex flex-col flex-1">
      <div className="flex gap-2 mb-4">
        <span className="bg-indigo-50 text-[#4F39F6] text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">{tag}</span>
        <span className="bg-slate-50 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">{duration}</span>
      </div>
      <h3 className="font-bold text-slate-900 mb-3 group-hover:text-[#4F39F6] transition-colors">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed font-medium mb-6 flex-1">{description}</p>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
            <img src={`https://i.pravatar.cc/150?u=${instructor}`} alt="" />
          </div>
          <span className="text-[11px] font-bold text-slate-500">by {instructor}</span>
        </div>
        <button className="text-[11px] font-bold text-[#4F39F6] hover:underline">Enroll Now →</button>
      </div>
    </div>
  </div>
)};

export default function CourseCatalog() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="text-left space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Available Courses</h1>
        <p className="text-slate-500 text-sm font-medium">
          Explore and enroll in a wide variety of courses designed to take your developer skills to the next level.
        </p>
      </section>

      {/* Continue Learning */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#4F39F6] uppercase tracking-widest">My Courses</h2>
          <button className="text-[12px] font-bold text-[#4F39F6] hover:underline">View all courses →</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ContinueCard 
            title="Python Programming for Beginners" 
            icon={Code} 
            level="Beginner" 
            lessons="12 Lessons" 
            iconColor="bg-blue-50 text-blue-500" 
          />
          <ContinueCard 
            title="Web Development Bootcamp" 
            icon={Layout} 
            level="Intermediate" 
            lessons="18 Lessons" 
            iconColor="bg-orange-50 text-orange-500" 
          />
          <ContinueCard 
            title="Data Science Fundamentals" 
            icon={Database} 
            level="Beginner" 
            lessons="6 Weeks" 
            iconColor="bg-slate-100 text-slate-500" 
          />
        </div>
      </section>

      {/* All Courses */}
      <section className="space-y-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">All Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <CourseGridCard 
            badge="New"
            tag="Web3"
            duration="6 Weeks"
            title="Decentralized Apps with Solidity"
            description="Master the art of building secure smart contracts and full-stack dApps on Ethereum."
            image="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800"
            instructor="Team NeuralNinjas"
          />
          <CourseGridCard 
            tag="Frontend"
            duration="8 Weeks"
            title="UI/UX with React"
            description="Learn to bridge the gap between high-end design and high-performance frontend code."
            image="https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800"
            instructor="Team WebWizards"
          />
          <CourseGridCard 
            tag="Cloud"
            duration="10 Weeks"
            title="Cloud Native Architectures"
            description="Deep dive into Kubernetes, Docker, and serverless scaling strategies for global traffic."
            image="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800"
            instructor="Team CodeCrafters"
          />
          <CourseGridCard 
            tag="Cloud"
            duration="10 Weeks"
            title="DevOps Lifecycle Mastery"
            description="Master CI/CD pipelines, observability, and automation tools for enterprise systems."
            image="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=800"
            instructor="Team CodeCrafters"
          />
          <CourseGridCard 
            tag="AI/ML"
            duration="12 Weeks"
            title="Deep Learning & LLMs"
            description="Build, train, and deploy your own large language models and generative AI systems."
            image="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800"
            instructor="Team NeuralNinjas"
          />
          <CourseGridCard 
            tag="Frontend"
            duration="5 Weeks"
            title="Advanced Animation in CSS"
            description="Create breathtaking user experiences using framer-motion and raw CSS magic."
            image="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800"
            instructor="Team WebWizards"
          />
        </div>

        <div className="flex justify-center pt-10 pb-20">
          <button className="bg-slate-100 hover:bg-slate-200 text-[#4F39F6] font-bold px-10 py-3.5 rounded-2xl transition-all text-sm">
            Load More Courses
          </button>
        </div>
      </section>
    </div>
  );
}