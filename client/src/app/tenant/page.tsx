'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Home, DollarSign, AlertCircle, LogOut, Bell, Upload, CheckCircle, Clock, FileText, User, Phone, Mail, MapPin, Calendar } from 'lucide-react';

export default function TenantDashboard() {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [payments, setPayments] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [notifications, setNotifications] = useState<any[]>([]);

    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMonth, setPaymentMonth] = useState('');
    const [monthlyBalance, setMonthlyBalance] = useState<any>(null);
    const [complaintTitle, setComplaintTitle] = useState('');
    const [complaintDesc, setComplaintDesc] = useState('');
    const [complaintCategory, setComplaintCategory] = useState('PLUMBING');

    // Detail Modal States
    const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [newComment, setNewComment] = useState('');
    const [complaintPhoto, setComplaintPhoto] = useState<File | null>(null);
    const [paymentFile, setPaymentFile] = useState<File | null>(null);

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'TENANT')) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user?.role === 'TENANT') {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const profileRes = await api.get('/tenants/me');
            setProfile(profileRes.data);

            const paymentsRes = await api.get('/payments');
            setPayments(paymentsRes.data);

            const complaintsRes = await api.get('/complaints');
            setComplaints(complaintsRes.data);

            const notificationsRes = await api.get('/notifications');
            setNotifications(notificationsRes.data);

            // Fetch monthly balance if month is selected
            if (paymentMonth && profileRes.data?.id) {
                fetchMonthlyBalance(profileRes.data.id, paymentMonth);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMonthlyBalance = async (tenantId: string, monthFor: string) => {
        try {
            const res = await api.get(`/payments/balance/${tenantId}/${monthFor}`);
            setMonthlyBalance(res.data);
        } catch (error) {
            console.error('Error fetching balance:', error);
            setMonthlyBalance(null);
        }
    };

    // Fetch balance when month changes
    useEffect(() => {
        if (profile?.id && paymentMonth) {
            fetchMonthlyBalance(profile.id, paymentMonth);
        }
    }, [paymentMonth, profile]);

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // 1. Create Payment Record
            const res = await api.post('/payments', {
                amount: paymentAmount,
                monthFor: paymentMonth
            });

            const paymentId = res.data.id;

            // 2. Upload Proof if file selected
            if (paymentFile) {
                const formData = new FormData();
                formData.append('proof', paymentFile);

                await api.post(`/payments/${paymentId}/proof`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setPaymentAmount('');
            setPaymentMonth('');
            setPaymentFile(null);
            fetchData();
            alert('Payment recorded successfully');
        } catch (error) {
            console.error(error);
            alert('Error recording payment');
        }
    };

    const handleComplaintSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', complaintTitle);
        formData.append('description', complaintDesc);
        formData.append('category', complaintCategory);
        if (complaintPhoto) {
            formData.append('photo', complaintPhoto);
        }

        try {
            await api.post('/complaints', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setComplaintTitle('');
            setComplaintDesc('');
            setComplaintCategory('PLUMBING');
            setComplaintPhoto(null);
            fetchData();
            alert('Complaint raised successfully');
        } catch (error) {
            console.error(error);
            alert('Error raising complaint');
        }
    };

    const handleIdProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile?.id) return;

        const formData = new FormData();
        formData.append('idProof', file);

        try {
            await api.post(`/tenants/${profile.id}/id-proof`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchData();
            alert('ID Proof uploaded successfully');
        } catch (error) {
            console.error(error);
            alert('Error uploading ID Proof');
        }
    };

    const handleViewComplaint = (complaint: any) => {
        setSelectedComplaint(complaint);
    };

    const handleViewPayment = (payment: any) => {
        setSelectedPayment(payment);
    };

    const handleAddComment = async () => {
        if (!selectedComplaint || !newComment.trim()) return;
        try {
            const res = await api.post(`/complaints/${selectedComplaint.id}/comments`, { text: newComment });
            // Update local state
            setSelectedComplaint((prev: any) => ({
                ...prev,
                comments: [...(prev.comments || []), res.data]
            }));
            setNewComment('');
            fetchData(); // Refresh in background
        } catch (error) {
            console.error(error);
            alert('Error adding comment');
        }
    };

    if (isLoading || !user) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    const pendingPayments = payments.filter((p: any) => p.status === 'PENDING').length;
    const verifiedPayments = payments.filter((p: any) => p.status === 'VERIFIED').length;
    const openComplaints = complaints.filter((c: any) => c.status === 'OPEN').length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Enhanced Navigation */}
            <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg">
                                <Home className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Tenant Dashboard</h1>
                                <p className="text-xs text-gray-500">Manage your stay</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:block text-right">
                                <span className="text-sm text-gray-600">Welcome,</span>
                                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Notifications Banner */}
                {notifications.length > 0 && (
                    <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-r-lg shadow-md p-6 animate-pulse-slow">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <Bell className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="text-lg font-bold text-yellow-900 mb-3">
                                    Important Notifications ({notifications.length})
                                </h3>
                                <div className="space-y-3">
                                    {notifications.map((notif: any) => (
                                        <div key={notif.id} className="flex items-start bg-white rounded-lg p-3 shadow-sm">
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-800">{notif.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(notif.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Verified Payments</p>
                                <p className="text-3xl font-bold text-green-600">{verifiedPayments}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Pending Payments</p>
                                <p className="text-3xl font-bold text-yellow-600">{pendingPayments}</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Open Complaints</p>
                                <p className="text-3xl font-bold text-red-600">{openComplaints}</p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-full">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-8 text-center">
                                <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4 shadow-lg">
                                    <User className="w-12 h-12 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">{profile?.name || user.name}</h2>
                                <p className="text-blue-100 text-sm mt-1">Tenant</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex items-start space-x-3">
                                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
                                        <p className="text-sm text-gray-900 truncate">{user.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1">Phone</p>
                                        <p className="text-sm text-gray-900">{profile?.phone || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1">Address</p>
                                        <p className="text-sm text-gray-900">{profile?.address || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4 mt-4">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <Home className="w-4 h-4 mr-2" />
                                        Room Details
                                    </h3>
                                    {profile?.room ? (
                                        <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Room Number</span>
                                                <span className="text-sm font-semibold text-gray-900">{profile.room.number}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Monthly Rent</span>
                                                <span className="text-sm font-semibold text-green-600">${profile.room.rentAmount}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">No room assigned yet</p>
                                    )}
                                </div>

                                <div className="border-t pt-4 mt-4">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        ID Proof
                                    </h3>
                                    {profile?.idProofUrl ? (
                                        <div className={`flex items-center space-x-2 rounded-lg p-3 ${profile.idProofStatus === 'VERIFIED' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                                            {profile.idProofStatus === 'VERIFIED' ? (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <Clock className="w-5 h-5 text-yellow-600" />
                                            )}
                                            <div className="flex-1">
                                                <a href={`http://localhost:5000/${profile.idProofUrl}`} target="_blank" rel="noopener noreferrer" className={`text-sm font-medium hover:underline ${profile.idProofStatus === 'VERIFIED' ? 'text-green-700' : 'text-yellow-700'}`}>
                                                    {profile.idProofStatus === 'VERIFIED' ? 'Verified' : 'Pending Verification'} (View)
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                type="file"
                                                id="id-proof-upload"
                                                accept="image/*,application/pdf"
                                                className="hidden"
                                                onChange={handleIdProofUpload}
                                            />
                                            <label
                                                htmlFor="id-proof-upload"
                                                className="w-full flex items-center justify-center space-x-2 bg-blue-50 text-blue-600 px-4 py-3 rounded-lg hover:bg-blue-100 transition-colors font-medium cursor-pointer"
                                            >
                                                <Upload className="w-4 h-4" />
                                                <span>Upload ID Proof</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions & History */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Payment Form */}
                        <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
                            </div>

                            {/* Rent Information */}
                            {profile?.room && (
                                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-blue-900">Monthly Rent:</span>
                                        <span className="text-lg font-bold text-blue-600">${profile.room.rentAmount}</span>
                                    </div>
                                </div>
                            )}

                            {/* Monthly Balance Display */}
                            {monthlyBalance && (
                                <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg">
                                    <h3 className="text-sm font-bold text-orange-900 mb-2">Balance for {monthlyBalance.monthFor}</h3>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-700">Total Rent:</span>
                                            <span className="font-semibold">${monthlyBalance.totalRent}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-700">Paid:</span>
                                            <span className="font-semibold text-green-600">${monthlyBalance.totalPaid}</span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-2 border-t border-orange-200">
                                            <span className="text-gray-900 font-bold">Remaining:</span>
                                            <span className={`font-bold ${monthlyBalance.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                ${monthlyBalance.balance}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                            <input
                                                type="number"
                                                value={paymentAmount}
                                                onChange={e => setPaymentAmount(e.target.value)}
                                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Month For</label>
                                        <select
                                            value={paymentMonth}
                                            onChange={e => setPaymentMonth(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                                            required
                                        >
                                            <option value="">Select Month</option>
                                            {Array.from({ length: 12 }, (_, i) => {
                                                const date = new Date();
                                                date.setMonth(date.getMonth() - i);
                                                const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                                return <option key={i} value={monthYear}>{monthYear}</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Proof (Screenshot)</label>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 text-sm"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-md hover:shadow-lg"
                                >
                                    Submit Payment
                                </button>
                            </form>
                        </div>

                        {/* Complaint Form */}
                        <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="bg-red-100 p-2 rounded-lg">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Raise Complaint</h2>
                            </div>
                            <form onSubmit={handleComplaintSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={complaintTitle}
                                        onChange={e => setComplaintTitle(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
                                        placeholder="Brief description of issue"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                    <select
                                        value={complaintCategory}
                                        onChange={e => setComplaintCategory(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 cursor-pointer"
                                    >
                                        <option value="PLUMBING">Plumbing</option>
                                        <option value="ELECTRICAL">Electrical</option>
                                        <option value="WIFI">WiFi</option>
                                        <option value="CLEANING">Cleaning</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={complaintDesc}
                                        onChange={e => setComplaintDesc(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 min-h-[100px]"
                                        placeholder="Provide detailed information about the issue"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Photo (Optional)</label>
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => setComplaintPhoto(e.target.files?.[0] || null)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg hover:from-red-700 hover:to-pink-700 transition-all font-semibold shadow-md hover:shadow-lg"
                                >
                                    Raise Complaint
                                </button>
                            </form>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Payments History */}
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                                        Payment History
                                    </h3>
                                    <div className="space-y-3">
                                        {payments.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No payments yet</p>
                                        ) : (
                                            payments.slice(0, 5).map((p: any) => (
                                                <div key={p.id} onClick={() => handleViewPayment(p)} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">{p.monthFor}</p>
                                                        <p className="text-xs text-gray-500">${p.amount}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                                                        p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {p.status}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Complaints History */}
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                                        <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                                        My Complaints
                                    </h3>
                                    <div className="space-y-3">
                                        {complaints.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No complaints yet</p>
                                        ) : (
                                            complaints.slice(0, 5).map((c: any) => (
                                                <div key={c.id} onClick={() => handleViewComplaint(c)} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                                                        <p className="text-xs text-gray-500">{c.category}</p>
                                                    </div>
                                                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${c.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                                                        c.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {c.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Complaint Detail Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all flex flex-col max-h-[90vh]">
                        <div className="bg-gradient-to-r from-red-600 to-pink-600 px-6 py-5 rounded-t-2xl flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Complaint Details</h3>
                                <p className="text-red-100 text-sm">#{selectedComplaint.id.slice(0, 8)}</p>
                            </div>
                            <button onClick={() => setSelectedComplaint(null)} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
                                <LogOut className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium uppercase">Title</p>
                                        <p className="text-lg font-bold text-gray-900">{selectedComplaint.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium uppercase">Category</p>
                                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">{selectedComplaint.category}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium uppercase">Status</p>
                                        <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${selectedComplaint.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                                            selectedComplaint.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {selectedComplaint.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium uppercase">Submitted</p>
                                        <p className="text-sm text-gray-900">{new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <p className="text-sm text-gray-500 font-medium uppercase mb-2">Description</p>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700">
                                    {selectedComplaint.description}
                                </div>
                            </div>

                            {selectedComplaint.photoUrl && (
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-2">Attached Photo</p>
                                    <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                        <img
                                            src={`http://localhost:5000/${selectedComplaint.photoUrl}`}
                                            alt="Complaint Photo"
                                            className="w-full h-auto max-h-96 object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-200 pt-6">
                                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-red-600" />
                                    Comments & Updates
                                </h4>

                                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                                    {!selectedComplaint.comments || selectedComplaint.comments.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No comments yet.</p>
                                    ) : (
                                        selectedComplaint.comments.map((comment: any) => (
                                            <div key={comment.id} className={`p-3 rounded-lg ${comment.user?.role === 'ADMIN' ? 'bg-indigo-50 ml-8 border border-indigo-100' : 'bg-gray-50 mr-8 border border-gray-200'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-xs font-bold ${comment.user?.role === 'ADMIN' ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                        {comment.user?.role === 'ADMIN' ? 'Admin' : 'You'}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-gray-800">{comment.text}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add a comment or update..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddComment();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Detail Modal */}
            {selectedPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 rounded-t-2xl flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Payment Details</h3>
                                <p className="text-green-100 text-sm">{selectedPayment.monthFor}</p>
                            </div>
                            <button onClick={() => setSelectedPayment(null)} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
                                <LogOut className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-600 font-medium mb-1">Amount Paid</p>
                                    <p className="text-2xl font-bold text-blue-900">${selectedPayment.amount}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <p className="text-sm text-purple-600 font-medium mb-1">Status</p>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${selectedPayment.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                                        selectedPayment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {selectedPayment.status}
                                    </span>
                                </div>
                            </div>

                            {selectedPayment.totalRent && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Total Rent</span>
                                        <span className="text-sm font-semibold text-gray-900">${selectedPayment.totalRent}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Paid</span>
                                        <span className="text-sm font-semibold text-green-600">${selectedPayment.amount}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                                        <span className="text-sm font-bold text-gray-900">Balance</span>
                                        <span className={`text-sm font-bold ${selectedPayment.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            ${selectedPayment.balance || 0}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-2">Payment Date</p>
                                <p className="text-sm text-gray-900">{new Date(selectedPayment.date).toLocaleString()}</p>
                            </div>

                            {selectedPayment.proofUrl && (
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-2">Payment Proof</p>
                                    <div className="rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                            src={`http://localhost:5000/${selectedPayment.proofUrl}`}
                                            alt="Payment Proof"
                                            className="w-full h-auto max-h-64 object-contain bg-gray-100"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}