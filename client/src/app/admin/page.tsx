'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

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
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, ACTIVE, INACTIVE
    const [notifications, setNotifications] = useState<any[]>([]);
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
            await api.post('/payments', {
                tenantId: null,
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
            password: '', // Don't show password
            phone: tenant.phone,
            address: tenant.address,
            roomId: tenant.roomId,
            rentAmount: '' // Not in tenant model currently, maybe room rent?
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
                userId: selectedTenantIdForNotification, // This should be userId, but we might have tenantId.
                // We need to find the User ID from the Tenant ID.
                // In our tenants list, we have tenant.userId.
                // So we should pass tenant.user.id
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

    // Calculate Stats
    const totalIncome = payments.filter((p: any) => p.type === 'RENT' && p.status === 'VERIFIED').reduce((acc, curr: any) => acc + curr.amount, 0);
    const totalExpense = payments.filter((p: any) => p.type === 'EXPENSE').reduce((acc, curr: any) => acc + curr.amount, 0);
    const netProfit = totalIncome - totalExpense;

    if (isLoading || !user) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Welcome, <span className="font-medium text-gray-900">{user.name}</span></span>
                            <button onClick={logout} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                <div className="flex space-x-2 mb-8 bg-white p-1 rounded-lg shadow-sm">
                    <button
                        onClick={() => setActiveTab('tenants')}
                        className={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${activeTab === 'tenants'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-transparent text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Tenants
                    </button>
                    <button
                        onClick={() => setActiveTab('payments')}
                        className={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${activeTab === 'payments'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-transparent text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Payments & Expenses
                    </button>
                    <button
                        onClick={() => setActiveTab('complaints')}
                        className={`flex-1 px-6 py-3 rounded-md font-medium transition-all ${activeTab === 'complaints'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-transparent text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Complaints
                    </button>
                </div>

                <div className="bg-white shadow-md rounded-lg p-8">
                    {activeTab === 'tenants' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-medium">Tenant Management</h2>
                                <button
                                    onClick={() => {
                                        setEditingTenant(null);
                                        setNewTenant({ name: '', email: '', password: '', phone: '', address: '', roomId: '', rentAmount: '' });
                                        setIsAddTenantModalOpen(true);
                                    }}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                >
                                    Add Tenant
                                </button>
                            </div>

                            <div className="flex space-x-4 mb-4">
                                <input
                                    type="text"
                                    placeholder="Search by Name or Room"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border p-2 rounded w-1/3"
                                />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="border p-2 rounded"
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>

                            {(isAddTenantModalOpen || isEditTenantModalOpen) && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50">
                                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                                        <h3 className="text-2xl font-bold mb-6 text-gray-900">{isEditTenantModalOpen ? 'Edit Tenant' : 'Add New Tenant'}</h3>
                                        <form onSubmit={isEditTenantModalOpen ? handleUpdateTenant : handleAddTenant} className="space-y-4">
                                            <input type="text" placeholder="Name" value={newTenant.name} onChange={e => setNewTenant({ ...newTenant, name: e.target.value })} className="w-full border border-gray-300 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required />
                                            <input type="email" placeholder="Email" value={newTenant.email} onChange={e => setNewTenant({ ...newTenant, email: e.target.value })} className="w-full border border-gray-300 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100" required disabled={isEditTenantModalOpen} />
                                            {!isEditTenantModalOpen && <input type="password" placeholder="Password" value={newTenant.password} onChange={e => setNewTenant({ ...newTenant, password: e.target.value })} className="w-full border border-gray-300 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required />}
                                            <input type="text" placeholder="Phone" value={newTenant.phone} onChange={e => setNewTenant({ ...newTenant, phone: e.target.value })} className="w-full border border-gray-300 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required />
                                            <input type="text" placeholder="Address" value={newTenant.address} onChange={e => setNewTenant({ ...newTenant, address: e.target.value })} className="w-full border border-gray-300 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                                            <input type="text" placeholder="Room ID (Optional)" value={newTenant.roomId} onChange={e => setNewTenant({ ...newTenant, roomId: e.target.value })} className="w-full border border-gray-300 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                                            <div className="flex justify-end space-x-3 pt-4">
                                                <button type="button" onClick={() => { setIsAddTenantModalOpen(false); setIsEditTenantModalOpen(false); }} className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium">Cancel</button>
                                                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium shadow-sm">{isEditTenantModalOpen ? 'Update' : 'Add'}</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {isNotificationModalOpen && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50">
                                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                                        <h3 className="text-2xl font-bold mb-6 text-gray-900">Send Notification</h3>
                                        <form onSubmit={handleSendNotification} className="space-y-4">
                                            <textarea placeholder="Message" value={notificationMessage} onChange={e => setNotificationMessage(e.target.value)} className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[120px]" required />
                                            <div className="flex justify-end space-x-3 pt-4">
                                                <button type="button" onClick={() => setIsNotificationModalOpen(false)} className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium">Cancel</button>
                                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm">Send</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Room</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredTenants.map((tenant: any) => (
                                            <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tenant.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{tenant.user?.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{tenant.room?.number || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{tenant.phone}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {tenant.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                                    <button onClick={() => handleEditTenant(tenant)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                                                    <button onClick={() => {
                                                        setSelectedTenantIdForNotification(tenant.user?.id);
                                                        setIsNotificationModalOpen(true);
                                                    }} className="text-blue-600 hover:text-blue-900 font-medium">Notify</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
                                    <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2">Total Income</h3>
                                    <p className="text-3xl font-bold text-green-900">${totalIncome}</p>
                                </div>
                                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 shadow-sm">
                                    <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2">Total Expenses</h3>
                                    <p className="text-3xl font-bold text-red-900">${totalExpense}</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
                                    <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">Net Profit</h3>
                                    <p className="text-3xl font-bold text-blue-900">${netProfit}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
                                <button
                                    onClick={() => setIsAddExpenseModalOpen(true)}
                                    className="bg-red-600 text-white px-6 py-2.5 rounded-md hover:bg-red-700 transition-colors font-medium shadow-sm"
                                >
                                    + Add Expense
                                </button>
                            </div>

                            {isAddExpenseModalOpen && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50">
                                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                                        <h3 className="text-2xl font-bold mb-6 text-gray-900">Add Expense</h3>
                                        <form onSubmit={handleAddExpense} className="space-y-4">
                                            <input type="number" placeholder="Amount" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} className="w-full border border-gray-300 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" required />
                                            <input type="text" placeholder="Description / Month" value={newExpense.monthFor} onChange={e => setNewExpense({ ...newExpense, monthFor: e.target.value })} className="w-full border border-gray-300 px-4 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" required />
                                            <div className="flex justify-end space-x-3 pt-4">
                                                <button type="button" onClick={() => setIsAddExpenseModalOpen(false)} className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium">Cancel</button>
                                                <button type="submit" className="px-5 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium shadow-sm">Add</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {payments.map((payment: any) => (
                                            <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${payment.type === 'EXPENSE' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                        {payment.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.monthFor}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${payment.amount}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{payment.status}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {payment.status === 'PENDING' && payment.type !== 'EXPENSE' && (
                                                        <button onClick={() => handleVerifyPayment(payment.id)} className="text-indigo-600 hover:text-indigo-900 font-medium">Verify</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'complaints' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Complaints</h2>
                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tenant</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {complaints.map((complaint: any) => (
                                            <tr key={complaint.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{complaint.title}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{complaint.tenant?.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${complaint.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                                                        complaint.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                        {complaint.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(complaint.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        value={complaint.status}
                                                        onChange={(e) => handleUpdateComplaintStatus(complaint.id, e.target.value)}
                                                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                                    >
                                                        <option value="OPEN">Open</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="RESOLVED">Resolved</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
