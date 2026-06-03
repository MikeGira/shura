import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Suspense fallback={<div className="w-full max-w-sm h-64 bg-[var(--bg-elev)] rounded-[var(--radius-lg)] animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
