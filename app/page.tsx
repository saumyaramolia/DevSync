import { SignInButton } from "@/components/sign-in-button";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="flex max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Dev<span className="text-blue-400">Sync</span>
          </h1>
          <p className="text-lg text-slate-400">
            Your collaborative workspace for engineering teams.
          </p>
        </div>
        <SignInButton />
      </div>
    </main>
  );
}
