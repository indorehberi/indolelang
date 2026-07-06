"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { apiUrl } from "@/lib/api";

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole: "bidder" | "provider";
  action: "login" | "register";
}

export default function GoogleAuthModal({
  isOpen,
  onClose,
  defaultRole,
  action,
}: GoogleAuthModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);

  // Sync ref to action & role dynamically
  const actionRef = useRef(action);
  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  // Initialize official Google button when Modal is active
  useEffect(() => {
    if (isOpen && gsiLoaded) {
      try {
        const client_id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
        
        if (client_id === "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com") {
          console.error("Google Client ID belum diatur. Harap set NEXT_PUBLIC_GOOGLE_CLIENT_ID di .env");
          // Optionally notify user
        }
        
        // Initialize Google One Tap / Sign In
        (window as any).google?.accounts.id.initialize({
          client_id: client_id,
          callback: (response: any) => {
            handleRealGoogleLogin(response.credential);
          },
        });

        // Render official button
        const btnContainer = document.getElementById("googleOfficialButton");
        if (btnContainer) {
          (window as any).google?.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "pill",
          });
        }
      } catch (err) {
        console.error("Failed to initialize Google GSI", err);
      }
    }
  }, [isOpen, gsiLoaded]);

  if (!isOpen) return null;

  // Handle Real Google Login using JWT idToken
  const handleRealGoogleLogin = async (idToken: string) => {
    setLoading(true);
    const currentAction = actionRef.current;

    try {
      const response = await fetch(apiUrl("/auth/google"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          role: "bidder", // Always register as bidder by default on Google Sign-In
          action: currentAction,
        }),
      });

      const resData = await response.json();
      
      if (response.ok && resData.success) {
        const user = resData.data.user;
        const accessToken = resData.data.accessToken;

        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("user", JSON.stringify(user));
        }

        onClose();
        if (user.role === "bidder") {
          router.push("/bidder/dashboard");
        } else if (user.role === "provider") {
          router.push("/provider/dashboard");
        }
      } else {
        alert(resData.error?.message || "Google Sign-In failed.");
      }
    } catch (err) {
      alert("Koneksi gagal. Pastikan API server aktif.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Load Google SDK Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={() => setGsiLoaded(true)}
        strategy="afterInteractive"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
        <div className="bg-white rounded-3xl border border-outline-variant/60 shadow-2xl w-full max-w-[480px] p-6 relative overflow-hidden transition-all transform scale-100 mx-4">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-variant/40 rounded-full p-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-2xl font-bold">close</span>
          </button>

          {/* Google Account Chooser */}
          <div className="pt-2">
            <h3 className="text-heading-sm font-bold text-on-surface mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.97 3.7-8.62z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.24 14.55c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.39 7.56C.5 9.36 0 11.38 0 13.5s.5 4.14 1.39 5.94l3.85-2.99z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.73-2.89c-1.04.7-2.38 1.11-4.23 1.11-3.34 0-5.86-1.81-6.76-4.51L1.39 16.8C3.37 20.33 7.35 23 12 23z"
                />
              </svg>
              Masuk dengan Google
            </h3>
            <p className="text-body-sm text-on-surface-variant mb-6">
              Silakan pilih akun Google aktif Anda untuk masuk ke <strong>IndoLelang</strong> secara instan.
            </p>

            {loading ? (
              <div className="flex flex-col items-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-premium mb-3"></div>
                <p className="text-body-sm text-on-surface-variant font-medium">Memproses data Google...</p>
              </div>
            ) : (
              /* Google Official SDK Login Button */
              <div className="flex flex-col items-center gap-5">
                <div className="w-full flex justify-center py-4 bg-surface-variant/10 rounded-2xl border border-outline-variant/30">
                  <div id="googleOfficialButton" className="transition-all hover:scale-102"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
