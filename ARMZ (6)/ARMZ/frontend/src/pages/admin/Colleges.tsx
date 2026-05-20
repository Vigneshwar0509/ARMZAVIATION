import React, { useState, useEffect } from "react";
import { Plus, School, MapPin, Users, Edit, Trash, Loader2, X } from "lucide-react";
import { apiService } from "@/src/services/api";
import toast from "react-hot-toast";

interface College {
  id: string;
  name: string;
  location: string;
  students: number;
  status: "Active" | "Pending" | "Inactive" | string;
}

export default function Colleges() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);

  const fetchColleges = async () => {
    try {
      const res = await apiService.getColleges();
      setColleges(res.data);
    } catch (error) {
      console.error("Fetch colleges error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      location: formData.get("location") as string,
      students: Number(formData.get("students")),
      status: formData.get("status") as any,
    };

    try {
      if (editingCollege) {
        await apiService.updateCollege(editingCollege.id, data);
        toast.success("College updated successfully!");
      } else {
        await apiService.createCollege(data);
        toast.success("College added successfully!");
      }
      setIsModalOpen(false);
      setEditingCollege(null);
      fetchColleges();
    } catch (error) {
      toast.error("Operation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this partner?")) return;
    try {
      await apiService.deleteCollege(id);
      toast.success("College removed successfully!");
      fetchColleges();
    } catch (error) {
      toast.error("Failed to delete college.");
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">College Management</h1>
          <p className="text-slate-500">Manage academic partnerships and campus drives.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCollege(null);
            setIsModalOpen(true);
          }}
          className="premium-button-primary px-8 py-3 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Partner</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : colleges.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <School className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No partner colleges found. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {colleges.map((college) => (
            <div key={college.id} className="glass-card p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
                  <School className="h-6 w-6" />
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  college.status === 'Active' ? 'bg-green-100/50 text-green-700' : 
                  college.status === 'Pending' ? 'bg-orange-100/50 text-orange-700' :
                  'bg-slate-100/50 text-slate-600'
                }`}>
                  {college.status}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900">{college.name}</h3>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-slate-500">
                  <MapPin className="h-4 w-4 mr-2" />
                  {college.location}
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <Users className="h-4 w-4 mr-2" />
                  {college.students} Students Enrolled
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-white/20">
                <button 
                  onClick={() => {
                    setEditingCollege(college);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 py-3 bg-white/40 border border-white/20 text-slate-600 rounded-xl font-bold text-xs hover:bg-white/60 transition-colors flex items-center justify-center"
                >
                  <Edit className="h-3 w-3 mr-2" /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(college.id)}
                  className="flex-1 py-3 bg-red-100/50 text-red-700 rounded-xl font-bold text-xs hover:bg-red-100/70 transition-colors flex items-center justify-center"
                >
                  <Trash className="h-3 w-3 mr-2" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-8 space-y-8 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {editingCollege ? "Edit Partner" : "Add New Partner"}
              </h2>
              <p className="text-slate-500">Enter the details of the partner college.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">College Name</label>
                <input 
                  name="name"
                  defaultValue={editingCollege?.name}
                  required
                  className="w-full h-14 px-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-600 outline-none"
                  placeholder="e.g. Delhi Technological University"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</label>
                  <input 
                    name="location"
                    defaultValue={editingCollege?.location}
                    required
                    className="w-full h-14 px-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-600 outline-none"
                    placeholder="e.g. New Delhi"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Students</label>
                  <input 
                    name="students"
                    type="number"
                    defaultValue={editingCollege?.students}
                    required
                    className="w-full h-14 px-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-600 outline-none"
                    placeholder="e.g. 1200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="college-status" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</label>
                <select 
                  id="college-status"
                  name="status"
                  defaultValue={editingCollege?.status || "Active"}
                  className="w-full h-14 px-6 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-600 outline-none appearance-none"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span>{editingCollege ? "Save Changes" : "Add Partner"}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
