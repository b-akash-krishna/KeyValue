'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Users, DollarSign, AlertCircle, LogOut, Search, Filter, Plus, TrendingUp, TrendingDown } from 'lucide-react';

export default function AdminDashboard() {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('tenants');
    const [tenants, setTenants] = useState<any[]>([]);
    const [payments, setPayments] = useState([]);
    const [complaints, setComplaints] = useState([]);

    const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
    const [newTenant, setNewTenant] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        roomId: '',
        rentAmount: ''
    });

    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [isEditTenantModalOpen, setIsEditTenantModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [selectedTenantIdForNotification, setSelectedTenantIdForNotification] = useState('');

    const [newExpense, setNewExpense] = useState({
        amount: '',
        monthFor: '',
        description: ''
    });

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'ADMIN')) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            fetchData();
        }
    }, [user, activeTab]);

    const fetchData = async () => {
        try {
            if (activeTab === 'tenants') {
                const res = await api.get('/tenants');
                setTenants(res.data);
            } else if (activeTab === 'payments') {
                const res = await api.get('/payments');
                setPayments(res.data);
            } else if (activeTab === 'complaints') {
                const res = await api.get('/complaints');
                setComplaints(res.data);
            }
        } catch (error) {
            console.error('Error fetching data', error);
        }
    };

    const handleAddTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/tenants', newTenant);
            setIsAddTenantModalOpen(false);
            setNewTenant({ name: '', email: '', password: '', phone: '', address: '', roomId: '', rentAmount: '' });
            fetchData();
            alert('Tenant added successfully');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error adding tenant');
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (tenants.length === 0) {
                const res = await api.get('/tenants');
                if (res.data.length === 0) {
                    alert("Need at least one tenant to record expense (MVP limitation)");
                    return;
                }
                setTenants(res.data);
            }
            const dummyTenantId = tenants[0]?.id;

            await api.post('/payments', {
                tenantId: dummyTenantId,
                amount: newExpense.amount,
                monthFor: newExpense.monthFor,
                type: 'EXPENSE',
                status: 'VERIFIED'
            });
            setIsAddExpenseModalOpen(false);
            setNewExpense({ amount: '', monthFor: '', description: '' });
            fetchData();
            alert('Expense added successfully');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error adding expense');
        }
    };

    const handleVerifyPayment = async (id: string) => {
        try {
            await api.put(`/payments/${id}/verify`, { status: 'VERIFIED' });
            fetchData();
        } catch (error) {
            alert('Error verifying payment');
        }
    };

    const handleUpdateComplaintStatus = async (id: string, status: string) => {
        try {
            await api.put(`/complaints/${id}/status`, { status });
            fetchData();
        } catch (error) {
            alert('Error updating complaint status');
        }
    };

    const handleEditTenant = (tenant: any) => {
        setEditingTenant(tenant);
        setNewTenant({
            name: tenant.name,
            email: tenant.user.email,
            password: '',
            phone: tenant.phone,
            address: tenant.address,
            roomId: tenant.roomId,
            rentAmount: ''
        });
        setIsEditTenantModalOpen(true);
    };

    const handleUpdateTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!editingTenant) return;
            await api.put(`/tenants/${editingTenant.id}`, {
                name: newTenant.name,
                phone: newTenant.phone,
                address: newTenant.address,
                roomId: newTenant.roomId
            });
            setIsEditTenantModalOpen(false);
            setEditingTenant(null);
            fetchData();
            alert('Tenant updated successfully');
        } catch (error) {
            alert('Error updating tenant');
        }
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/notifications', {
                userId: selectedTenantIdForNotification,
                message: notificationMessage
            });
            setIsNotificationModalOpen(false);
            setNotificationMessage('');
            alert('Notification sent successfully');
        } catch (error) {
            alert('Error sending notification');
        }
    };

    const filteredTenants = tenants.filter((tenant: any) => {
        const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tenant.room?.number?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' ||
            (filterStatus === 'ACTIVE' && tenant.isActive) ||
            (filterStatus === 'INACTIVE' && !tenant.isActive);
        return matchesSearch && matchesStatus;
    });

    const totalIncome = payments.filter((p: any) => p.type === 'RENT' && p.status === 'VERIFIED').reduce((acc, curr: any) => acc + curr.amount, 0);
    const totalExpense = payments.filter((p: any) => p.type === 'EXPENSE').reduce((acc, curr: any) => acc + curr.amount, 0);
    const netProfit = totalIncome - totalExpense;
    const pendingPayments = payments.filter((p: any) => p.status === 'PENDING').length;
    const openComplaints = complaints.filter((c: any) => c.status === 'OPEN').length;

    if (isLoading || !user) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Enhanced Navigation */}
            <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                                <p className="text-xs text-gray-500">Manage your PG operations</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:block text-right">
                                <span className="text-sm text-gray-600">Welcome back,</span>
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
                {/* Stats Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Total Tenants</p>
                                <p className="text-3xl font-bold text-gray-900">{tenants.length}</p>
                            </div>
                            <div className="bg-indigo-100 p-3 rounded-full">
                                <Users className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Total Income</p>
                                <p className="text-3xl font-bold text-green-600">${totalIncome}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Pending Payments</p>
                                <p className="text-3xl font-bold text-orange-600">{pendingPayments}</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-full">
                                <DollarSign className="w-6 h-6 text-orange-600" />
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

                {/* Enhanced Tab Navigation */}
                <div className="bg-white rounded-xl shadow-md mb-6 p-2">
                    <div className="flex space-x-2">
                        {[
                            { id: 'tenants', label: 'Tenant Management', icon: Users },
                            { id: 'payments', label: 'Payments & Expenses', icon: DollarSign },
                            { id: 'complaints', label: 'Complaints', icon: AlertCircle }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                                        : 'bg-transparent text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white shadow-xl rounded-xl p-6">
                    {activeTab === 'tenants' && (
                        <div>
                            {/* Header with Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                                <h2 className="text-2xl font-bold text-gray-900">Tenant Management</h2>
                                <button
                                    onClick={() => {
                                        setEditingTenant(null);
                                        setNewTenant({ name: '', email: '', password: '', phone: '', address: '', roomId: '', rentAmount: '' });
                                        setIsAddTenantModalOpen(true);
                                    }}
                                    className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Add Tenant</span>
                                </button>
                            </div>

                            {/* Search and Filter */}
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or room..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                                    />
                                </div>
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 appearance-none cursor-pointer min-w-[150px]"
                                    >
                                        <option value="ALL">All Status</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* Tenants Table */}
                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Title</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tenant</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {complaints.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                                    <p className="text-lg font-medium">No complaints yet</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            complaints.map((complaint: any) => (
                                                <tr key={complaint.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{complaint.title}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{complaint.tenant?.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                                                            {complaint.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${complaint.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                                                                complaint.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-green-100 text-green-800'
                                                            }`}>
                                                            {complaint.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {new Date(complaint.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <select
                                                            value={complaint.status}
                                                            onChange={(e) => handleUpdateComplaintStatus(complaint.id, e.target.value)}
                                                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white cursor-pointer"
                                                        >
                                                            <option value="OPEN">Open</option>
                                                            <option value="IN_PROGRESS">In Progress</option>
                                                            <option value="RESOLVED">Resolved</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {(isAddTenantModalOpen || isEditTenantModalOpen) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 rounded-t-2xl">
                            <h3 className="text-2xl font-bold text-white">
                                {isEditTenantModalOpen ? 'Edit Tenant' : 'Add New Tenant'}
                            </h3>
                        </div>
                        <form onSubmit={isEditTenantModalOpen ? handleUpdateTenant : handleAddTenant} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={newTenant.name}
                                    onChange={e => setNewTenant({ ...newTenant, name: e.target.value })}
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    value={newTenant.email}
                                    onChange={e => setNewTenant({ ...newTenant, email: e.target.value })}
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                                    required
                                    disabled={isEditTenantModalOpen}
                                />
                            </div>
                            {!isEditTenantModalOpen && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={newTenant.password}
                                        onChange={e => setNewTenant({ ...newTenant, password: e.target.value })}
                                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                                        required
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    placeholder="+1 (555) 000-0000"
                                    value={newTenant.phone}
                                    onChange={e => setNewTenant({ ...newTenant, phone: e.target.value })}
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                <input
                                    type="text"
                                    placeholder="123 Main St"
                                    value={newTenant.address}
                                    onChange={e => setNewTenant({ ...newTenant, address: e.target.value })}
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Room ID (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="Room 101"
                                    value={newTenant.roomId}
                                    onChange={e => setNewTenant({ ...newTenant, roomId: e.target.value })}
                                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddTenantModalOpen(false);
                                        setIsEditTenantModalOpen(false);
                                    }}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-md"
                                >
                                    {isEditTenantModalOpen ? 'Update' : 'Add Tenant'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAddExpenseModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="bg-gradient-to-r from-red-600 to-pink-600 px-6 py-5 rounded-t-2xl">
                            <h3 className="text-2xl font-bold text-white">Add Expense</h3>
                        </div>
                        <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description / Month</label>
                                <input
                                    type="text"
                                    placeholder="e.g. December 2024 - Plumbing"
                                    value={newExpense.monthFor}
                                    onChange={e => setNewExpense({ ...newExpense, monthFor: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddExpenseModalOpen(false)}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all font-medium shadow-md"
                                >
                                    Add Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isNotificationModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-5 rounded-t-2xl">
                            <h3 className="text-2xl font-bold text-white">Send Notification</h3>
                        </div>
                        <form onSubmit={handleSendNotification} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                <textarea
                                    placeholder="Enter your notification message..."
                                    value={notificationMessage}
                                    onChange={e => setNotificationMessage(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] bg-gray-50"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsNotificationModalOpen(false)}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-md"
                                >
                                    Send Notification
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}