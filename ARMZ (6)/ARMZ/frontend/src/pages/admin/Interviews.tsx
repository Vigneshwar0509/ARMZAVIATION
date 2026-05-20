import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, Clock, MapPin, CheckCircle, XCircle, AlertCircle, Search, Filter, Download, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { apiService } from "@/src/services/api";
import toast from "react-hot-toast";

interface Interview {
  id: string;
  studentName: string;
  studentEmail: string;
  companyName: string;
  jobTitle: string;
  interviewDate: string;
  interviewTime: string;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: string;
}

export default function AdminInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      setIsLoading(true);
      // This would be replaced with actual API call
      // const response = await apiService.getInterviews();
      // setInterviews(response.data);

      // Mock data for now
      const mockInterviews: Interview[] = [
        {
          id: "1",
          studentName: "John Doe",
          studentEmail: "john@example.com",
          companyName: "Air India",
          jobTitle: "Flight Attendant",
          interviewDate: "2024-05-15",
          interviewTime: "10:00 AM",
          location: "Mumbai Office",
          status: "scheduled",
          notes: "First round technical interview",
          createdAt: "2024-05-10T09:00:00Z"
        },
        {
          id: "2",
          studentName: "Jane Smith",
          studentEmail: "jane@example.com",
          companyName: "Indigo Airlines",
          jobTitle: "Pilot Trainee",
          interviewDate: "2024-05-12",
          interviewTime: "2:00 PM",
          location: "Delhi Office",
          status: "completed",
          notes: "Successful interview, waiting for offer",
          createdAt: "2024-05-08T14:00:00Z"
        }
      ];
      setInterviews(mockInterviews);
    } catch (error) {
      console.error("Failed to load interviews:", error);
      toast.error("Failed to load interviews");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = interview.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         interview.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         interview.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || interview.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'no_show': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'no_show': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleExportInterviews = () => {
    const csvData = [
      ['Student Name', 'Email', 'Company', 'Job Title', 'Date', 'Time', 'Location', 'Status', 'Notes'],
      ...filteredInterviews.map(interview => [
        interview.studentName,
        interview.studentEmail,
        interview.companyName,
        interview.jobTitle,
        formatDate(interview.interviewDate),
        interview.interviewTime,
        interview.location,
        interview.status,
        interview.notes || ''
      ])
    ];

    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `interviews-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Interviews exported successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Interview Management</h1>
          <p className="text-slate-500 mt-1">Track and manage student interview schedules</p>
        </div>
        <Button
          onClick={handleExportInterviews}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="glass-card p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Scheduled</p>
              <p className="text-2xl font-bold text-slate-900">
                {interviews.filter(i => i.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-slate-900">
                {interviews.filter(i => i.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">No Show</p>
              <p className="text-2xl font-bold text-slate-900">
                {interviews.filter(i => i.status === 'no_show').length}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 rounded-xl">
              <Users className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900">{interviews.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search interviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
      </motion.div>

      {/* Interviews Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl border border-slate-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Company</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Job Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Date & Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Location</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterviews.map((interview) => (
                <tr key={interview.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{interview.studentName}</p>
                      <p className="text-sm text-slate-500">{interview.studentEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{interview.companyName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-700">{interview.jobTitle}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{formatDate(interview.interviewDate)}</p>
                      <p className="text-sm text-slate-500">{interview.interviewTime}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-700">{interview.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(interview.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                        {interview.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedInterview(interview)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast.error("Edit functionality coming soon")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInterviews.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No interviews found matching your criteria.</p>
          </div>
        )}
      </motion.div>

      {/* Interview Details Modal */}
      {selectedInterview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedInterview(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Interview Details</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInterview(null)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Student</label>
                  <p className="font-semibold text-slate-900">{selectedInterview.studentName}</p>
                  <p className="text-sm text-slate-500">{selectedInterview.studentEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Company</label>
                  <p className="font-semibold text-slate-900">{selectedInterview.companyName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Job Title</label>
                  <p className="text-slate-900">{selectedInterview.jobTitle}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Status</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedInterview.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInterview.status)}`}>
                      {selectedInterview.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Date & Time</label>
                  <p className="text-slate-900">{formatDate(selectedInterview.interviewDate)} at {selectedInterview.interviewTime}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Location</label>
                  <p className="text-slate-900">{selectedInterview.location}</p>
                </div>
              </div>

              {selectedInterview.notes && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Notes</label>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedInterview.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}