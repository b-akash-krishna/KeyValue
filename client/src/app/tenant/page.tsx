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
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-800">Tenant Dashboard</h1>
                        </div>
                        <div className="flex items-center">
                            <span className="mr-4 text-gray-600">Hello, {user.name}</span>
                            <button onClick={logout} className="text-red-600 hover:text-red-800">Logout</button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">

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
    );
}
