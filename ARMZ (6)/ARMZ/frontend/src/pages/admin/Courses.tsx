import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Loader2,
  Users,
  CalendarDays,
  Layers3,
  Link as LinkIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import apiService from "@/src/services/api";

type CourseRecord = {
  id: number | string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  createdAt?: string;
  created_at?: string;
};

type CourseStats = {
  totalCourses?: number;
  publishedCourses?: number;
  totalEnrollments?: number;
} | null;

const emptyForm = {
  title: "",
  category: "",
  description: "",
  thumbnail: "",
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

export default function AdminCourses() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [stats, setStats] = useState<CourseStats>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getAdminCourses();
      setCourses(response.data.courses ?? []);
      setStats(response.data.stats ?? null);
    } catch (error) {
      toast.error("Unable to load courses right now");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  const categories = useMemo(() => {
    const values = courses.map((course) => course.category).filter(Boolean);
    return ["all", ...Array.from(new Set(values))];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchQuery, selectedCategory]);

  const derivedStats = {
    totalCourses: stats?.totalCourses ?? courses.length,
    activeCategories: categories.filter((category) => category !== "all").length,
    totalEnrollments: stats?.totalEnrollments ?? 0,
    latestCourseDate:
      courses[0]?.createdAt || courses[0]?.created_at || null,
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    setFormData(emptyForm);
  };

  const handleEdit = (course: CourseRecord) => {
    setEditingCourse(course);
    setFormData({
      title: course.title ?? "",
      category: course.category ?? "",
      description: course.description ?? "",
      thumbnail: course.thumbnail ?? "",
    });
    setShowModal(true);
  };

  const handleDelete = async (courseId: number | string) => {
    if (!window.confirm("Delete this course from the live catalog?")) {
      return;
    }

    try {
      await apiService.deleteAdminCourse(String(courseId));
      setCourses((current) => current.filter((course) => course.id !== courseId));
      toast.success("Course deleted");
    } catch (error) {
      toast.error("Course could not be deleted");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category.trim(),
        description: formData.description.trim(),
        thumbnail: formData.thumbnail.trim(),
      };

      if (editingCourse) {
        const response = await apiService.updateAdminCourse(String(editingCourse.id), payload);
        setCourses((current) =>
          current.map((course) => (course.id === editingCourse.id ? response.data : course))
        );
        toast.success("Course updated");
      } else {
        const response = await apiService.createAdminCourse(payload);
        setCourses((current) => [response.data, ...current]);
        toast.success("Course created");
      }

      resetModal();
      void loadCourses();
    } catch (error) {
      toast.error("Course could not be saved");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={resetModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="glass-card w-full max-w-2xl p-8 rounded-4xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editingCourse ? "Edit Course" : "Create Course"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    These changes save directly to your backend course catalog.
                  </p>
                </div>
                <button
                  onClick={resetModal}
                  className="p-2 hover:bg-slate-100 rounded-full"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-slate-600">Course Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                    required
                    className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    placeholder="Professional Cabin Crew Training"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    placeholder="Cabin Crew"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, description: event.target.value }))
                    }
                    rows={5}
                    className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                    placeholder="Outline what students will learn in this course."
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600">Thumbnail URL</label>
                  <div className="relative mt-1">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="url"
                      value={formData.thumbnail}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, thumbnail: event.target.value }))
                      }
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      placeholder="https://example.com/course-cover.jpg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  {editingCourse ? "Update Course" : "Create Course"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Course Management</h1>
          <p className="text-slate-500 mt-1">Manage the live training catalog from your admin dashboard.</p>
        </div>
        <button
          onClick={() => {
            setEditingCourse(null);
            setFormData(emptyForm);
            setShowModal(true);
          }}
          className="px-6 py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-200/50 flex items-center gap-2 w-fit"
        >
          <Plus className="h-5 w-5" />
          Create Course
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Courses", value: derivedStats.totalCourses, icon: BookOpen, color: "from-blue-500 to-cyan-500" },
          { label: "Categories", value: derivedStats.activeCategories, icon: Layers3, color: "from-purple-500 to-pink-500" },
          { label: "Enrollments", value: derivedStats.totalEnrollments, icon: Users, color: "from-green-500 to-emerald-500" },
          {
            label: "Latest Publish",
            value: derivedStats.latestCourseDate
              ? new Date(derivedStats.latestCourseDate).toLocaleDateString()
              : "No data",
            icon: CalendarDays,
            color: "from-amber-500 to-orange-500",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="glass-card p-5 rounded-2xl"
          >
            <div className={`inline-flex p-2.5 rounded-xl bg-linear-to-br ${stat.color} text-white mb-3`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
        >
          {categories.map((category, index) => (
            <option key={`${category}-${index}`} value={category}>
              {category === "all" ? "All categories" : category}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading live course data...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No courses found</h3>
          <p className="text-slate-500">Adjust the filters or create a new course.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <div className="h-44 bg-slate-100">
                {isRenderableThumbnail(course.thumbnail) ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <BookOpen className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-purple-600">{course.category || "General"}</span>
                  <span className="text-xs text-slate-400">
                    {course.createdAt || course.created_at
                      ? new Date(course.createdAt || course.created_at || "").toLocaleDateString()
                      : "Recently added"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mt-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-4">
                  {course.description || "No course description added yet."}
                </p>

                <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleEdit(course)}
                    className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                    aria-label="Edit course"
                  >
                    <Edit2 className="h-4 w-4 text-purple-600" />
                  </button>
                  <button
                    onClick={() => void handleDelete(course.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Delete course"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
