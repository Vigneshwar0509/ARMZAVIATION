import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Check, X, RefreshCw, Search, Filter, BarChart3, TrendingUp, Users, Activity, Eye, MapPin, Settings2, UserCheck, UserX, Mail, Phone, Calendar, BookOpen, Award, Zap, Download } from "lucide-react";
import { apiService } from "@/src/services/api";
import { Button } from "@/src/components/ui/Button";
import { GlassCard } from "@/src/components/common/GlassCard";
import StableResponsiveContainer from "@/src/components/common/StableResponsiveContainer";
import { Input } from "@/src/components/ui/Input";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  institution?: string;
  major?: string;
  enrollmentDate: string;
  status: 'Active' | 'Inactive' | 'Pending';
  courses: number;
  assessments: number;
  profileCompletion: number;
  location?: string;
  gpa?: string;
  photoURL?: string;
  resumeData?: Record<string, any>;
  lastLogin?: string;
}

interface StudentStats {
  totalStudents: number;
  loggedInStudents: number;
  activeStudents: number;
  pendingStudents: number;
  averageProfileCompletion: number;
  totalCourses: number;
  completedCourses: number;
  studentsByStatus: { status: string; count: number; color: string }[];
  enrollmentTrend: { month: string; students: number }[];
}

export default function AdminStudents() {
  const PAGE_SIZE = 8;
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "analytics">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "pending">("all");
  const [sortBy, setSortBy] = useState<"firstName" | "lastName" | "status" | "courses" | "profileCompletion" | "enrollmentDate">("enrollmentDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statusDotClass = (color: string) => {
    switch (color.toLowerCase()) {
      case "#10b981":
        return "bg-emerald-500";
      case "#f59e0b":
        return "bg-amber-500";
      case "#ef4444":
        return "bg-rose-500";
      default:
        return "bg-slate-400";
    }
  };

  const mapStudent = (item: any): Student => ({
    id: String(item.id),
    firstName: item.firstName || item.first_name || item.name?.split(" ")[0] || "",
    lastName: item.lastName || item.last_name || item.name?.split(" ").slice(1).join(" ") || "",
    email: item.email || "",
    phone: item.phone || "",
    institution: item.institution || item.college || "",
    major: item.major || item.department || "",
    enrollmentDate: item.enrollmentDate || item.enrolledAt || item.createdAt || new Date().toISOString(),
    status: (item.status || "Pending") as Student["status"],
    courses: Number(item.courses || item.courseCount || 0),
    assessments: Number(item.assessments || item.assessmentCount || 0),
    profileCompletion: Number(item.profileCompletion || item.profile_completion || 0),
    location: item.location || "",
    gpa: item.gpa || "",
    photoURL: item.photoURL || item.avatar || "",
    resumeData: item.resumeData || item.resume_data || {},
    lastLogin: item.lastLogin || item.last_login || item.user?.last_login || "",
  });

  const buildStats = (data: Student[]): StudentStats => {
    const totalStudents = data.length;
    const loggedInStudents = data.filter((s) => !!s.lastLogin).length;
    const activeStudents = data.filter((s) => s.status === "Active").length;
    const pendingStudents = data.filter((s) => s.status === "Pending").length;
    const averageProfileCompletion = totalStudents
      ? Math.round(data.reduce((sum, s) => sum + (s.profileCompletion || 0), 0) / totalStudents)
      : 0;
    const totalCourses = data.reduce((sum, s) => sum + (s.courses || 0), 0);
    const completedCourses = Math.round(totalCourses * 0.55);

    const studentsByStatus = [
      { status: "Active", count: activeStudents, color: "#10b981" },
      { status: "Inactive", count: data.filter((s) => s.status === "Inactive").length, color: "#ef4444" },
      { status: "Pending", count: pendingStudents, color: "#f59e0b" },
    ];

    const monthly = new Map<string, number>();
    data.forEach((s) => {
      const d = new Date(s.enrollmentDate);
      const label = Number.isNaN(d.getTime())
        ? "Unknown"
        : d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      monthly.set(label, (monthly.get(label) || 0) + 1);
    });

    const enrollmentTrend = Array.from(monthly.entries())
      .slice(-5)
      .map(([month, students]) => ({ month, students }));

    return {
      totalStudents,
      loggedInStudents,
      activeStudents,
      pendingStudents,
      averageProfileCompletion,
      totalCourses,
      completedCourses,
      studentsByStatus,
      enrollmentTrend,
    };
  };

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getStudents();
      const mapped = (response.data || [])
        .filter((item: any) => {
          const itemRole = item.role || item.user?.role;
          return itemRole ? itemRole === "student" : true;
        })
        .map(mapStudent);
      setStudents(mapped);
      setStats(buildStats(mapped));
      toast.success('Student data refreshed', { id: 'student-data-refreshed' });
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || student.status.toLowerCase() === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, filterStatus]);

  const sortedStudents = useMemo(() => {
    const list = [...filteredStudents];
    list.sort((a, b) => {
      let left: number | string = "";
      let right: number | string = "";

      if (sortBy === "courses" || sortBy === "profileCompletion") {
        left = Number(a[sortBy] || 0);
        right = Number(b[sortBy] || 0);
      } else if (sortBy === "enrollmentDate") {
        left = new Date(a.enrollmentDate || 0).getTime();
        right = new Date(b.enrollmentDate || 0).getTime();
      } else {
        left = String(a[sortBy] || "").toLowerCase();
        right = String(b[sortBy] || "").toLowerCase();
      }

      if (left < right) return sortDirection === "asc" ? -1 : 1;
      if (left > right) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredStudents, sortBy, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(sortedStudents.length / PAGE_SIZE));
  const pagedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedStudents.slice(start, start + PAGE_SIZE);
  }, [sortedStudents, currentPage]);

  const currentPageStudentIds = pagedStudents.map((student) => student.id);
  const areAllCurrentPageSelected =
    currentPageStudentIds.length > 0 && currentPageStudentIds.every((id) => selectedStudentIds.includes(id));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortBy, sortDirection]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const handleEdit = (student: Student) => {
    setEditingStudent({ ...student });
    setCreatingStudent(false);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    const newStudent: Student = { id: "", firstName: "", lastName: "", email: "", phone: "", institution: "", major: "", enrollmentDate: new Date().toISOString(), status: "Pending", courses: 0, assessments: 0, profileCompletion: 0, gpa: "", resumeData: {} };
    setEditingStudent(newStudent);
    setCreatingStudent(true);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingStudent || !editingStudent.firstName || !editingStudent.email) {
      toast.error("Please fill in required fields");
      return;
    }
    try {
      if (creatingStudent) {
        await apiService.createStudent(editingStudent);
        toast.success("Student added successfully!");
      } else {
        await apiService.updateStudent(editingStudent.id, editingStudent);
        toast.success(`${editingStudent.firstName} updated!`);
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (error) {
      console.error("Failed to save student:", error);
      toast.error("Failed to save student");
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!confirm("Delete this student account?")) return;
    try {
      await apiService.deleteStudent(studentId);
      toast.success("Student deleted");
      fetchStudents();
    } catch (error) {
      toast.error("Failed to delete student");
    }
  };

  const handleStatusToggle = async (studentId: string, status: string) => {
    try {
      const newStatus = status === "Active" ? "Inactive" : "Active";
      await apiService.updateStudent(studentId, { status: newStatus });
      toast.success(`Student ${newStatus}`);
      fetchStudents();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const toggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const toggleSelectCurrentPage = () => {
    if (areAllCurrentPageSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !currentPageStudentIds.includes(id)));
      return;
    }
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...currentPageStudentIds])));
  };

  const handleBulkStatusChange = async (status: Student["status"]) => {
    const selected = students.filter((student) => selectedStudentIds.includes(student.id));
    if (selected.length === 0) {
      toast.error("No students selected");
      return;
    }

    try {
      await Promise.all(selected.map((student) => apiService.updateStudent(student.id, { status })));
      toast.success(`Updated ${selected.length} students`);
      setSelectedStudentIds([]);
      fetchStudents();
    } catch {
      toast.error("Failed bulk status update");
    }
  };

  const handleBulkDelete = async () => {
    const selected = students.filter((student) => selectedStudentIds.includes(student.id));
    if (selected.length === 0) {
      toast.error("No students selected");
      return;
    }

    if (!confirm(`Delete ${selected.length} selected students?`)) return;

    try {
      await Promise.all(selected.map((student) => apiService.deleteStudent(student.id)));
      toast.success(`Deleted ${selected.length} students`);
      setSelectedStudentIds([]);
      fetchStudents();
    } catch {
      toast.error("Failed bulk delete");
    }
  };

  const handleExportStudents = () => {
    const headers = ["First Name", "Last Name", "Email", "Status", "Courses", "Profile Completion", "Institution", "Enrollment Date"];
    const rows = sortedStudents.map((student) => [
      student.firstName,
      student.lastName,
      student.email,
      student.status,
      String(student.courses || 0),
      `${student.profileCompletion || 0}%`,
      student.institution || "",
      student.enrollmentDate,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("Students exported");
  };

  const enrollmentData = stats?.enrollmentTrend || [];
  const completionData = useMemo(() => {
    const ranges = [
      { range: "0-25%", min: 0, max: 25, color: "#ef4444" },
      { range: "25-50%", min: 25, max: 50, color: "#f59e0b" },
      { range: "50-75%", min: 50, max: 75, color: "#3b82f6" },
      { range: "75-100%", min: 75, max: 101, color: "#10b981" },
    ];

    return ranges.map((bucket) => ({
      range: bucket.range,
      color: bucket.color,
      count: students.filter((student) => {
        const completion = Number(student.profileCompletion || 0);
        return completion >= bucket.min && completion < bucket.max;
      }).length,
    }));
  }, [students]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Student Management</h1><p className="text-slate-500 text-sm font-medium mt-1">Manage students and track progress</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (<GlassCard key={i} className="space-y-4" hoverEffect={false}><div className="h-12 w-12 bg-slate-100 rounded-2xl animate-pulse" /><div className="space-y-2"><div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" /><div className="h-8 w-1/4 bg-slate-100 rounded animate-pulse" /></div></GlassCard>))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Student Management</h1><p className="text-slate-500 text-sm font-medium mt-1">Manage students and track progress</p></div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchStudents} className="rounded-xl"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={handleExportStudents} className="rounded-xl"><Download className="h-4 w-4 mr-2" />Export</Button>
          <Button size="sm" className="rounded-xl" onClick={handleCreate}><Plus className="h-4 w-4 mr-2" />Add Student</Button>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl w-fit">
        {[{ id: "overview", label: "Overview", icon: BarChart3 }, { id: "students", label: "Students", icon: Users }, { id: "analytics", label: "Analytics", icon: TrendingUp }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}`}>
            {activeTab === tab.id && (
              <motion.div
                layoutId="admin-students-tabs"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2"><tab.icon className="h-4 w-4" />{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{ label: "Total Students", value: stats?.totalStudents || 0, trend: "+45", up: true, icon: Users, color: "text-blue-500", bg: "bg-blue-50" }, { label: "Logged In", value: stats?.loggedInStudents || 0, trend: "+12", up: true, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-50" }, { label: "Avg Completion", value: `${stats?.averageProfileCompletion || 0}%`, trend: "+8%", up: true, icon: Award, color: "text-purple-500", bg: "bg-purple-50" }, { label: "Courses Taken", value: stats?.completedCourses || 0, trend: "+156", up: true, icon: BookOpen, color: "text-orange-500", bg: "bg-orange-50" }].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}><stat.icon className="h-6 w-6" /></div>
                    <div className={`flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${stat.up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{stat.trend}</div>
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-3xl font-display font-bold text-slate-900 mt-2">{stat.value}</h3>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard className="p-8" hoverEffect={false}>
              <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">Enrollment Trend</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Weekly signups</p></div></div>
              {enrollmentData.length > 0 ? (
                <StableResponsiveContainer className="w-full" minHeight={300}>
                  <AreaChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" stroke="#64748b" fontSize={12} /><YAxis stroke="#64748b" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} /><Area type="monotone" dataKey="students" stroke="#3b82f6" fill="url(#enrollGradient)" strokeWidth={2} /><defs><linearGradient id="enrollGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/></linearGradient></defs>
                  </AreaChart>
                </StableResponsiveContainer>
              ) : (
                <div className="h-75 rounded-3xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-center px-6">
                  <div>
                    <p className="font-semibold text-slate-500">No enrollment trend data yet</p>
                    <p className="mt-1 text-sm text-slate-400">Student signups will appear here automatically</p>
                  </div>
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-8" hoverEffect={false}>
              <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">Student Status</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Distribution</p></div></div>
              {((stats?.studentsByStatus || []).length > 0) ? (
                <StableResponsiveContainer className="w-full" minHeight={300}>
                  <RechartsPieChart>
                  <Pie data={stats?.studentsByStatus || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count">
                    {(stats?.studentsByStatus || []).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  </RechartsPieChart>
                </StableResponsiveContainer>
              ) : (
                <div className="h-75 rounded-3xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-center px-6">
                  <div>
                    <p className="font-semibold text-slate-500">No student status data yet</p>
                    <p className="mt-1 text-sm text-slate-400">Status distribution appears after students are added</p>
                  </div>
                </div>
              )}
              {(stats?.studentsByStatus || []).length > 0 && (
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {(stats?.studentsByStatus || []).map((stat) => (
                    <div 
                      key={stat.status} 
                      className="flex items-center gap-2"
                    >
                      <div className={`w-3 h-3 rounded-full ${statusDotClass(stat.color)}`} />
                      <span className="text-sm text-slate-600">{stat.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === "students" && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" /><Input placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 rounded-xl" /></div>
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <select aria-label="Filter by status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="bg-white border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-purple-600">
                  <option value="all">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option>
                </select>
                <select aria-label="Sort students" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-white border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-purple-600">
                  <option value="enrollmentDate">Sort: Enrollment Date</option>
                  <option value="firstName">Sort: First Name</option>
                  <option value="lastName">Sort: Last Name</option>
                  <option value="status">Sort: Status</option>
                  <option value="courses">Sort: Courses</option>
                  <option value="profileCompletion">Sort: Completion</option>
                </select>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={toggleSortDirection}>
                  {sortDirection === "asc" ? "Asc" : "Desc"}
                </Button>
              </div>
            </div>
          </GlassCard>

          {selectedStudentIds.length > 0 && (
            <GlassCard className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-slate-600 font-medium">{selectedStudentIds.length} selected</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleBulkStatusChange("Active")}>Set Active</Button>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleBulkStatusChange("Pending")}>Set Pending</Button>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleBulkStatusChange("Inactive")}>Set Inactive</Button>
                  <Button variant="outline" size="sm" className="rounded-xl text-rose-600 hover:text-rose-700" onClick={handleBulkDelete}>Delete Selected</Button>
                </div>
              </div>
            </GlassCard>
          )}

          <div className="flex items-center justify-between px-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <input
                type="checkbox"
                checked={areAllCurrentPageSelected}
                onChange={toggleSelectCurrentPage}
                className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              Select Page
            </label>
            <span className="text-xs text-slate-500">Showing {pagedStudents.length} of {sortedStudents.length}</span>
          </div>

          <div className="space-y-3">
            {pagedStudents.map((student) => (
              <motion.div key={student.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => toggleSelectStudent(student.id)}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          aria-label={`Select ${student.firstName} ${student.lastName}`}
                        />
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><Users size={24} /></div>
                        <div>
                          <h3 className="text-lg font-display font-bold text-slate-900">{student.firstName} {student.lastName}</h3>
                          <p className="text-sm text-slate-500">{student.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-xs text-slate-600"><Mail size={14} className="mr-2 text-slate-400" />{student.institution}</div>
                        <div className="flex items-center text-xs text-slate-600"><BookOpen size={14} className="mr-2 text-slate-400" />{student.courses} courses</div>
                        <div className="flex items-center text-xs text-slate-600"><Award size={14} className="mr-2 text-slate-400" />{student.profileCompletion}% complete</div>
                        <div className="flex items-center text-xs text-slate-600"><Calendar size={14} className="mr-2 text-slate-400" />{new Date(student.enrollmentDate).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center text-xs text-slate-600"><Activity size={14} className="mr-2 text-slate-400" />{student.lastLogin ? new Date(student.lastLogin).toLocaleString() : "Never logged in"}</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600">{student.major}</span>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${student.status === "Active" ? "bg-emerald-50 text-emerald-700" : student.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600"}`}>{student.status}</span>
                        {student.resumeData && Object.keys(student.resumeData).length > 0 && (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">Resume Saved</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-blue-50 hover:text-blue-600 h-8 w-8" onClick={() => handleEdit(student)}><Edit2 size={16} /></Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl hover:bg-purple-50 hover:text-purple-600 h-8 w-8"
                        onClick={() => handleStatusToggle(student.id, student.status)}
                        aria-label={student.status === "Active" ? "Deactivate student" : "Activate student"}
                        title={student.status === "Active" ? "Deactivate" : "Activate"}
                      >
                        {student.status === "Active" ? <UserX size={16} /> : <UserCheck size={16} />}
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-rose-50 hover:text-rose-600 h-8 w-8" onClick={() => handleDelete(student.id)}><Trash2 size={16} /></Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {sortedStudents.length > PAGE_SIZE && (
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600 font-medium">Page {currentPage} of {pageCount}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
                  disabled={currentPage === pageCount}
                >
                  Next
                </Button>
              </div>
            </GlassCard>
          )}

          {sortedStudents.length === 0 && (
            <GlassCard className="p-12 text-center">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No students found</p>
            </GlassCard>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-8">
          <GlassCard className="p-8" hoverEffect={false}>
            <div className="flex items-center justify-between mb-8"><div><h2 className="text-xl font-display font-bold text-slate-900">Profile Completion</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Student distribution</p></div></div>
            <StableResponsiveContainer className="w-full" minHeight={400}>
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="range" stroke="#64748b" fontSize={12} /><YAxis stroke="#64748b" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }} /><Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </StableResponsiveContainer>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><TrendingUp className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Course Completion</p><p className="text-2xl font-display font-bold text-slate-900">{stats ? ((stats.completedCourses / stats.totalCourses) * 100).toFixed(1) : '0'}%</p></div></div></GlassCard>
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Activity className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Active Rate</p><p className="text-2xl font-display font-bold text-slate-900">{stats ? ((stats.activeStudents / stats.totalStudents) * 100).toFixed(1) : '0'}%</p></div></div></GlassCard>
            <GlassCard className="p-6"><div className="flex items-center gap-4"><div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Users className="h-6 w-6" /></div><div><p className="text-slate-400 text-xs font-bold uppercase">Avg Courses/Student</p><p className="text-2xl font-display font-bold text-slate-900">{stats ? (stats.totalCourses / stats.totalStudents).toFixed(1) : '0'}</p></div></div></GlassCard>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-[40px] shadow-2xl flex flex-col">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><Users size={24} /></div>
                  <div><h2 className="text-2xl font-display font-bold text-slate-900">{creatingStudent ? 'Add New Student' : `Edit: ${editingStudent.firstName} ${editingStudent.lastName}`}</h2><p className="text-sm text-slate-500 font-medium">Manage student information and status.</p></div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full"><X size={20} /></Button>
              </div>

              <div className="grow overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">First Name *</label>
                    <Input value={editingStudent.firstName} onChange={(e) => setEditingStudent({ ...editingStudent, firstName: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. Aarav" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Last Name *</label>
                    <Input value={editingStudent.lastName} onChange={(e) => setEditingStudent({ ...editingStudent, lastName: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. Patel" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email *</label>
                    <Input value={editingStudent.email} onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} type="email" className="h-12 rounded-xl border-slate-200" placeholder="student@example.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Phone</label>
                    <Input value={editingStudent.phone} onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="+1-555-0000" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Institution</label>
                    <Input value={editingStudent.institution} onChange={(e) => setEditingStudent({ ...editingStudent, institution: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. MIT" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Major</label>
                    <Input value={editingStudent.major} onChange={(e) => setEditingStudent({ ...editingStudent, major: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. Computer Science" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">GPA</label>
                    <Input value={editingStudent.gpa} onChange={(e) => setEditingStudent({ ...editingStudent, gpa: e.target.value })} className="h-12 rounded-xl border-slate-200" placeholder="e.g. 3.9" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Status</label>
                    <select aria-label="Student status" value={editingStudent.status} onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value as any })} className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-600 outline-none text-slate-700">
                      <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Pending">Pending</option>

                <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-6">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">Saved Resume</p>
                      <h3 className="text-lg font-display font-bold text-slate-900 mt-2">Resume snapshot for employer review</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${editingStudent.resumeData && Object.keys(editingStudent.resumeData).length > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {editingStudent.resumeData && Object.keys(editingStudent.resumeData).length > 0 ? "Available" : "Not saved yet"}
                    </span>
                  </div>

                  {editingStudent.resumeData && Object.keys(editingStudent.resumeData).length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-white border border-slate-200 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Headline</p>
                        <p className="text-sm font-semibold text-slate-900">{editingStudent.resumeData?.personalInfo?.title || editingStudent.major || "Resume ready"}</p>
                      </div>
                      <div className="rounded-2xl bg-white border border-slate-200 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Template</p>
                        <p className="text-sm font-semibold text-slate-900">{editingStudent.resumeData?.template || "modern"}</p>
                      </div>
                      <div className="rounded-2xl bg-white border border-slate-200 p-4 md:col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Summary</p>
                        <p className="text-sm text-slate-600 leading-7">
                          {editingStudent.resumeData?.personalInfo?.summary || "No summary saved in the resume data yet."}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white border border-slate-200 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Skills</p>
                        <p className="text-sm font-semibold text-slate-900">{(editingStudent.resumeData?.skills || []).length} skills saved</p>
                      </div>
                      <div className="rounded-2xl bg-white border border-slate-200 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Experience</p>
                        <p className="text-sm font-semibold text-slate-900">{(editingStudent.resumeData?.experience || []).length} roles saved</p>
                      </div>
                      <div className="rounded-2xl bg-white border border-slate-200 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Education</p>
                        <p className="text-sm font-semibold text-slate-900">{(editingStudent.resumeData?.education || []).length} entries saved</p>
                      </div>
                      <div className="rounded-2xl bg-white border border-slate-200 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Saved by builder</p>
                        <p className="text-sm font-semibold text-slate-900">{editingStudent.resumeData?.savedBy || editingStudent.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                      <p className="text-sm font-semibold text-slate-700">No resume data saved yet.</p>
                      <p className="mt-1 text-xs text-slate-500">Students must save from the resume builder before this becomes visible to employers.</p>
                    </div>
                  )}
                </div>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 flex items-center justify-end space-x-4 bg-slate-50/50">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl h-12 px-6">Cancel</Button>
                <Button onClick={handleSave} className="rounded-xl h-12 px-8 shadow-lg shadow-blue-100">{creatingStudent ? 'Add Student' : 'Save'}</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
