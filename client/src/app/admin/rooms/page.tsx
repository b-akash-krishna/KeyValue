'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Home, Plus, Trash2, Edit2, Users, ArrowLeft } from 'lucide-react';

interface Room {
    id: string;
    number: string;
    capacity: number;
    currentOccupancy: number;
    rentAmount: number;
    tenants: { id: string; name: string }[];
}

export default function RoomManagement() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [stats, setStats] = useState({ totalRooms: 0, totalCapacity: 0, totalOccupied: 0 });

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);

    const [formData, setFormData] = useState({
        number: '',
        capacity: '',
        rentAmount: ''
    });

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'ADMIN')) {
            router.push('/login');
        } else if (user?.role === 'ADMIN') {
            fetchRooms();
        }
    }, [user, isLoading, router]);

    const fetchRooms = async () => {
        try {
            const res = await api.get('/rooms');
            setRooms(res.data);
            calculateStats(res.data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const calculateStats = (data: Room[]) => {
        const totalRooms = data.length;
        const totalCapacity = data.reduce((acc, room) => acc + room.capacity, 0);
        const totalOccupied = data.reduce((acc, room) => acc + room.currentOccupancy, 0);
        setStats({ totalRooms, totalCapacity, totalOccupied });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/rooms', formData);
            fetchRooms();
            setIsAddModalOpen(false);
            setFormData({ number: '', capacity: '', rentAmount: '' });
            alert('Room added successfully');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error adding room');
        }
    };

    const handleEditClick = (room: Room) => {
        setEditingRoom(room);
        setFormData({
            number: room.number,
            capacity: room.capacity.toString(),
            rentAmount: room.rentAmount.toString()
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!editingRoom) return;
            await api.put(`/rooms/${editingRoom.id}`, formData);
            fetchRooms();
            setIsEditModalOpen(false);
            setEditingRoom(null);
            alert('Room updated successfully');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error updating room');
        }
    };

    const handleDeleteRoom = async (id: string) => {
        if (!confirm('Are you sure you want to delete this room?')) return;
        try {
            await api.delete(`/rooms/${id}`);
            fetchRooms();
            alert('Room deleted successfully');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error deleting room');
        }
    };

    if (isLoading || !user) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.push('/admin')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg">
                                    <Home className="w-6 h-6 text-white" />
                                </div>
                                <h1 className="text-xl font-bold text-gray-900">Room Management</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Rooms</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalRooms}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Capacity</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalCapacity} <span className="text-sm text-gray-400 font-normal">beds</span></p>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Occupancy Rate</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {stats.totalCapacity > 0
                                        ? Math.round((stats.totalOccupied / stats.totalCapacity) * 100)
                                        : 0}%
                                </p>
                            </div>
                            <p className="text-sm text-gray-500">{stats.totalOccupied} / {stats.totalCapacity} occupied</p>
                        </div>
                    </div>
                </div>

                {/* Rooms List */}
                <div className="bg-white shadow-xl rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                        <h2 className="text-2xl font-bold text-gray-900">All Rooms</h2>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add New Room</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map((room) => (
                            <div key={room.id} className="bg-gray-50 rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                            Room {room.number}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">${room.rentAmount} / month</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${room.currentOccupancy >= room.capacity
                                            ? 'bg-red-100 text-red-700'
                                            : room.currentOccupancy > 0
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-green-100 text-green-700'
                                        }`}>
                                        {room.currentOccupancy >= room.capacity ? 'Full' : 'Available'}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Occupancy</span>
                                            <span>{room.currentOccupancy} / {room.capacity}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${room.currentOccupancy >= room.capacity ? 'bg-red-500' : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${(room.currentOccupancy / room.capacity) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-gray-200">
                                        <p className="text-xs font-semibold text-gray-500 mb-2">Tenants:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {room.tenants.length > 0 ? (
                                                room.tenants.map(tenant => (
                                                    <span key={tenant.id} className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-700">
                                                        <Users className="w-3 h-3 mr-1 text-gray-400" />
                                                        {tenant.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No tenants assigned</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-2 pt-2 mt-2">
                                        <button
                                            onClick={() => handleEditClick(room)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Edit Room"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRoom(room.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Room"
                                            disabled={room.currentOccupancy > 0}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {rooms.length === 0 && (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <Home className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No rooms found. Add your first room!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Room Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-t-xl">
                            <h3 className="text-xl font-bold text-white">Add New Room</h3>
                        </div>
                        <form onSubmit={handleAddRoom} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                                <input
                                    type="text"
                                    name="number"
                                    required
                                    value={formData.number}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 101"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Beds)</label>
                                <input
                                    type="number"
                                    name="capacity"
                                    required
                                    min="1"
                                    value={formData.capacity}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rent Amount per Month</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        name="rentAmount"
                                        required
                                        min="0"
                                        value={formData.rentAmount}
                                        onChange={handleInputChange}
                                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    Create Room
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Room Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-xl">
                            <h3 className="text-xl font-bold text-white">Edit Room</h3>
                        </div>
                        <form onSubmit={handleUpdateRoom} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                                <input
                                    type="text"
                                    name="number"
                                    required
                                    value={formData.number}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Beds)</label>
                                <input
                                    type="number"
                                    name="capacity"
                                    required
                                    min="1"
                                    value={formData.capacity}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Cannot be less than current occupancy ({editingRoom?.currentOccupancy})</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rent Amount per Month</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        name="rentAmount"
                                        required
                                        min="0"
                                        value={formData.rentAmount}
                                        onChange={handleInputChange}
                                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                                >
                                    Update Room
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
