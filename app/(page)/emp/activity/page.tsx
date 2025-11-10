// app/employee/activities/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, QrCode, Download, Eye, Edit, Trash2, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CreateActivityDialog from '../../../components/activity/CreateActivityDialog';
import GenerateQRDialog from '../../../components/activity/GenerateQRDialog';

interface Activity {
  id: string;
  name: string;
  description: string | null;
  group: 'CENTRAL' | 'FACULTY' | 'FREE'; // เปลี่ยนจาก type เป็น group
  hours: number;
  startDate: Date | null; // เปลี่ยนจาก date เป็น startDate
  endDate: Date | null;
  location: string | null;
  organizer: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  _count: {
    activityHistories: number;
    qrCodes: number;
  };
  qrCodesUsed: number;
  qrCodesUnused: number;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

const activityTypeLabels = {
  CENTRAL: 'ส่วนกลาง',
  FACULTY: 'คณะ', 
  FREE: 'เสรี' // เปลี่ยนจาก OPTIONAL เป็น FREE
};

const statusLabels = {
  ACTIVE: 'เปิด',
  INACTIVE: 'ปิด',
  CANCELLED: 'ยกเลิก'
};

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // โหลดข้อมูลกิจกรรม
  // ใน loadActivities
const loadActivities = async () => {
  try {
    setLoading(true);
    const response = await fetch('/api/activities');
    
    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }
    
    const data = await response.json();
    
    // ตรวจสอบว่า data เป็น array
    if (Array.isArray(data)) {
      setActivities(data);
    } else {
      console.error('Expected array but got:', data);
      setActivities([]);
    }
  } catch (error) {
    console.error('Error loading activities:', error);
    setActivities([]); // ตั้งค่าเป็น array ว่างถ้า error
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadActivities();
  }, []);

  // กรองข้อมูล
  // ใน component
const filteredActivities = Array.isArray(activities) 
  ? activities.filter(activity => {
      const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.createdBy.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.createdBy.lastName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || activity.group === typeFilter; // เปลี่ยนจาก type เป็น group
      const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    })
  : [];

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    loadActivities();
  };

  const handleGenerateQR = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowQRDialog(true);
  };

  const handleQRGenerated = () => {
    setShowQRDialog(false);
    setSelectedActivity(null);
    loadActivities();
  };

  const handleViewDetails = (activityId: string) => {
    router.push(`/employee/activities/${activityId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการกิจกรรม</h1>
          <p className="text-gray-600">สร้างและจัดการกิจกรรมสำหรับนักศึกษา</p>
        </div>
        
        <div className="flex gap-3">
          {/* ปุ่มสร้างกิจกรรม */}
          <button
            onClick={() => router.push('/employee/activities/create')}
            className="flex items-center gap-2 bg-primary-600 text-black px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Calendar className="w-5 h-5" />
            สร้างกิจกรรม
          </button>
          
          {/* ปุ่มเพิ่มกิจกรรม (แบบ Dialog) */}
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            เพิ่มกิจกรรม
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ค้นหากิจกรรม..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">ทุกประเภท</option>
            <option value="CENTRAL">ส่วนกลาง</option>
            <option value="FACULTY">คณะ</option>
            <option value="OPTIONAL">เสรี</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="ACTIVE">เปิด</option>
            <option value="INACTIVE">ปิด</option>
            <option value="CANCELLED">ยกเลิก</option>
          </select>

          {/* Reset Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('all');
              setStatusFilter('all');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ล้างตัวกรอง
          </button>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อกิจกรรม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชั่วโมง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้เข้าร่วม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Codes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {activity.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {activity.location || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {activityTypeLabels[activity.group]}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {activity.hours} ชม.
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {activity.startDate ? new Date(activity.startDate).toLocaleDateString('th-TH') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[activity.status]}`}>
                        {statusLabels[activity.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {activity._count.activityHistories} คน
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {activity._count.qrCodes} ตัว
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="text-green-600">ใช้: {activity.qrCodesUsed}</span>
                          {' | '}
                          <span className="text-blue-600">เหลือ: {activity.qrCodesUnused}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerateQR(activity)}
                          className="p-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded"
                          title="สร้าง QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(activity.id)}
                          className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredActivities.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">ไม่พบข้อมูลกิจกรรม</p>
          </div>
        )}
      </div>

      {/* Create Activity Dialog */}
      <CreateActivityDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Generate QR Dialog */}
      {selectedActivity && (
        <GenerateQRDialog
          open={showQRDialog}
          onClose={() => {
            setShowQRDialog(false);
            setSelectedActivity(null);
          }}
          onSuccess={handleQRGenerated}
          activity={selectedActivity}
        />
      )}
    </div>
  );
}