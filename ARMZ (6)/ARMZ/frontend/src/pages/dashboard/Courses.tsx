import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Play,
  CheckCircle2,
  ArrowRight,
  Search,
  BarChart3,
  Award,
  Loader2,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuthStore } from "@/src/store/authStore";
import { apiService } from "@/src/services/api";

type CourseRecord = {
  id: number | string;
  title: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  createdAt?: string;
  progress?: number;
  status?: "available" | "in-progress" | "completed";
};

const getCourseStatus = (progress: number) => {
  if (progress >= 100) {
    return "completed" as const;
  }
  if (progress > 0) {
    return "in-progress" as const;
  }
  return "available" as const;
};

const isRenderableThumbnail = (thumbnail?: string) => {
  const value = String(thumbnail ?? "").trim();
  if (!value) {
    return false;
  }

  if (/^data:image\//i.test(value)) {
    return true;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const hostname = new URL(value).hostname.toLowerCase();
      return hostname !== "via.placeholder.com" && hostname !== "placeholder.com";
    } catch {
      return false;
    }
  }

  return false;
};

export default function Courses() {
  const navigate = useNavigate();
  const { id: routeCourseId } = useParams();
  const { logout } = useAuthStore();
  const [allCourses, setAllCourses] = useState<CourseRecord[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all");
  const [activeCourse, setActiveCourse] = useState<CourseRecord | null>(null);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const [catalogResponse, enrolledResponse] = await Promise.all([
        apiService.getCourses(),
        apiService.getEnrolledCourses(),
      ]);

      const catalog = (catalogResponse.data.courses ?? []) as CourseRecord[];
      const enrolled = (enrolledResponse.data.courses ?? []) as CourseRecord[];

      const catalogById = new Map(catalog.map((course) => [String(course.id), course]));

      const mergedEnrolled = enrolled.map((course) => {
        const catalogCourse = catalogById.get(String(course.id));
        const progress = Number(course.progress ?? 0);
        return {
          ...catalogCourse,
          ...course,
          progress,
          status: getCourseStatus(progress),
        };
      });

      setAllCourses(catalog);
      setEnrolledCourses(mergedEnrolled);
    } catch (error: any) {
      toast.error("Failed to load courses");
      if (error?.response?.status === 401 || error?.response?.status === 429 || error?.response?.status === 400) {
        sessionStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  useEffect(() => {
    if (!routeCourseId) {
      setActiveCourse(null);
      return;
    }

    const combined = [...enrolledCourses, ...allCourses];
    const matched = combined.find((course) => String(course.id) === routeCourseId);
    if (matched) {
      const progress = Number(matched.progress ?? 0);
      setActiveCourse({
        ...matched,
        progress,
        status: matched.status ?? getCourseStatus(progress),
      });
    }
  }, [routeCourseId, enrolledCourses, allCourses]);

  const filteredEnrolledCourses = useMemo(() => {
    return enrolledCourses.filter((course) => {
      const status = course.status ?? getCourseStatus(Number(course.progress ?? 0));
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(course.category ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === "all" || status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [enrolledCourses, searchQuery, filter]);

  const recommendedCourses = useMemo(() => {
    const enrolledIds = new Set(enrolledCourses.map((course) => String(course.id)));
    return allCourses.filter((course) => !enrolledIds.has(String(course.id))).slice(0, 6);
  }, [allCourses, enrolledCourses]);

  const overallProgress =
    enrolledCourses.length > 0
      ? Math.round(
          enrolledCourses.reduce((sum, course) => sum + Number(course.progress ?? 0), 0) /
            enrolledCourses.length
        )
      : 0;

  const completedCourses = enrolledCourses.filter((course) => course.status === "completed").length;

  const openCourse = (courseId: number | string) => {
    navigate(`/dashboard/courses/${courseId}`);
  };

  const closeCourse = () => {
    navigate("/dashboard/courses");
  };

  const handleAdvanceProgress = async () => {
    if (!activeCourse) {
      return;
    }

    const currentProgress = Number(activeCourse.progress ?? 0);
    const nextProgress = currentProgress === 0 ? 10 : Math.min(100, currentProgress + 20);

    setIsSavingProgress(true);
    try {
      await apiService.updateCourseProgress(String(activeCourse.id), nextProgress);
      toast.success(nextProgress >= 100 ? "Course completed" : "Progress updated");
      await loadCourses();
      if (nextProgress >= 100) {
        setActiveCourse((current) =>
          current
            ? {
                ...current,
                progress: 100,
                status: "completed",
              }
            : current
        );
      }
    } catch (error) {
      toast.error("Could not update course progress");
    } finally {
      setIsSavingProgress(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <AnimatePresence>
        {activeCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeCourse}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="glass-card w-full max-w-3xl rounded-4xl overflow-hidden"
            >
              <div className="relative h-56 bg-slate-100">
                {isRenderableThumbnail(activeCourse.thumbnail) ? (
                  <img src={activeCourse.thumbnail} alt={activeCourse.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <BookOpen className="h-12 w-12" />
                  </div>
                )}
                <button
                  onClick={closeCourse}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
                  aria-label="Close course"
                >
                  <X className="h-5 w-5 text-slate-700" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                      {activeCourse.category || "General"}
                    </span>
                    <h2 className="text-3xl font-bold text-slate-900 mt-3">{activeCourse.title}</h2>
                    <p className="text-slate-500 mt-3">
                      {activeCourse.description || "This course is now connected to your live learning dashboard."}
                    </p>
                  </div>
                  <div className="glass-card rounded-2xl px-4 py-3 min-w-40">
                    <div className="text-sm text-slate-500">Progress</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">{Number(activeCourse.progress ?? 0)}%</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-500">Learning progress</span>
                    <span className="font-semibold text-slate-900">{Number(activeCourse.progress ?? 0)}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        Number(activeCourse.progress ?? 0) >= 100
                          ? "bg-green-500"
                          : "bg-linear-to-r from-purple-500 to-indigo-500"
                      }`}
                      style={{ width: `${Number(activeCourse.progress ?? 0)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Status", value: (activeCourse.status ?? getCourseStatus(Number(activeCourse.progress ?? 0))).replace("-", " ") },
                    { label: "Added", value: activeCourse.createdAt ? new Date(activeCourse.createdAt).toLocaleDateString() : "Recently" },
                    { label: "Next Step", value: Number(activeCourse.progress ?? 0) >= 100 ? "Certificate ready" : "Continue learning" },
                  ].map((item) => (
                    <div key={item.label} className="glass-card rounded-2xl p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-400">{item.label}</div>
                      <div className="text-sm font-semibold text-slate-900 mt-2 capitalize">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => void handleAdvanceProgress()}
                    disabled={isSavingProgress}
                    className="px-6 py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSavingProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    {Number(activeCourse.progress ?? 0) === 0
                      ? "Start Course"
                      : Number(activeCourse.progress ?? 0) >= 100
                      ? "Refresh Completion"
                      : "Mark Next Lesson Complete"}
                  </button>
                  <button
                    onClick={closeCourse}
                    className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Back to Courses
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">My Courses</h1>
          <p className="text-slate-500 mt-1">Live course enrollments, progress tracking, and available programs.</p>
        </div>
        <button
          onClick={() => navigate("/programs")}
          className="px-6 py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-200/50 flex items-center gap-2 w-fit"
        >
          <BookOpen className="h-5 w-5" />
          Browse All Programs
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Enrolled Courses", value: enrolledCourses.length, icon: BookOpen, color: "from-blue-500 to-cyan-500" },
          { label: "Completed", value: completedCourses, icon: CheckCircle2, color: "from-green-500 to-emerald-500" },
          { label: "Overall Progress", value: `${overallProgress}%`, icon: BarChart3, color: "from-purple-500 to-pink-500" },
          { label: "Certificates Earned", value: completedCourses, icon: Award, color: "from-amber-500 to-orange-500" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className={`inline-flex p-3 rounded-xl bg-linear-to-br ${stat.color} text-white mb-4`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search enrolled courses..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "in-progress", "completed"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                filter === value
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {value === "all" ? "All" : value === "in-progress" ? "In Progress" : "Completed"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading your live courses...</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Continue Learning</h2>
            {filteredEnrolledCourses.length === 0 ? (
              <div className="text-center py-12 glass-card rounded-2xl">
                <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No enrolled courses found</h3>
                <p className="text-slate-500">Start a course from the recommendations below.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredEnrolledCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    className="glass-card rounded-2xl overflow-hidden group"
                  >
                    <div className="relative h-48 bg-slate-100">
                      {isRenderableThumbnail(course.thumbnail) ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <BookOpen className="h-10 w-10" />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                          {course.category || "General"}
                        </span>
                        <span
                          className={`text-xs font-medium px-3 py-1 rounded-full ${
                            course.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {course.status === "completed" ? "Completed" : "In Progress"}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mt-3">{course.title}</h3>
                      <p className="text-sm text-slate-500 mt-2 line-clamp-3">
                        {course.description || "This course is connected to your live dashboard progress."}
                      </p>

                      <div className="mt-5">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-500">Progress</span>
                          <span className="font-semibold text-slate-900">{Number(course.progress ?? 0)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              Number(course.progress ?? 0) >= 100
                                ? "bg-green-500"
                                : "bg-linear-to-r from-purple-500 to-indigo-500"
                            }`}
                            style={{ width: `${Number(course.progress ?? 0)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end mt-5 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => openCourse(course.id)}
                          className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                        >
                          {course.status === "completed" ? "Review" : "Continue"}
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6 pt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Available Programs</h2>
              <button
                onClick={() => navigate("/programs")}
                className="text-purple-600 font-medium text-sm hover:text-purple-700 flex items-center gap-1"
              >
                View All <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {recommendedCourses.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center">
                <Sparkles className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">You are enrolled in every available course</h3>
                <p className="text-slate-500">New programs will appear here as soon as admins add them.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {recommendedCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    className="glass-card rounded-2xl overflow-hidden"
                  >
                    <div className="h-40 bg-slate-100">
                      {isRenderableThumbnail(course.thumbnail) ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <BookOpen className="h-10 w-10" />
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <span className="text-xs font-medium text-slate-500">{course.category || "General"}</span>
                      <h3 className="text-base font-bold text-slate-900 mt-2 line-clamp-2">{course.title}</h3>
                      <p className="text-sm text-slate-500 mt-2 line-clamp-3">
                        {course.description || "Start this course to create a live enrollment and begin tracking progress."}
                      </p>

                      <button
                        onClick={() => openCourse(course.id)}
                        className="w-full mt-5 py-2.5 rounded-lg font-semibold text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                      >
                        Start Learning
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
