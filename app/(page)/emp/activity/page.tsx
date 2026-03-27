// app/employee/activities/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, QrCode, Eye, Edit, Trash2, Calendar, Power, PowerOff, RefreshCw, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CreateActivityDialog from '../../../components/activity/CreateActivityDialog';
import GenerateQRDialog from '../../../components/activity/GenerateQRDialog';
import QRCodeViewerDialog from '../../../components/activity/QRCodeViewerDialog';

interface Activity {
  id: string;
  name: string;
  description: string | null;
  group: 'CENTRAL' | 'FACULTY' | 'FREE';
  hours: number;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  organizer: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  createdById: number | null;
  createdBy: {
    id: number;
    name: string;
    email?: string;
    role?: string;
  } | null;
  _count: {
    activityHistories: number;
    qrCodes: number;
  };
  qrCodes?: Array<{
    id: string;
    isActive: boolean;
    code: string;
    isUsed: boolean;
    currentUses: number;
    maxUses: number;
    type: string;
  }>;
  qrCodesUsed: number;
  qrCodesUnused: number;
  qrCodesActive: number;
  qrCodesInactive: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const activityTypeLabels = {
  CENTRAL: 'ส่วนกลาง',
  FACULTY: 'คณะ',
  FREE: 'เสรี',
};

const activityTypeColors = {
  CENTRAL: 'bg-blue-100 text-blue-800',
  FACULTY: 'bg-purple-100 text-purple-800',
  FREE: 'bg-orange-100 text-orange-800',
};

const statusLabels = {
  ACTIVE: 'เปิด',
  INACTIVE: 'ปิด',
  CANCELLED: 'ยกเลิก',
};

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showQRViewer, setShowQRViewer] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [viewingQRData, setViewingQRData] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [qrToggleLoading, setQrToggleLoading] = useState<string | null>(null);

  // ดึงข้อมูล user ปัจจุบัน
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data.user.id);
          setCurrentUserRole(data.user.role);
          console.log('Current user loaded:', {
            id: data.user.id,
            role: data.user.role,
            name: data.user.name
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/activities?includeQRCodes=true');
      if (!response.ok) throw new Error('Failed to fetch');
      const data: Activity[] = await response.json(); // แก้ไข type annotation
      console.log('Loaded activities with details:', data.map((act: Activity) => ({ // เพิ่ม type annotation
        id: act.id,
        name: act.name,
        createdById: act.createdById,
        createdBy: act.createdBy,
        qrCodes: act.qrCodes?.length || 0
      })));
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshActivities = async () => {
    try {
      setRefreshing(true);
      await loadActivities();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  // กรองข้อมูล
  const filteredActivities = Array.isArray(activities)
    ? activities.filter((activity) => {
        const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || activity.group === typeFilter;
        const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      })
    : [];

  // ตรวจสอบว่าเป็นเจ้าของกิจกรรมหรือ ADMIN
  const canEditDelete = (activity: Activity) => {
    // ADMIN สามารถทำได้ทุกอย่าง
    if (currentUserRole === 'ADMIN') {
      return true;
    }
    
    // ถ้าเป็นคนสร้างกิจกรรม
    if (activity.createdById && currentUserId && activity.createdById === currentUserId) {
      return true;
    }
    
    // ถ้ามี createdBy object
    if (activity.createdBy && currentUserId && activity.createdBy.id === currentUserId) {
      return true;
    }
    
    return false;
  };

  // ตรวจสอบว่ามี QR Code แล้วหรือยัง
  const hasQRCode = (activity: Activity) => {
    return activity._count && activity._count.qrCodes > 0;
  };

  // ตรวจสอบสถานะ QR Code
  const getQRStatus = (activity: Activity) => {
    if (activity.qrCodes && activity.qrCodes.length > 0) {
      return activity.qrCodes[0].isActive;
    }
    return false;
  };

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

  // ดู QR Code
  const handleViewQR = async (activity: Activity) => {
    try {
      const res = await fetch(`/api/activities/${activity.id}/qrcode`);
      if (!res.ok) throw new Error('ไม่พบ QR Code');
      const data = await res.json();

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      setViewingQRData({
        ...data.qrCode,
        url: `${baseUrl}/scan/${data.qrCode.code}`,
      });
      setSelectedActivity(activity);
      setShowQRViewer(true);
    } catch (error) {
      console.error('Error fetching QR code:', error);
      alert('ไม่พบ QR Code ของกิจกรรมนี้');
    }
  };

  // แก้ไขกิจกรรม
  const handleEdit = (activity: Activity) => {
    router.push(`/employee/activities/${activity.id}/edit`);
  };

  // Toggle QR Code Status
  const handleToggleQRStatus = async (activity: Activity) => {
    if (!activity.qrCodes || activity.qrCodes.length === 0) {
      alert('ไม่พบ QR Code สำหรับกิจกรรมนี้');
      return;
    }

    try {
      setQrToggleLoading(activity.id);
      const qrCode = activity.qrCodes[0];
      const newStatus = !qrCode.isActive;

      console.log(`Toggling QR status for activity ${activity.id} to ${newStatus}`);

      const res = await fetch(`/api/activities/${activity.id}/qrcode/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: newStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'อัพเดทสถานะไม่สำเร็จ');
      }

      const result = await res.json();
      console.log('Toggle result:', result);

      // อัพเดทข้อมูลใน state
      setActivities(prev => 
        prev.map(act => 
          act.id === activity.id 
            ? {
                ...act,
                qrCodes: act.qrCodes?.map(qr => ({
                  ...qr,
                  isActive: newStatus
                }))
              }
            : act
        )
      );

      // แสดงข้อความสำเร็จ
      const message = `QR Code ${newStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}สำเร็จ`;
      console.log(message);
      
      // อัพเดท UI โดยไม่ต้องแสดง alert
    } catch (error: any) {
      console.error('Toggle QR error:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setQrToggleLoading(null);
    }
  };

  // ลบกิจกรรม
  const handleDelete = async (activityId: string) => {
    try {
      setDeleteLoading(activityId);
      const res = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'ลบไม่สำเร็จ');
      }
      
      alert('ลบกิจกรรมสำเร็จ');
      setDeleteConfirm(null);
      loadActivities();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  // ยกเลิกการลบ
  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  // ตรวจสอบว่ากิจกรรมสามารถลบได้หรือไม่
  const canDelete = (activity: Activity) => {
    return !activity._count || activity._count.activityHistories === 0;
  };

  // ดาวน์โหลดรายงาน PDF
  const handleDownloadReport = async () => {
    try {
      setReportLoading(true);
      
      const response = await fetch('/api/activities/report', {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ไม่สามารถสร้างรายงานได้');
      }
      
      // ดาวน์โหลดไฟล์ PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `activities_report_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('PDF report downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading report:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <button
            onClick={refreshActivities}
            disabled={refreshing}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
          
          {/* ปุ่มรายงาน PDF */}
          <button
            onClick={handleDownloadReport}
            disabled={reportLoading || !['ADMIN', 'EMPLOYEE'].includes(currentUserRole)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={!['ADMIN', 'EMPLOYEE'].includes(currentUserRole) ? 'ไม่มีสิทธิ์ในการดาวน์โหลดรายงาน' : ''}
          >
            <FileText className="w-5 h-5" />
            {reportLoading ? 'กำลังสร้าง...' : 'รายงานสรุป'}
          </button>
          
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            เพิ่มกิจกรรม
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{activities.length}</div>
          <div className="text-sm text-gray-600">กิจกรรมทั้งหมด</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {activities.filter(a => a.status === 'ACTIVE').length}
          </div>
          <div className="text-sm text-gray-600">กิจกรรมที่เปิด</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {activities.reduce((sum, a) => sum + (a._count?.qrCodes || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">QR Code ทั้งหมด</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {activities.reduce((sum, a) => sum + (a._count?.activityHistories || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">การสแกนทั้งหมด</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ค้นหากิจกรรม..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">ทุกประเภท</option>
            <option value="CENTRAL">ส่วนกลาง</option>
            <option value="FACULTY">คณะ</option>
            <option value="FREE">เสรี</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="ACTIVE">เปิด</option>
            <option value="INACTIVE">ปิด</option>
            <option value="CANCELLED">ยกเลิก</option>
          </select>
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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
                    ผู้สแกน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActivities.map((activity) => {
                  const userCanEdit = canEditDelete(activity);
                  const qrActive = getQRStatus(activity);
                  
                  return (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{activity.name}</div>
                          {activity.location && (
                            <div className="text-sm text-gray-500">{activity.location}</div>
                          )}
                          {activity.createdBy && (
                            <div className="text-xs text-blue-600">
                              สร้างโดย: {activity.createdBy.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${activityTypeColors[activity.group]}`}>
                          {activityTypeLabels[activity.group]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activity.hours} ชม.
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{formatDate(activity.startDate)}</div>
                        {activity.endDate && activity.startDate !== activity.endDate && (
                          <div className="text-xs text-gray-500">ถึง {formatDate(activity.endDate)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[activity.status]}`}>
                          {statusLabels[activity.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-center">
                          <div className="font-medium">{activity._count?.activityHistories || 0}</div>
                          <div className="text-xs text-gray-500">คน</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {hasQRCode(activity) ? (
                            <>
                              <button
                                onClick={() => handleViewQR(activity)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                              >
                                <QrCode className="w-4 h-4" />
                                ดู QR
                              </button>
                              
                              {/* QR Status Toggle Switch */}
                              {userCanEdit && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleQRStatus(activity)}
                                    disabled={qrToggleLoading === activity.id}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                      qrActive ? 'bg-green-600' : 'bg-gray-200'
                                    } ${qrToggleLoading === activity.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={`คลิกเพื่อ${qrActive ? 'ปิด' : 'เปิด'} QR Code`}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                        qrActive ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                  <span className={`text-xs font-medium ${qrActive ? 'text-green-600' : 'text-gray-500'}`}>
                                    {qrToggleLoading === activity.id ? 'กำลังอัพเดท...' : (qrActive ? 'เปิด' : 'ปิด')}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            userCanEdit && (
                              <button
                                onClick={() => handleGenerateQR(activity)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                              >
                                <Plus className="w-4 h-4" />
                                สร้าง QR
                              </button>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {userCanEdit ? (
                            <>
                              {/* ปุ่มแก้ไข */}
                              <button
                                onClick={() => handleEdit(activity)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                title="แก้ไข"
                              >
                                <Edit className="w-4 h-4" />
                                แก้ไข
                              </button>

                              {/* ปุ่มลบ */}
                              {deleteConfirm === activity.id ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleDelete(activity.id)}
                                    disabled={deleteLoading === activity.id}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {deleteLoading === activity.id ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    ) : (
                                      'ยืนยัน'
                                    )}
                                  </button>
                                  <button
                                    onClick={handleCancelDelete}
                                    disabled={deleteLoading === activity.id}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                                  >
                                    ยกเลิก
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (!canDelete(activity)) {
                                      alert('ไม่สามารถลบกิจกรรมที่มีผู้เข้าร่วมแล้วได้');
                                      return;
                                    }
                                    setDeleteConfirm(activity.id);
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    canDelete(activity)
                                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                  }`}
                                  title={canDelete(activity) ? 'ลบ' : 'ไม่สามารถลบได้ เนื่องจากมีผู้เข้าร่วมแล้ว'}
                                  disabled={!canDelete(activity)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  ลบ
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-400 px-3 py-1.5">ไม่มีสิทธิ์</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Calendar className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีกิจกรรม</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'ไม่พบกิจกรรมที่ตรงกับเงื่อนไขการค้นหา'
                : 'เริ่มต้นโดยการสร้างกิจกรรมแรกของคุณ'
              }
            </p>
            {(!searchTerm && typeFilter === 'all' && statusFilter === 'all') && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  เพิ่มกิจกรรม
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateActivityDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateSuccess}
      />

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

      {selectedActivity && (
        <QRCodeViewerDialog
          open={showQRViewer}
          onClose={() => {
            setShowQRViewer(false);
            setSelectedActivity(null);
            setViewingQRData(null);
          }}
          activityName={selectedActivity.name}
          qrCodeData={viewingQRData}
        />
      )}
    </div>
  );
}