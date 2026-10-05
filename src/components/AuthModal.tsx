import React, { useState } from "react";
import { X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  initialMode: "signin" | "signup";
  onClose: () => void;
  onSuccess: (user: { email: string; name: string }) => void;
  onToast: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
  onToast,
}) => {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      onToast("Please enter both email and password.");
      return;
    }

    const userName = name.trim() || email.split("@")[0];
    onSuccess({ email, name: userName });
    onToast(`Welcome, ${userName}! You are now signed in.`);
    onClose();
  };

  const handleSocialAuth = (provider: "Google" | "Apple") => {
    const demoUser = {
      email: `designer@${provider.toLowerCase()}.com`,
      name: `${provider} Designer`,
    };
    onSuccess(demoUser);
    onToast(`Signed in with ${provider}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-900 mx-auto flex items-center justify-center mb-3">
            <span className="text-white font-extrabold text-lg">P</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "signin"
              ? "Sign in to PaletteLab"
              : "Create your PaletteLab account"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Save infinite palettes, organize brand projects, and export anywhere.
          </p>
        </div>

        <div className="space-y-2.5 mb-6">
          <button
            type="button"
            onClick={() => handleSocialAuth("Google")}
            className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleSocialAuth("Apple")}
            className="w-full py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 5.57c.68-.83 1.15-1.99 1.02-3.15-1 .04-2.18.67-2.88 1.49-.62.72-1.16 1.89-1.02 3.01 1.12.09 2.22-.57 2.88-1.35z" />
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-[1px] bg-gray-200" />
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
            Or with email
          </span>
          <div className="flex-1 h-[1px] bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Jane Designer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            {mode === "signin" ? "Sign In" : "Create Free Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          {mode === "signin" ? (
            <span>
              Don't have an account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button
                onClick={() => setMode("signin")}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
