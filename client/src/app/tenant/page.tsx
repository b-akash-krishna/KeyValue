'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function TenantDashboard() {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [payments, setPayments] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [notifications, setNotifications] = useState<any[]>([]);

    // Forms
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMonth, setPaymentMonth] = useState('');
    const [complaintTitle, setComplaintTitle] = useState('');
    const [complaintDesc, setComplaintDesc] = useState('');
    const [complaintCategory, setComplaintCategory] = useState('PLUMBING');

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
        } catch (error) {
            console.error(error);
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/payments', { amount: paymentAmount, monthFor: paymentMonth });
            setPaymentAmount('');
            setPaymentMonth('');
            fetchData();
            alert('Payment recorded successfully');
        } catch (error) {
            alert('Error recording payment');
        }
    };

    const handleComplaintSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/complaints', { title: complaintTitle, description: complaintDesc, category: complaintCategory });
            setComplaintTitle('');
            setComplaintDesc('');
            fetchData();
            alert('Complaint raised successfully');
        } catch (error) {
            alert('Error raising complaint');
        }
    };

    const handleIdProofUpload = () => {
        alert("ID Proof upload simulated. In production, this would upload to S3.");
    };

    if (isLoading || !user) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Tenant Dashboard</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Hello, <span className="font-medium text-gray-900">{user.name}</span></span>
                            <button onClick={logout} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                {/* Notifications Section */}
                {notifications.length > 0 && (
                    <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 p-5 rounded-r-lg shadow-sm">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3 flex-1">
                                <h3 className="text-base font-semibold text-yellow-800 mb-2">
                                    Notifications
                                </h3>
                                <div className="text-sm text-yellow-700 space-y-2">
                                    {notifications.map((notif: any) => (
                                        <div key={notif.id} className="flex items-start">
                                            <span className="flex-1">{notif.message}</span>
                                            <span className="text-xs text-yellow-600 ml-2 whitespace-nowrap">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Profile Card */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium mb-4">My Profile</h2>
                        <p><strong>Name:</strong> {profile?.name || user.name}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Phone:</strong> {profile?.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> {profile?.address || 'N/A'}</p>

                        <div className="mt-4 border-t pt-4">
                            <h3 className="font-medium text-gray-700">Room Details</h3>
                            {profile?.room ? (
                                <div className="mt-2">
                                    <p><strong>Room Number:</strong> {profile.room.number}</p>
                                    <p><strong>Rent Amount:</strong> {profile.room.rentAmount}</p>
                                </div>
                            ) : (
                                <p className="text-gray-500 mt-2">No room assigned yet.</p>
                            )}
                        </div>

                        <div className="mt-4 border-t pt-4">
                            <h3 className="font-medium text-gray-700">ID Proof</h3>
                            {profile?.idProofUrl ? (
                                <p className="text-green-600 mt-2">Uploaded</p>
                            ) : (
                                <button onClick={handleIdProofUpload} className="mt-2 text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100">
                                    Upload ID Proof
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Payment Form */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium mb-4">Record Payment</h2>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Amount</label>
                                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="mt-1 block w-full border p-2 rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Month For</label>
                                <input type="text" value={paymentMonth} onChange={e => setPaymentMonth(e.target.value)} className="mt-1 block w-full border p-2 rounded" placeholder="e.g. October 2023" required />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded">Submit Payment</button>
                        </form>
                    </div>

                    {/* Complaint Form */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium mb-4">Raise Complaint</h2>
                        <form onSubmit={handleComplaintSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input type="text" value={complaintTitle} onChange={e => setComplaintTitle(e.target.value)} className="mt-1 block w-full border p-2 rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <select value={complaintCategory} onChange={e => setComplaintCategory(e.target.value)} className="mt-1 block w-full border p-2 rounded">
                                    <option value="PLUMBING">Plumbing</option>
                                    <option value="ELECTRICAL">Electrical</option>
                                    <option value="WIFI">Wifi</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)} className="mt-1 block w-full border p-2 rounded" required />
                            </div>
                            <button type="submit" className="w-full bg-red-600 text-white py-2 rounded">Raise Complaint</button>
                        </form>
                    </div>

                    {/* History Lists */}
                    <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
                        <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-medium text-gray-500 mb-2">Payments</h3>
                                <ul className="divide-y divide-gray-200">
                                    {payments.map((p: any) => (
                                        <li key={p.id} className="py-2 flex justify-between">
                                            <span>{p.monthFor}</span>
                                            <span className={p.status === 'VERIFIED' ? 'text-green-600' : 'text-yellow-600'}>{p.status}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-500 mb-2">Complaints</h3>
                                <ul className="divide-y divide-gray-200">
                                    {complaints.map((c: any) => (
                                        <li key={c.id} className="py-2 flex justify-between">
                                            <span>{c.title}</span>
                                            <span className="text-sm text-gray-500">{c.status}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
