import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plane, Users, Wrench, Building2, GraduationCap, Clock, Award, 
  ChevronRight, Star, ArrowRight, BookOpen, Target, TrendingUp,
  CheckCircle2, Play, Calendar
} from 'lucide-react';
import { useLeadStore } from '@/src/store/leadStore';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/src/store/authStore';

const PROGRAMS = [
  {
    id: 'airport-operations',
    category: 'Airport Operations',
    icon: Plane,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    description: 'Master terminal management, airline coordination, and airport logistics.',
    courses: [
      {
        id: 'airport-ops-core',
        title: 'Airport Operations Professional Track',
        duration: '6 months',
        level: 'Beginner',
        price: 125000,
        rating: 4.9,
        students: 1800,
        highlights: ['Terminal Management', 'Airline Coordination', 'Airport Logistics', 'Placement Support'],
        image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=600&q=80'
      },
      {
        id: 'airport-ops-advanced',
        title: 'Advanced Airport Operations & Control',
        duration: '9 months',
        level: 'Intermediate',
        price: 175000,
        rating: 4.8,
        students: 940,
        highlights: ['Ramp Operations', 'Control Room Coordination', 'Safety Procedures', 'Interview Preparation'],
        image: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=600&q=80'
      }
    ]
  },
  {
    id: 'dispatch-rtr',
    category: 'Flight Dispatch & RTR',
    icon: Users,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-600',
    description: 'Learn flight planning, weather analysis, and communication systems.',
    courses: [
      {
        id: 'dispatch-foundation',
        title: 'Flight Dispatch Foundation Program',
        duration: '4 months',
        level: 'Beginner',
        price: 95000,
        rating: 4.9,
        students: 1300,
        highlights: ['Flight Planning', 'Weather Analysis', 'Route Monitoring', 'Communication Protocols'],
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80'
      },
      {
        id: 'rtr-ops',
        title: 'RTR & Aviation Communication Operations',
        duration: '6 months',
        level: 'Intermediate',
        price: 140000,
        rating: 4.8,
        students: 980,
        highlights: ['Radio Telephony', 'Aviation Communication Systems', 'Operational Readiness', 'Mock Interviews'],
        image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80'
      }
    ]
  },
  {
    id: 'ground-handling',
    category: 'Ground Handling',
    icon: Wrench,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    description: 'Handle aircraft operations, safety procedures, and passenger services.',
    courses: [
      {
        id: 'ground-core',
        title: 'Ground Handling & Ramp Operations',
        duration: '3 months',
        level: 'Beginner',
        price: 55000,
        rating: 4.8,
        students: 2200,
        highlights: ['Safety Procedures', 'Aircraft Turnaround', 'Passenger Services', 'Placement Assistance'],
        image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80'
      },
      {
        id: 'ground-advanced',
        title: 'Advanced Ground Handling Excellence',
        duration: '5 months',
        level: 'Intermediate',
        price: 90000,
        rating: 4.7,
        students: 1250,
        highlights: ['Load Control', 'Coordination Workflow', 'Operational Safety', 'Profile Building'],
        image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=600&q=80'
      }
    ]
  },
  {
    id: 'documentation-trainer',
    category: 'Technical Documentation & Aviation Trainer',
    icon: Building2,
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    description: 'Work with technical records, compliance systems, and global training communication.',
    courses: [
      {
        id: 'tech-docs',
        title: 'Aeronautical Technical Documentation Program',
        duration: '6 months',
        level: 'Intermediate',
        price: 110000,
        rating: 4.6,
        students: 870,
        highlights: ['Technical Records', 'Compliance Systems', 'Documentation Standards', 'Career Preparation'],
        image: 'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=600&q=80'
      },
      {
        id: 'trainer-global',
        title: 'Aviation Trainer & Communication Excellence',
        duration: '4 months',
        level: 'Beginner',
        price: 85000,
        rating: 4.5,
        students: 760,
        highlights: ['Training Delivery', 'Global Communication', 'Seminar Facilitation', 'Industry Interaction'],
        image: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=600&q=80'
      }
    ]
  }
];

const STATS = [
  { label: 'Placement Support', value: '100%', icon: GraduationCap },
  { label: 'Salary Potential', value: '2-15 LPA+', icon: Target },
  { label: 'Global Internship Access', value: 'Available', icon: Building2 },
  { label: 'Direct Hiring Network', value: 'Airports & Airlines', icon: Award }
];

export default function Programs() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { openLeadModal } = useLeadStore();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleEnroll = (course: any, category: string) => {
    if (user) {
      navigate('/dashboard/courses');
    } else {
      openLeadModal({
        source: 'course_enroll',
        interest: `${course.title} (${category})`,
        title: 'Enroll in This Course',
        subtitle: 'Fill in your details and our counselor will guide you through the enrollment process.',
        onSuccess: () => navigate('/register')
      });
    }
  };

  const handleLearnMore = (program: any) => {
    openLeadModal({
      source: 'program_interest',
      interest: program.category,
      title: `Interested in ${program.category}?`,
      subtitle: 'Get detailed course information, fee structure, and career guidance from our experts.',
    });
  };

  const filteredPrograms = selectedCategory 
    ? PROGRAMS.filter(p => p.id === selectedCategory)
    : PROGRAMS;

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-purple-600/5 via-transparent to-pink-600/5" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-6">
              <GraduationCap className="h-4 w-4" />
              Industry-Leading Aviation Training
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 mb-6 text-balance">
              Launch Your Aviation Career
            </h1>
            <p className="text-xl text-slate-600 mb-10 text-pretty">
              Fastest-growing global industry, high-paying opportunities, and international exposure. Build your path with practical training, mentorship, and direct career acceleration support.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto justify-center px-8 py-4 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-200/50 flex items-center gap-2"
              >
                <BookOpen className="h-5 w-5" />
                Explore Programs
              </button>
              <button 
                onClick={() => openLeadModal({
                  source: 'enquiry',
                  interest: 'General Consultation',
                  title: 'Get Free Career Counseling',
                  subtitle: 'Our expert counselors will help you choose the right aviation career path.',
                })}
                className="w-full sm:w-auto justify-center px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-all border border-slate-200 flex items-center gap-2"
              >
                <Play className="h-5 w-5" />
                Free Consultation
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto"
          >
            {STATS.map((stat, idx) => (
              <div key={idx} className="glass-card p-6 rounded-2xl text-center">
                <div className="inline-flex p-3 bg-purple-100 rounded-xl text-purple-600 mb-3">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-lg z-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                !selectedCategory 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Programs
            </button>
            {PROGRAMS.map(program => (
              <button
                key={program.id}
                onClick={() => setSelectedCategory(selectedCategory === program.id ? null : program.id)}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                  selectedCategory === program.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <program.icon className="h-4 w-4" />
                {program.category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20">
        <div className="container mx-auto px-4 space-y-20">
          {filteredPrograms.map((program, programIdx) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: programIdx * 0.1 }}
            >
              {/* Category Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl bg-linear-to-br ${program.color} text-white shadow-lg`}>
                    <program.icon className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold text-slate-900">{program.category}</h2>
                    <p className="text-slate-500 mt-1">{program.description}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleLearnMore(program)}
                  className="flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700 transition-colors"
                >
                  Learn More <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Courses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {program.courses.map((course, idx) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="glass-card rounded-[28px] overflow-hidden group hover:shadow-xl transition-all duration-500"
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={course.image} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${program.bgColor} ${program.textColor}`}>
                          {course.level}
                        </span>
                        <div className="flex items-center gap-1 text-white text-sm">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{course.rating}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2">
                        {course.title}
                      </h3>

                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.students.toLocaleString()} students
                        </span>
                      </div>

                      <div className="space-y-2 mb-6">
                        {course.highlights.slice(0, 3).map((highlight, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <CheckCircle2 className={`h-4 w-4 ${program.textColor}`} />
                            {highlight}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div>
                          <span className="text-2xl font-bold text-slate-900">
                            {course.price >= 100000 
                              ? `₹${(course.price / 100000).toFixed(1)}L`
                              : `₹${course.price.toLocaleString()}`
                            }
                          </span>
                        </div>
                        <button
                          onClick={() => handleEnroll(course, program.category)}
                          className={`px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-linear-to-r ${program.color} hover:opacity-90 transition-opacity flex items-center gap-1`}
                        >
                          Enroll Now <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-br from-purple-600 to-indigo-700">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Your Aviation Career Starts Here
            </h2>
            <p className="text-xl text-purple-100 mb-10">
              Do not wait for opportunities. Create them with ARMZ Aviation through placement support, profile building, interview preparation, and global internship pathways.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => openLeadModal({
                  source: 'enquiry',
                  interest: 'Career Counseling Session',
                  title: 'Book Free Counseling',
                  subtitle: 'Our career counselors will help you find the perfect aviation career path.',
                })}
                className="w-full sm:w-auto justify-center px-8 py-4 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-all flex items-center gap-2"
              >
                <Calendar className="h-5 w-5" />
                Book Free Session
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="w-full sm:w-auto justify-center px-8 py-4 bg-transparent text-white font-bold rounded-xl border-2 border-white/30 hover:bg-white/10 transition-all"
              >
                Contact Us
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h3 className="text-lg font-medium text-slate-500">Trusted by leading airlines and aviation companies</h3>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            {['Air India', 'IndiGo', 'SpiceJet', 'Vistara', 'GoFirst', 'AirAsia'].map((airline, idx) => (
              <div key={idx} className="text-2xl font-bold text-slate-400">
                {airline}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
