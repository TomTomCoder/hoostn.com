import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Logo header */}
      <div className="absolute top-8 left-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <span className="text-2xl font-bold text-gray-anthracite">
            Hoostn
          </span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex items-center justify-center min-h-screen p-4">
        {children}
      </main>
    </div>
  );
}
