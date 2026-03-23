import { useState, useEffect } from "react";

const ONBOARDING_KEY = "habitual-onboarding-complete";

const STEPS = [
  {
    title: "Welcome to Habitual!",
    description: "Build better habits, one day at a time. Track your progress, build streaks, and stay motivated.",
    icon: "&#127793;",
    color: "from-emerald-500 to-green-500",
  },
  {
    title: "Track Daily Habits",
    description: "Check off habits each day on the Today tab. Watch your streaks grow and celebrate perfect days.",
    icon: "&#9989;",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Stay Focused",
    description: "Use the built-in timer with Pomodoro technique to stay focused. Link sessions to specific habits.",
    icon: "&#9201;",
    color: "from-violet-500 to-purple-500",
  },
  {
    title: "Visualize Progress",
    description: "See your heatmap, earn achievement badges, and track your consistency score over time.",
    icon: "&#128200;",
    color: "from-amber-500 to-orange-500",
  },
];

export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) {
        setShow(true);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const handleComplete = () => {
    setShow(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // ignore
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  if (!show) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card !p-8 w-80 max-w-[90vw] animate-scale-in text-center">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-emerald-500" : i < step ? "w-1.5 bg-emerald-300" : "w-1.5 bg-gray-300 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${current.color} shadow-xl mb-5 text-4xl`}
          dangerouslySetInnerHTML={{ __html: current.icon }}
        />

        {/* Content */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{current.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">{current.description}</p>

        {/* Actions */}
        <div className="flex gap-2">
          {step < STEPS.length - 1 ? (
            <>
              <button
                onClick={handleComplete}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl"
              >
                Next
              </button>
            </>
          ) : (
            <button
              onClick={handleComplete}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
