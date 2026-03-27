'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Camera, Check, AlertCircle, X, User, Clock, Loader2 } from 'lucide-react';

interface ScanResult {
  success: boolean;
  activity?: { id: number; name: string; group: string; hours: number; organizer?: string };
  message: string;
}

const activityTypeLabels: Record<string, string> = { CENTRAL: 'ส่วนกลาง', FACULTY: 'คณะ', FREE: 'เสรี' };
const activityTypeColors: Record<string, string> = {
  CENTRAL: 'bg-blue-100 text-blue-800 border-blue-200',
  FACULTY: 'bg-purple-100 text-purple-800 border-purple-200',
  FREE:    'bg-orange-100 text-orange-800 border-orange-200',
};

// ── ดึง code จาก URL หรือ plain code ────────────────────────────────────────
function extractCode(raw: string): string {
  try {
    const url = new URL(raw.trim());
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1]; // เอาส่วนท้ายสุด เช่น abc123
  } catch {
    return raw.trim(); // ไม่ใช่ URL → ใช้ค่าตรงๆ
  }
}

export default function StudentScanPage() {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const rafRef     = useRef<number>(0);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const activeRef  = useRef(false); // ป้องกัน detect ซ้ำ

  const [isScanning, setIsScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errMsg,     setErrMsg]     = useState('');
  const [user,       setUser]       = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setUser(d.user))
      .catch(() => {});
  }, []);

  useEffect(() => () => stopCamera(), []);

  const stopCamera = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
  }, []);

  // ── ส่ง code ไป API ────────────────────────────────────────────────────────
  const submitCode = useCallback(async (raw: string) => {
    const code = extractCode(raw);
    console.log('[scan] raw:', raw, '→ code:', code);

    stopCamera();
    setProcessing(true);
    setErrMsg('');

    try {
      const res  = await fetch('/api/students/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: code }),
      });
      const data = await res.json();
      if (res.ok) {
        setScanResult({ success: true, activity: data.activity, message: data.message || 'สแกนสำเร็จ!' });
        if (data.activity) {
          setUser((prev: any) => {
            if (!prev) return prev;
            const n = { ...prev };
            if      (data.activity.group === 'CENTRAL') n.centralHours = (n.centralHours || 0) + data.activity.hours;
            else if (data.activity.group === 'FACULTY') n.facultyHours = (n.facultyHours || 0) + data.activity.hours;
            else if (data.activity.group === 'FREE')    n.freeHours    = (n.freeHours    || 0) + data.activity.hours;
            n.totalHours = (n.centralHours || 0) + (n.facultyHours || 0) + (n.freeHours || 0);
            return n;
          });
        }
      } else {
        setScanResult({ success: false, message: data.error || 'เกิดข้อผิดพลาดในการสแกน' });
      }
    } catch {
      setScanResult({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setProcessing(false);
    }
  }, [stopCamera]);

  // ── scan loop ด้วย jsQR (รองรับทุก browser) ──────────────────────────────
  const scanLoop = useCallback(async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !activeRef.current) return;

    if (video.readyState >= 2 && video.videoWidth > 0) {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(video, 0, 0);

      try {
        const jsQR = (await import('jsqr')).default;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (result?.data) {
          await submitCode(result.data);
          return; // หยุด loop
        }
      } catch { /* ไม่มี QR ในเฟรมนี้ */ }
    }

    rafRef.current = requestAnimationFrame(scanLoop);
  }, [submitCode]);

  // ── เปิดกล้อง ─────────────────────────────────────────────────────────────
  const startScanning = useCallback(async () => {
    setScanResult(null);
    setErrMsg('');

    if (!navigator?.mediaDevices?.getUserMedia) {
      setErrMsg('เบราว์เซอร์ไม่รองรับการเข้าถึงกล้อง');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      activeRef.current = true;
      setIsScanning(true);
      rafRef.current = requestAnimationFrame(scanLoop);
    } catch (err: any) {
      const name = err?.name ?? '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setErrMsg('denied');
      } else if (name === 'NotReadableError') {
        setErrMsg('กล้องถูกแอปอื่นใช้งานอยู่ ปิดแล้วลองใหม่');
      } else {
        setErrMsg(err?.message ?? 'เปิดกล้องไม่สำเร็จ');
      }
    }
  }, [scanLoop]);

  const handleStop = useCallback(() => {
    stopCamera();
    setScanResult(null);
  }, [stopCamera]);

  return (
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
            <div className="mt-4 p-3 bg-white/10 rounded-xl">
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
                  { label: 'ส่วนกลาง', v: user.centralHours || 0, c: 'bg-blue-500/20' },
                  { label: 'คณะ',      v: user.facultyHours || 0, c: 'bg-purple-500/20' },
                  { label: 'เสรี',     v: user.freeHours    || 0, c: 'bg-orange-500/20' },
                ].map(({ label, v, c }) => (
                  <div key={label} className={`${c} rounded-lg px-2 py-1.5 text-center`}>
                    <div className="font-bold text-sm">{v}</div>
                    <div className="opacity-75 text-xs">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {/* Video + Canvas */}
          <div className="relative aspect-square bg-gray-900 rounded-2xl overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />

            {/* corner markers */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-6 left-6   w-10 h-10 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                <div className="absolute top-6 right-6  w-10 h-10 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-6 left-6  w-10 h-10 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                <div className="absolute bottom-3 inset-x-0 flex justify-center">
                  <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                    วาง QR Code ในกรอบ
                  </span>
                </div>
              </div>
            )}

            {/* placeholder */}
            {!isScanning && !processing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50">
                <QrCode className="w-16 h-16" />
                <p className="text-sm">กดปุ่มด้านล่างเพื่อเปิดกล้อง</p>
              </div>
            )}

            {/* processing */}
            {processing && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium">กำลังประมวลผล...</p>
                </div>
              </div>
            )}
          </div>

          {/* scanning status */}
          {isScanning && !processing && (
            <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              กำลังสแกน...
            </div>
          )}

          {/* Error */}
          {errMsg && errMsg !== 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="font-semibold text-red-800 text-sm">เกิดข้อผิดพลาด</p>
              <p className="text-red-500 text-xs">{errMsg}</p>
              <button onClick={startScanning}
                className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold mx-auto block">
                ลองใหม่
              </button>
            </div>
          )}

          {errMsg === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="font-semibold text-red-800 text-sm">ไม่ได้รับอนุญาตใช้กล้อง</p>
              <p className="text-red-500 text-xs">อนุญาตกล้องในการตั้งค่าเบราว์เซอร์แล้วรีเฟรช</p>
              <button onClick={() => window.location.reload()}
                className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold mx-auto block">
                รีเฟรช
              </button>
            </div>
          )}

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
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${activityTypeColors[scanResult.activity.group]}`}>
                              {activityTypeLabels[scanResult.activity.group]}
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
            </div>
          )}

          {/* ปุ่ม */}
          <div className="pt-1">
            {!isScanning ? (
              <button
                onClick={startScanning}
                disabled={processing}
                className="w-full bg-green-600 hover:bg-green-700 active:scale-[.98] disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                {scanResult ? 'สแกนอีกครั้ง' : 'สแกน QR Code'}
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />หยุดสแกน
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}