import React, { useState, useEffect, useMemo } from "react";
import jsPDF from "jspdf";
import { DollarSign, Download, Search, Filter, Loader2, TrendingUp, FileText, CreditCard, Plus, Trash2, Edit2, Eye, Check, X } from "lucide-react";
import { apiService } from "@/src/services/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  amount: number;
  amountFormatted: string;
  currency: string;
  paymentMethod: string;
  status: string;
  transactionDate: string;
  orderId: string;
  paymentId: string | null;
  createdAt: string;
}

interface PaymentSummary {
  totalRevenue: number;
  totalRevenueFormatted: string;
  activeSubscriptions: number;
  pendingPayments: number;
  pendingAmount: number;
  pendingAmountFormatted: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'credit_card' | 'debit_card' | 'upi' | 'netbanking';
  lastDigits: string;
  expiryDate?: string;
  isDefault: boolean;
  addedDate: string;
}

interface PaymentMethodForm {
  id?: string;
  name: string;
  type: PaymentMethod['type'];
  lastDigits: string;
  expiryDate?: string;
}

export default function Payments() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed">("all");
  const [activeTab, setActiveTab] = useState<"transactions" | "methods">("transactions");
  const [showNewMethodModal, setShowNewMethodModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  const normalizeSearchValue = (value: unknown) => String(value ?? "").toLowerCase();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const [paymentsRes, methodsRes] = await Promise.all([
        apiService.getAdminPayments(),
        apiService.getPaymentMethods(),
      ]);
      setTransactions(paymentsRes.data.transactions);
      setSummary(paymentsRes.data.summary);
      setPaymentMethods(methodsRes.data);
      toast.success('Payment data refreshed', { id: 'payment-data-refreshed' });
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  // Invoice PDF Download
  const downloadInvoice = (txn: Transaction) => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'A4' });
      const margin = 40;
      let y = 50;

      doc.setFontSize(18);
      doc.text('FLIGHTDECK PAYMENT INVOICE', margin, y);
      y += 30;
      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.line(margin, y, 555, y);
      y += 30;

      const rows = [
        ['Invoice Date', new Date().toLocaleDateString('en-IN')],
        ['Transaction ID', txn.id],
        ['Order ID', txn.orderId],
        ['Customer', txn.userName],
        ['Email', txn.userEmail],
        ['Plan', txn.planName],
        ['Amount', txn.amountFormatted],
        ['Currency', txn.currency],
        ['Payment Method', txn.paymentMethod],
        ['Status', txn.status],
        ['Transaction Date', txn.transactionDate],
        ['Payment ID', txn.paymentId || 'N/A'],
      ];

      doc.setFontSize(11);
      rows.forEach(([label, value]) => {
        doc.text(`${label}:`, margin, y);
        doc.text(`${value}`, margin + 160, y);
        y += 22;
      });

      y += 10;
      doc.setFontSize(12);
      doc.text('Thank you for your subscription!', margin, y);
      y += 20;
      doc.setFontSize(10);
      doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, margin, y);
      doc.save(`invoice-${txn.id}.pdf`);
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download invoice');
      console.error('Invoice PDF error:', error);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Transaction ID", "Student", "Email", "Plan", "Amount", "Status", "Date"],
      ...filteredTransactions.map(t => [
        t.id,
        t.userName,
        t.userEmail,
        t.planName,
        t.amountFormatted,
        t.status,
        t.transactionDate
      ])
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success("Payment data exported successfully!");
  };

  // Payment Method Management
  const [methodForm, setMethodForm] = useState<PaymentMethodForm>({
    name: '',
    type: 'credit_card',
    lastDigits: '',
    expiryDate: ''
  });

  const openPaymentMethodModal = (method?: PaymentMethod) => {
    setEditingMethod(method ?? null);
    setMethodForm({
      id: method?.id,
      name: method?.name ?? '',
      type: method?.type ?? 'credit_card',
      lastDigits: method?.lastDigits ?? '',
      expiryDate: method?.expiryDate ?? ''
    });
    setShowNewMethodModal(true);
  };

  const closePaymentMethodModal = () => {
    setEditingMethod(null);
    setMethodForm({
      name: '',
      type: 'credit_card',
      lastDigits: '',
      expiryDate: ''
    });
    setShowNewMethodModal(false);
  };

  const handleSavePaymentMethod = async () => {
    if (!methodForm.name || !methodForm.lastDigits) {
      toast.error('Please provide a name and card details.');
      return;
    }

    try {
      if (editingMethod) {
        await apiService.updatePaymentMethod(editingMethod.id, {
          name: methodForm.name,
          type: methodForm.type,
          lastDigits: methodForm.lastDigits,
          expiryDate: methodForm.expiryDate,
          is_default: editingMethod.isDefault,
        });
        toast.success('Payment method updated successfully');
      } else {
        await apiService.createPaymentMethod({
          name: methodForm.name,
          type: methodForm.type,
          lastDigits: methodForm.lastDigits,
          expiryDate: methodForm.expiryDate,
          is_default: paymentMethods.length === 0,
        });
        toast.success('New payment method added');
      }

      closePaymentMethodModal();
      await fetchPayments();
    } catch (error) {
      console.error('Failed to save payment method:', error);
      toast.error('Failed to save payment method');
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await apiService.deletePaymentMethod(id);
      toast.success('Payment method removed');
      await fetchPayments();
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiService.updatePaymentMethod(id, { is_default: true });
      toast.success('Default payment method updated');
      await fetchPayments();
    } catch (error) {
      console.error('Failed to update default payment method:', error);
      toast.error('Failed to update default payment method');
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const normalizedSearchTerm = normalizeSearchValue(searchTerm);
      const matchesSearch =
        normalizeSearchValue(t.userName).includes(normalizedSearchTerm) ||
        normalizeSearchValue(t.userEmail).includes(normalizedSearchTerm) ||
        normalizeSearchValue(t.id).includes(normalizedSearchTerm);

      const matchesStatus = filterStatus === "all" || normalizeSearchValue(t.status) === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchTerm, filterStatus]);

  if (loading) {
    return (
      <div className="p-8 space-y-8 min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  const revenueGrowth = "+12.5%";
  const avgTransactionValue = summary ? Math.round(summary.totalRevenue / summary.activeSubscriptions) : 0;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscription & Payments</h1>
          <p className="text-slate-500">Monitor revenue, billing methods, and transaction history.</p>
        </div>
        <button 
          onClick={handleExport}
          className="h-12 px-6 bg-white/50 border border-white/20 rounded-xl flex items-center space-x-2 text-slate-600 hover:bg-white/70 backdrop-blur-sm transition-all"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 space-y-4"
        >
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Revenue</p>
            <span className="text-xs font-bold text-green-500">{revenueGrowth}</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{summary?.totalRevenueFormatted}</p>
          <p className="text-xs text-slate-400">From {summary?.activeSubscriptions} active subscriptions</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 space-y-4"
        >
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Subscriptions</p>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-indigo-600">{summary?.activeSubscriptions}</p>
          <p className="text-xs text-slate-400">Recurring revenue streams</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 space-y-4"
        >
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Payments</p>
            <span className="text-xs font-bold text-orange-500">{summary?.pendingPayments}</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">{summary?.pendingAmountFormatted}</p>
          <p className="text-xs text-slate-400">{summary?.pendingPayments} failed transactions</p>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-6 py-3 font-bold transition-all border-b-2 ${
            activeTab === "transactions"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Transactions
          </div>
        </button>
        <button
          onClick={() => setActiveTab("methods")}
          className={`px-6 py-3 font-bold transition-all border-b-2 ${
            activeTab === "methods"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </div>
        </button>
      </div>

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <>
          {/* Filters */}
          <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 text-sm"
            />
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <Filter className="h-5 w-5 text-slate-400" />
              <select
                aria-label="Filter transactions by status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-transparent outline-none text-slate-900 text-sm"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white/30 border-b border-white/10">
                  <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Transaction ID</th>
                  <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Student</th>
                  <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Plan</th>
                  <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                  <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Date</th>
                  <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Status</th>
                  <th className="px-4 sm:px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((txn) => (
                    <motion.tr 
                      key={txn.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-white/20 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">{txn.id}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-slate-900">{txn.userName}</p>
                          <p className="text-xs text-slate-400">{txn.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-slate-900 font-semibold whitespace-nowrap">{txn.planName}</td>
                      <td className="px-4 sm:px-6 py-4 text-slate-900 font-bold whitespace-nowrap">{txn.amountFormatted}</td>
                      <td className="px-4 sm:px-6 py-4 text-slate-500 text-xs whitespace-nowrap">{txn.transactionDate}</td>
                      <td className="px-4 sm:px-6 py-4 text-center whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          txn.status === 'Success' 
                            ? 'bg-green-100/50 text-green-700 border border-green-200/50' 
                            : 'bg-red-100/50 text-red-700 border border-red-200/50'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => downloadInvoice(txn)}
                          className="text-purple-600 hover:text-purple-700 font-semibold text-xs flex items-center gap-1 ml-auto"
                          title="Download invoice"
                        >
                          <FileText className="h-3 w-3" />
                          Invoice
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-slate-400">No transactions found matching your criteria</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            <div className="glass-card p-6 text-center">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Success Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {summary ? Math.round((summary.activeSubscriptions / transactions.length) * 100) : 0}%
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Avg Transaction</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                ₹{avgTransactionValue.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Transactions</p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{transactions.length}</p>
            </div>
          </div>
        </>
      )}

      {/* Payment Methods Tab */}
      {activeTab === "methods" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">Saved Payment Methods</h3>
            <button
              onClick={() => openPaymentMethodModal()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-bold text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Method
            </button>
          </div>

          <div className="grid gap-4">
            {paymentMethods.length > 0 ? (
              paymentMethods.map((method, idx) => (
                <motion.div
                  key={method.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card p-6 border border-slate-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <CreditCard className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{method.name}</p>
                          <p className="text-sm text-slate-600">
                            {method.type === 'credit_card' && '💳 Credit Card'} 
                            {method.type === 'debit_card' && '💳 Debit Card'} 
                            {method.type === 'upi' && '📱 UPI'} 
                            {method.type === 'netbanking' && '🏦 Net Banking'}
                            {' •••• '}
                            <span className="font-mono">{method.lastDigits}</span>
                          </p>
                          {method.expiryDate && <p className="text-xs text-slate-400">Expires: {method.expiryDate}</p>}
                          <p className="text-xs text-slate-400 mt-1">Added: {new Date(method.addedDate).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.isDefault ? (
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          <Check className="h-3 w-3" />
                          Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(method.id)}
                          className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-full text-xs font-bold transition-all"
                          title="Set as default"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => openPaymentMethodModal(method)}
                        className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                        title="Edit payment method"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete payment method"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="glass-card p-12 text-center">
                <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-semibold mb-4">No payment methods saved</p>
                <button
                  onClick={() => openPaymentMethodModal()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-bold"
                >
                  Add Payment Method
                </button>
              </div>
            )}
          </div>

          {/* Payment Method Info */}
          <div className="glass-card p-6 bg-blue-50 border border-blue-200">
            <p className="font-semibold text-slate-900 mb-2">💡 Payment Method Security</p>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>✓ All payment methods are encrypted and securely stored</li>
              <li>✓ Your card details are never shared with third parties</li>
              <li>✓ You can delete payment methods anytime</li>
              <li>✓ Set a default method for faster transactions</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
