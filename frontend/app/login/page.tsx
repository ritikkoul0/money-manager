"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation"; // Use the hook instead of manual window check
import { useEffect, useState, Suspense } from "react";

// This inner component handles the search params
function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // searchParams is already available here
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">Money Manager</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back!</h2>
            <p className="mt-2 text-sm text-gray-600">Please enter log in details below</p>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  {error === "OAuthCallback"
                    ? "Authentication failed. This might be a network issue. Please check your internet connection."
                    : "An error occurred during sign in. Please try again."}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-6">
            <div className="space-y-4">
              <input type="email" disabled placeholder="someone.someone@gmail.com" className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg" />
              <input type="password" disabled placeholder="••••••••" className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg" />
              <button onClick={() => signIn("google", { callbackUrl: "/" })} className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                Log in with Google
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
         {/* ... Your Hero SVG/Content ... */}
         <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Manage your Money Anywhere</h1>
            <p className="text-lg text-gray-300">Quicken on the web</p>
         </div>
      </div>
    </div>
  );
}

// Main page component exports the Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
