'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Camera, Check, AlertCircle, X, RotateCcw, User, Clock, Shield, Scan } from 'lucide-react';

interface ScanResult {
  success: boolean;
  activity?: {
    id: number;
    name: string;
    group: string;
    hours: number;
    organizer?: string;
  };
  message: string;
  error?: string;
}

const activityTypeLabels = {
  CENTRAL: 'ส่วนกลาง',
  FACULTY: 'คณะ',
  FREE: 'เสรี',
};

const activityTypeColors = {
  CENTRAL: 'bg-blue-100 text-blue-800 border-blue-200',
  FACULTY: 'bg-purple-100 text-purple-800 border-purple-200',
  FREE: 'bg-orange-100 text-orange-800 border-orange-200',
};

type CameraStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'requesting'
  | 'granted'
  | 'scanning'
  | 'denied'
  | 'not_found'
  | 'not_supported'
  | 'error';

// ─── Denied Guide Dialog ──────────────────────────────────────────────────────
function DeniedGuideDialog({
  open,
  onClose,
  onRetry,
}: {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-red-500 to-rose-600 px-6 pt-6 pb-5 text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-white text-lg font-bold">ถูกปฏิเสธการใช้กล้อง</h2>
            <p className="text-red-100 text-xs mt-1">กรุณาเปิดสิทธิ์ตามขั้นตอนด้านล่าง</p>
          </div>

          {/* Steps */}
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-3">
              {[
                { os: '📱 iOS Safari', steps: ['การตั้งค่า → Safari → กล้อง', 'เลือก "อนุญาต"'] },
                { os: '🤖 Android Chrome', steps: ['แตะ 🔒 ในแถบ URL', 'สิทธิ์ → กล้อง → อนุญาต'] },
                { os: '💻 Desktop Chrome', steps: ['คลิก 🔒 ในแถบที่อยู่', 'เปิดสิทธิ์กล้อง → รีเฟรช'] },
              ].map(({ os, steps }) => (
                <div key={os} className="bg-gray-50 rounded-2xl p-3">
                  <p className="text-sm font-semibold text-gray-700 mb-1">{os}</p>
                  {steps.map((s, i) => (
                    <p key={i} className="text-xs text-gray-500">
                      {i + 1}. {s}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={onRetry}
                className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                ลองใหม่อีกครั้ง
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 py-3 rounded-2xl font-medium text-sm transition-all"
              >
                รีเฟรชหน้าเว็บ
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(40px) scale(0.95) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<any>(null);
  const QrScannerClassRef = useRef<any>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);

  // dialog states
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showDeniedDialog, setShowDeniedDialog] = useState(false);

  // ── โหลด library ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const mod = await import('qr-scanner');
        QrScannerClassRef.current = mod.default;

        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraStatus('not_supported');
          setErrorMessage('เบราว์เซอร์ไม่รองรับการเข้าถึงกล้อง กรุณาใช้ Chrome, Safari หรือ Firefox');
          return;
        }

        const hasCamera = await mod.default.hasCamera();
        if (!hasCamera) {
          setCameraStatus('not_found');
          setErrorMessage('ไม่พบกล้องในอุปกรณ์ของคุณ');
          return;
        }

        // ตรวจสอบว่า permission ถูก block ไปก่อนแล้วหรือไม่
        if ('permissions' in navigator) {
          try {
            const perm = await navigator.permissions.query({ name: 'camera' as PermissionName });
            console.log('[Scanner] existing camera permission:', perm.state);
            if (perm.state === 'denied') {
              setCameraStatus('denied');
              setShowDeniedDialog(true);
              return;
            }
          } catch {
            // permissions API ไม่รองรับบางเบราว์เซอร์ — ข้ามได้
          }
        }

        setCameraStatus('ready');
      } catch {
        setCameraStatus('not_supported');
        setErrorMessage('ไม่สามารถโหลด QR Scanner ได้');
      }
    })();
  }, []);

  // ── โหลด user ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setUser(data.user))
      .catch(() => {});
  }, []);

  // ── cleanup ───────────────────────────────────────────────────────────────
  const stopScanner = useCallback(() => {
    if (qrScannerRef.current) {
      try { qrScannerRef.current.stop(); qrScannerRef.current.destroy(); } catch {}
      qrScannerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopScanner(), [stopScanner]);

  // ── ผล scan ───────────────────────────────────────────────────────────────
  const handleScanResult = useCallback(async (qrCode: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    stopScanner();
    setCameraStatus('granted');

    try {
      const res = await fetch('/api/student/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode }),
      });
      const data = await res.json();

      if (res.ok) {
        setScanResult({ success: true, activity: data.activity, message: data.message || 'สแกนสำเร็จ!' });
        if (data.activity) {
          setUser((prev: any) => {
            if (!prev) return prev;
            const next = { ...prev };
            if (data.activity.group === 'CENTRAL') next.centralHours = (next.centralHours || 0) + data.activity.hours;
            else if (data.activity.group === 'FACULTY') next.facultyHours = (next.facultyHours || 0) + data.activity.hours;
            else if (data.activity.group === 'FREE') next.freeHours = (next.freeHours || 0) + data.activity.hours;
            next.totalHours = (next.centralHours || 0) + (next.facultyHours || 0) + (next.freeHours || 0);
            return next;
          });
        }
      } else {
        setScanResult({ success: false, message: data.error || 'เกิดข้อผิดพลาดในการสแกน' });
      }
    } catch {
      setScanResult({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, stopScanner]);

  // ── เปิดกล้องจริง (หลังจาก dialog confirmed) ─────────────────────────────
  const doStartScanner = useCallback(async () => {
    const QrScannerClass = QrScannerClassRef.current;
    const videoEl = videoRef.current;

    console.log('[Scanner] doStartScanner called', { QrScannerClass: !!QrScannerClass, videoEl: !!videoEl });

    if (!QrScannerClass) {
      console.error('[Scanner] QrScanner library not loaded');
      setCameraStatus('error');
      setErrorMessage('QR Scanner ยังไม่พร้อม กรุณารีเฟรชหน้าเว็บ');
      return;
    }
    if (!videoEl) {
      console.error('[Scanner] video element not found');
      setCameraStatus('error');
      setErrorMessage('ไม่พบ video element กรุณารีเฟรชหน้าเว็บ');
      return;
    }

    setCameraStatus('requesting');
    setErrorMessage('');

    try {
      // ให้ QrScanner จัดการ permission เอง — ไม่ getUserMedia ก่อน
      // (การ getUserMedia แล้ว stop แล้วเปิดใหม่ทำให้ Chrome บางเวอร์ชัน block request ที่สอง)
      console.log('[Scanner] starting QrScanner directly...');
      const scanner = new QrScannerClass(
        videoEl,
        (result: any) => handleScanResult(result.data),
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 5,
          returnDetailedScanResult: true,
        }
      );

      await scanner.start();
      qrScannerRef.current = scanner;
      setCameraStatus('scanning');
      console.log('[Scanner] scanner started successfully');

    } catch (err: any) {
      // QrScanner บางครั้ง throw string แทน Error object
      console.error('[Scanner] raw error:', err);
      const errStr = typeof err === 'string' ? err : (err?.message ?? String(err));
      const errName = err?.name ?? '';
      console.error('[Scanner] errName:', errName, 'errStr:', errStr);

      stopScanner();

      // ตรวจสอบทั้ง Error object และ string ที่ QrScanner throw
      const isNotAllowed =
        errName === 'NotAllowedError' ||
        errStr.toLowerCase().includes('permission') ||
        errStr.toLowerCase().includes('not allowed') ||
        errStr.toLowerCase().includes('denied');

      const isNotFound =
        errName === 'NotFoundError' ||
        errStr.toLowerCase().includes('not found') ||
        errStr.toLowerCase().includes('no camera');

      const isNotReadable =
        errName === 'NotReadableError' ||
        errStr.toLowerCase().includes('not readable') ||
        errStr.toLowerCase().includes('in use');

      if (isNotAllowed) {
        setCameraStatus('denied');
        setShowDeniedDialog(true);
      } else if (isNotFound) {
        setCameraStatus('not_found');
        setErrorMessage('ไม่พบกล้องในอุปกรณ์ของคุณ');
      } else if (isNotReadable) {
        setCameraStatus('error');
        setErrorMessage('กล้องถูกใช้งานโดยแอปอื่นอยู่ กรุณาปิดแอปอื่นแล้วลองใหม่');
      } else {
        setCameraStatus('error');
        setErrorMessage(`ไม่สามารถเปิดกล้องได้ กรุณาลองใหม่อีกครั้ง (${errStr})`);
      }
    }
  }, [handleScanResult, stopScanner]);

  // ── user กดปุ่มสแกน → แสดง permission dialog ─────────────────────────────
  const handleScanButtonClick = useCallback(() => {
    setScanResult(null);
    setShowPermissionDialog(true);
  }, []);

  const handleStop = useCallback(() => {
    stopScanner();
    setCameraStatus('ready');
  }, [stopScanner]);

  const handleReset = useCallback(() => {
    setScanResult(null);
    handleScanButtonClick();
  }, [handleScanButtonClick]);

  const handleRetryFromDenied = useCallback(() => {
    setShowDeniedDialog(false);
    setShowPermissionDialog(true);
  }, []);

  const isVideoVisible = ['requesting', 'granted', 'scanning'].includes(cameraStatus);
  const isScanning = cameraStatus === 'scanning';

  return (
    <>
      {/* ── Permission Dialog (inline — ไม่แยก component เพื่อให้ onClick ตรงถึง scanner) ── */}
      {showPermissionDialog && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease' }} />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 px-8 pt-8 pb-6 text-center overflow-hidden">
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/10" />
                <div className="relative mx-auto w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-4 shadow-lg">
                  <div className="absolute inset-0 rounded-3xl border-2 border-white/40" />
                  <Camera className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-white text-xl font-bold tracking-tight mb-1">อนุญาตใช้กล้อง</h2>
                <p className="text-green-100 text-sm">เพื่อสแกน QR Code สะสมชั่วโมงกิจกรรม</p>
              </div>
              <div className="px-6 py-5">
                <div className="space-y-3 mb-6">
                  {[
                    { icon: '📷', title: 'เปิดกล้องหลัง', desc: 'ใช้กล้องด้านหลังเพื่อสแกน QR Code' },
                    { icon: '🔒', title: 'ปลอดภัย 100%', desc: 'ไม่มีการบันทึกหรือส่งภาพวิดีโอ' },
                    { icon: '⚡', title: 'สแกนเร็ว', desc: 'ระบบอ่าน QR Code อัตโนมัติทันที' },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <span className="text-xl mt-0.5 shrink-0">{icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{title}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      // ปิด dialog และ start scanner ใน call stack เดียวกัน (user gesture context)
                      setShowPermissionDialog(false);
                      doStartScanner();
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white py-3.5 rounded-2xl font-bold text-base transition-all duration-150 shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    อนุญาตใช้กล้อง
                  </button>
                  <button
                    onClick={() => { setShowPermissionDialog(false); setCameraStatus('ready'); }}
                    className="w-full bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-500 py-3 rounded-2xl font-medium text-sm transition-all duration-150"
                  >
                    ไม่อนุญาต
                  </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">คุณสามารถเปลี่ยนสิทธิ์ได้ในการตั้งค่าเบราว์เซอร์</p>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideUp { from { opacity:0; transform:translateY(40px) scale(0.95) } to { opacity:1; transform:translateY(0) scale(1) } }
          `}</style>
        </>
      )}
      <DeniedGuideDialog
        open={showDeniedDialog}
        onClose={() => { setShowDeniedDialog(false); setCameraStatus('ready'); }}
        onRetry={handleRetryFromDenied}
      />

      {/* ── Main UI ──────────────────────────────────────────────────────── */}
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
            <div className="flex items-center gap-3">
              <QrCode className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">สแกนกิจกรรม</h1>
                <p className="text-green-100 text-sm">สะสมชั่วโมงกิจกรรม</p>
              </div>
            </div>

            {user && (
              <div className="mt-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4" />
                  <p className="font-semibold text-sm">{user.fullName || user.name}</p>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" />
                  <p className="text-xs opacity-90">ชั่วโมงรวม: {user.totalHours || 0} ชม.</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: 'ส่วนกลาง', value: user.centralHours || 0, color: 'bg-blue-500/20' },
                    { label: 'คณะ', value: user.facultyHours || 0, color: 'bg-purple-500/20' },
                    { label: 'เสรี', value: user.freeHours || 0, color: 'bg-orange-500/20' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`${color} rounded-lg px-2 py-1.5 text-center`}>
                      <div className="font-bold text-sm">{value}</div>
                      <div className="opacity-75 text-xs">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">

            {/* กำลังโหลด */}
            {cameraStatus === 'loading' && (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">กำลังโหลด QR Scanner...</p>
              </div>
            )}

            {/* ไม่รองรับ */}
            {cameraStatus === 'not_supported' && (
              <div className="text-center py-12">
                <AlertCircle className="w-14 h-14 text-red-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-700 mb-2">เบราว์เซอร์ไม่รองรับ</h3>
                <p className="text-gray-400 text-sm">{errorMessage}</p>
              </div>
            )}

            {/* ไม่มีกล้อง */}
            {cameraStatus === 'not_found' && (
              <div className="text-center py-12">
                <Camera className="w-14 h-14 text-gray-200 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-700 mb-2">ไม่พบกล้อง</h3>
                <p className="text-gray-400 text-sm">{errorMessage}</p>
              </div>
            )}

            {/* ready — รอกดปุ่ม */}
            {(cameraStatus === 'ready') && !scanResult && (
              <div className="text-center py-10">
                <div className="relative mx-auto w-28 h-28 mb-6">
                  <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-40" />
                  <div className="relative w-full h-full bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center">
                    <Scan className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">พร้อมสแกน QR Code</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  กดปุ่มด้านล่างเพื่อเปิดกล้อง<br />
                  ระบบจะขออนุญาตการเข้าถึงกล้องของคุณ
                </p>
                <button
                  onClick={handleScanButtonClick}
                  className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  เปิดกล้องและสแกน
                </button>
              </div>
            )}

            {/* กำลังเปิดกล้อง */}
            {cameraStatus === 'requesting' && (
              <div className="text-center py-12">
                <div className="animate-pulse w-20 h-20 bg-yellow-50 border-2 border-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-yellow-500" />
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">กำลังเปิดกล้อง...</h3>
                <p className="text-gray-400 text-sm">กรุณากด "อนุญาต" เมื่อเบราว์เซอร์ถาม</p>
              </div>
            )}

            {/* error */}
            {cameraStatus === 'error' && (
              <div className="text-center py-10">
                <AlertCircle className="w-14 h-14 text-red-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-700 mb-2">เกิดข้อผิดพลาด</h3>
                <p className="text-gray-400 text-sm mb-5">{errorMessage}</p>
                <button
                  onClick={handleScanButtonClick}
                  className="w-full bg-green-600 text-white py-3.5 rounded-2xl font-bold hover:bg-green-700 transition-all"
                >
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            )}

            {/* Video — always in DOM so videoRef is always valid */}
            <div className={isVideoVisible ? 'space-y-3' : 'hidden'}>
              <div className="relative">
                <video
                  ref={videoRef}
                  className={`w-full aspect-square object-cover rounded-2xl border-2 transition-colors ${
                    isScanning ? 'border-green-500' : 'border-gray-200'
                  }`}
                  playsInline
                  muted
                />

                {/* corner markers */}
                {isScanning && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none">
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-green-400 rounded-tl-lg" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-green-400 rounded-tr-lg" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-green-400 rounded-bl-lg" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-green-400 rounded-br-lg" />
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                      <p className="text-sm font-medium">กำลังประมวลผล...</p>
                    </div>
                  </div>
                )}
              </div>

              {isScanning && !isProcessing && (
                <>
                  <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    กำลังสแกน...
                  </div>
                  <button
                    onClick={handleStop}
                    className="w-full bg-red-50 hover:bg-red-100 active:scale-[0.98] text-red-600 border border-red-200 py-3 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    หยุดสแกน
                  </button>
                </>
              )}
            </div>
            {/* ↑ end video block — keep this div always mounted, never unmount videoRef */}

            {/* ผลลัพธ์ */}
            {scanResult && (
              <div>
                {scanResult.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-600 rounded-full p-2 shrink-0">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-green-900 mb-1">สแกนสำเร็จ! 🎉</h3>
                        <p className="text-green-700 text-sm mb-3">{scanResult.message}</p>
                        {scanResult.activity && (
                          <div className="bg-white rounded-xl p-3 border border-green-100">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-800 text-sm">{scanResult.activity.name}</h4>
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                                activityTypeColors[scanResult.activity.group as keyof typeof activityTypeColors]
                              }`}>
                                {activityTypeLabels[scanResult.activity.group as keyof typeof activityTypeLabels]}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 text-sm">ชั่วโมงที่ได้รับ</span>
                              <span className="font-bold text-green-600 text-lg">+{scanResult.activity.hours} ชม.</span>
                            </div>
                            {scanResult.activity.organizer && (
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-gray-400 text-xs">ผู้จัด</span>
                                <span className="text-gray-600 text-xs">{scanResult.activity.organizer}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-500 rounded-full p-2 shrink-0">
                        <X className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-red-900 mb-1">ไม่สามารถสแกนได้</h3>
                        <p className="text-red-700 text-sm">{scanResult.message}</p>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleReset}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  สแกนอีกครั้ง
                </button>
              </div>
            )}

            {/* คำแนะนำ */}
            {cameraStatus === 'scanning' && !scanResult && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="font-semibold text-blue-800 text-sm mb-1">วิธีการสแกน</p>
                <ul className="text-blue-600 text-xs space-y-0.5">
                  <li>• วาง QR Code ให้อยู่ในกรอบกล้อง</li>
                  <li>• ระบบจะอ่าน QR Code อัตโนมัติ</li>
                  <li>• สแกนได้ครั้งละ 1 กิจกรรม</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}