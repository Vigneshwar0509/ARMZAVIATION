import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Search, Filter, Phone, Mail, Calendar, ChevronDown,
  TrendingUp, UserPlus, CheckCircle2, Clock, XCircle, 
  MoreHorizontal, Eye, Edit2, Trash2, Download, RefreshCw
} from 'lucide-react';
import { useLeadStore, Lead, LeadStatus, getSourceLabel, getStatusColor } from '@/src/store/leadStore';
import { apiService } from '@/src/services/api';
import toast from 'react-hot-toast';

const formatMetadataLabel = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatMetadataValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

export default function AdminLeads() {
  const { leads, fetchLeads, updateLeadStatus, isLoading } = useLeadStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.interest || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.message || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    await updateLeadStatus(leadId, newStatus);
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Interest', 'Message', 'Source', 'Status', 'Created At'].join(','),
      ...filteredLeads.map(lead => 
        [
          lead.name,
          lead.email,
          lead.phone,
          lead.interest,
          (lead.message || '').replace(/\n/g, ' '),
          getSourceLabel(lead.source),
          lead.status,
          lead.createdAt,
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Leads exported successfully!');
  };

  const statusOptions: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'lost'];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Lead Management</h1>
          <p className="text-slate-500 mt-1">Track and manage all incoming leads</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchLeads()}
            title="Refresh leads"
            aria-label="Refresh leads"
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            className="px-5 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium text-slate-700"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Leads', value: stats.total, icon: Users, color: 'from-slate-500 to-slate-600' },
          { label: 'New', value: stats.new, icon: UserPlus, color: 'from-blue-500 to-cyan-500' },
          { label: 'Contacted', value: stats.contacted, icon: Phone, color: 'from-amber-500 to-orange-500' },
          { label: 'Qualified', value: stats.qualified, icon: CheckCircle2, color: 'from-purple-500 to-pink-500' },
          { label: 'Converted', value: stats.converted, icon: TrendingUp, color: 'from-green-500 to-emerald-500' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>
        <select
          aria-label="Filter leads by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-700"
        >
          <option value="all">All Status</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
          ))}
        </select>
        <select
          aria-label="Filter leads by source"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-700"
        >
          <option value="all">All Sources</option>
          <option value="job_apply">Job Application</option>
          <option value="contact_form">Contact Form</option>
          <option value="program_interest">Program Interest</option>
          <option value="course_enroll">Course Enrollment</option>
          <option value="newsletter">Newsletter</option>
          <option value="enquiry">General Enquiry</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Lead</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Contact</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Interest</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Source</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Created</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead, idx) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                        {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{lead.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {lead.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {lead.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="text-sm text-slate-700">{lead.interest}</span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                      {getSourceLabel(lead.source)}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <select
                      aria-label="Change lead status"
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border-0 cursor-pointer ${getStatusColor(lead.status)}`}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowDetailModal(true);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-slate-500" />
                      </button>
                      <a
                        href={`mailto:${lead.email}`}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Send Email"
                      >
                        <Mail className="h-4 w-4 text-blue-500" />
                      </a>
                      <a
                        href={`tel:${lead.phone}`}
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                        title="Call"
                      >
                        <Phone className="h-4 w-4 text-green-500" />
                      </a>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No leads found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Lead Detail Modal */}
      {showDetailModal && selectedLead && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card w-full max-w-lg p-8 rounded-4xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                {selectedLead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedLead.name}</h2>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(selectedLead.status)}`}>
                  {selectedLead.status.charAt(0).toUpperCase() + selectedLead.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Mail className="h-5 w-5 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Email</div>
                  <div className="font-medium text-slate-900">{selectedLead.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Phone className="h-5 w-5 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Phone</div>
                  <div className="font-medium text-slate-900">{selectedLead.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Calendar className="h-5 w-5 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Submitted</div>
                  <div className="font-medium text-slate-900">
                    {new Date(selectedLead.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <TrendingUp className="h-5 w-5 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Subject / Interest</div>
                  <div className="font-medium text-slate-900">{selectedLead.interest || '-'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Users className="h-5 w-5 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Source</div>
                  <div className="font-medium text-slate-900">{getSourceLabel(selectedLead.source)}</div>
                </div>
              </div>
              {selectedLead.message && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">Message</div>
                  <div className="text-sm text-slate-700">{selectedLead.message}</div>
                </div>
              )}
              {selectedLead.metadata && Object.keys(selectedLead.metadata).length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 mb-3">Submitted Details</div>
                  <div className="space-y-3">
                    {Object.entries(selectedLead.metadata).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-[120px_1fr] gap-3 text-sm">
                        <div className="text-slate-500">{formatMetadataLabel(key)}</div>
                        <div className="text-slate-800 break-words">{formatMetadataValue(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <a
                href={`mailto:${selectedLead.email}`}
                className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-center"
              >
                Send Email
              </a>
              <a
                href={`tel:${selectedLead.phone}`}
                className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors text-center"
              >
                Call Now
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
