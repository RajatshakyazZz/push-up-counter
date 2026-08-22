import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'AI Push-Up Counter | Real-Time Pose Tracker',
  description: 'Browser-based AI push-up counter using MediaPipe Pose estimation, form validation, and angle detection.',
  openGraph: {
    title: 'AI Push-Up Counter',
    description: 'Browser-based AI push-up counter with real-time pose estimation and form guidance.',
    type: 'website',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
