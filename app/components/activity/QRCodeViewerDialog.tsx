// components/activity/QRCodeViewerDialog.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download, Printer, Copy, Check, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';

interface QRCodeData {
  id: number;
  code: string;
  maxUses: number;
  currentUses: number;
  expiredAt: string | null;
  url: string;
}

interface QRCodeViewerDialogProps {
  open: boolean;
  onClose: () => void;
  activityName: string;
  qrCodeData: QRCodeData | null;
}

export default function QRCodeViewerDialog({
  open,
  onClose,
  activityName,
  qrCodeData,
}: QRCodeViewerDialogProps) {
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrCodeData?.url) {
      generateQRImage(qrCodeData.url);
    }
  }, [qrCodeData]);

  const generateQRImage = async (url: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });
      setQrImageUrl(dataUrl);
    } catch (err) {
      console.error('Error generating QR image:', err);
    }
  };

  const handleDownload = () => {
    if (!qrImageUrl) return;
    const link = document.createElement('a');
    link.download = `qr-${activityName}-${Date.now()}.png`;
    link.href = qrImageUrl;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${activityName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: sans-serif;
            }
            h2 { margin-bottom: 8px; font-size: 20px; }
            p { margin: 4px 0; color: #666; font-size: 14px; }
            img { margin: 20px 0; }
            .info { text-align: center; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h2>${activityName}</h2>
          <img src="${qrImageUrl}" width="300" height="300" />
          <div class="info">
            <p>Scan QR Code เพื่อบันทึกกิจกรรม</p>
            ${qrCodeData?.expiredAt ? `<p>หมดอายุ: ${new Date(qrCodeData.expiredAt).toLocaleString('th-TH')}</p>` : ''}
            <p>รองรับ: ${qrCodeData?.maxUses} คน</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyUrl = () => {
    if (!qrCodeData?.url) return;
    navigator.clipboard.writeText(qrCodeData.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open || !qrCodeData) return null;

  const isExpired = qrCodeData.expiredAt && new Date(qrCodeData.expiredAt) < new Date();
  const isFull = qrCodeData.currentUses >= qrCodeData.maxUses;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">QR Code</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* QR Code Image */}
        <div className="p-6 flex flex-col items-center">
          <p className="text-sm font-medium text-gray-700 mb-4 text-center">
            {activityName}
          </p>

          {qrImageUrl ? (
            <div className="relative">
              <img
                src={qrImageUrl}
                alt={`QR Code - ${activityName}`}
                className="w-64 h-64 rounded-lg"
              />
              {/* Status Badge */}
              {(isExpired || isFull) && (
                <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {isExpired ? 'หมดอายุ' : 'เต็มแล้ว'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          )}

          {/* Info */}
          <div className="w-full mt-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ใช้งานแล้ว:</span>
              <span className="font-medium text-gray-900">
                {qrCodeData.currentUses} / {qrCodeData.maxUses} คน
              </span>
            </div>
            {qrCodeData.expiredAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">หมดอายุ:</span>
                <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                  {new Date(qrCodeData.expiredAt).toLocaleString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">สถานะ:</span>
              <span className={`font-medium ${
                isExpired ? 'text-red-600' : isFull ? 'text-orange-600' : 'text-green-600'
              }`}>
                {isExpired ? 'หมดอายุ' : isFull ? 'เต็มแล้ว' : 'ใช้งานได้'}
              </span>
            </div>
          </div>

          {/* URL */}
          <div className="w-full mt-4">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
              <code className="flex-1 text-xs text-gray-600 truncate">
                {qrCodeData.url}
              </code>
              <button
                onClick={handleCopyUrl}
                className="p-1.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                title="คัดลอก URL"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลด
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-300 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Printer className="w-4 h-4" />
            พิมพ์
          </button>
        </div>
      </div>
    </div>
  );
}