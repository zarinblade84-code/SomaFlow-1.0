import { ImageResponse } from 'next/og';

// Next.js will automatically use this to generate a high-res PNG
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 280,
          background: '#00D8B4', // The bright teal from your screenshot
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#070C14', // The dark background color of your app
          fontWeight: 800,
        }}
      >
        SF
      </div>
    ),
    { ...size }
  );
}