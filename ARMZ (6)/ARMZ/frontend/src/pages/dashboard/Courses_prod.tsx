import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Play, Clock, CheckCircle2, Lock, Star, 
  Trophy, ArrowRight, Filter, Search, BarChart3,
  Users, Award, Loader2, MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/src/store/authStore';
import { apiService } from '@/src/services/api';
import SEO from '@/src/components/common/SEO';
import EmptyState from '@/src/components/common/EmptyState';
import toast from 'react-hot-toast';

export default function Courses() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-progress' | 'completed' | 'available'>('all');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await apiService.getEnrolledCourses(user?.id);
      setCourses(res.data.courses);
      setStats(res.data);
    } catch (error: any) {
      console.error("Error loading courses:", error);
      toast.error("Failed to load courses");
      if (error?.response?.status === 401 || error?.response?.status === 429 || error?.response?.status === 400) {
        sessionStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleResumeCourse = (courseId: string) => {
    toast.success("Redirecting to course...");
    setTimeout(() => navigate(`/courses/${courseId}`), 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
          <p className="text-slate-500">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 px-4 sm:px-0">
      <SEO title="My Courses" description="View and manage your enrolled courses" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 sm:space-y-6 pt-4 sm:pt-0"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">My Courses</h1>
            <p className="text-slate-500 mt-2">Continue learning and track your progress</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/programs')}
            className="px-6 py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex justify-center items-center gap-2 w-full lg:w-fit"
          >
            <BookOpen className="h-5 w-5" />
            Browse All Programs
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats && [
            { label: 'Enrolled', value: stats.totalEnrolled, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'In Progress', value: stats.inProgress, icon: Play, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Avg Progress', value: `${stats.avgProgress}%`, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-3 sm:p-4 rounded-xl"
            >
              <div className={`${stat.bg} ${stat.color} w-fit p-2 rounded-lg mb-2`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs sm:text-sm text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="glass-card p-4 rounded-xl flex items-center gap-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {['all', 'in-progress', 'completed', 'available'].map(status => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterStatus(status as any)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition-all ${
                filterStatus === status
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'glass-card text-slate-700 hover:bg-slate-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Courses Grid */}
      <AnimatePresence mode="wait">
        {filteredCourses.length > 0 ? (
          <motion.div
            key="courses"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {filteredCourses.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all group"
              >
                {/* Image Section */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm ${
                      course.status === 'completed'
                        ? 'bg-green-500/80 text-white'
                        : course.status === 'in-progress'
                        ? 'bg-blue-500/80 text-white'
                        : 'bg-slate-500/80 text-white'
                    }`}>
                      {course.status === 'in-progress' ? 'In Progress' : course.status === 'completed' ? 'Completed' : 'Available'}
                    </span>
                  </div>

                  {/* Completed Badge */}
                  {course.status === 'completed' && (
                    <div className="absolute top-4 left-4">
                      <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: 2 }}
                        className="bg-green-500 rounded-full p-2 text-white"
                      >
                        <Trophy className="h-5 w-5" />
                      </motion.div>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-6 space-y-4">
                  {/* Category & Rating */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                      {course.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-slate-900">{course.rating}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-2">{course.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.students?.toLocaleString() || 0} students</span>
                      </div>
                    </div>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center gap-3 py-3 border-y border-slate-200">
                    <img
                      src={course.instructorImage}
                      alt={course.instructor}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm line-clamp-1">{course.instructor}</p>
                      <p className="text-xs text-slate-500">Instructor</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {course.status !== 'available' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-bold text-slate-900">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 0.5 }}
                          className="bg-linear-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                        />
                      </div>
                      <div className="text-xs text-slate-500">
                        {course.completedModules} of {course.totalModules} modules
                      </div>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-slate-600 pt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    {course.status === 'in-progress' && (
                      <span className="text-xs text-slate-500">Accessed {course.lastAccessed}</span>
                    )}
                  </div>

                  {/* Action Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleResumeCourse(course.id)}
                    className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                      course.status === 'completed'
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-linear-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
                    }`}
                  >
                    {course.status === 'completed' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>View Certificate</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>{course.status === 'in-progress' ? 'Continue' : 'Start'} Course</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              icon={BookOpen}
              title="No courses found"
              description="Try adjusting your search or filters"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
