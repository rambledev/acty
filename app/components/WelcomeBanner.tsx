// app/components/WelcomeBanner.tsx
'use client';

import { useEffect, useState } from 'react';

interface Props {
  name: string;
  color?: 'green' | 'blue' | 'red';
}

const colorMap = {
  green: 'bg-green-600',
  blue:  'bg-blue-600',
  red:   'bg-red-600',
};

export default function WelcomeBanner({ name, color = 'green' }: Props) {
  const [show,    setShow]    = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // เริ่ม fade out หลัง 3.5 วินาที
    const fadeTimer = setTimeout(() => setVisible(false), 3500);
    // ลบออกจาก DOM หลัง 4 วินาที
    const removeTimer = setTimeout(() => setShow(false), 4000);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${colorMap[color]} text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <span className="text-2xl">👋</span>
      <div>
        <p className="font-bold text-sm">ยินดีต้อนรับกลับ!</p>
        <p className="text-xs opacity-80">{name}</p>
      </div>
    </div>
  );
}