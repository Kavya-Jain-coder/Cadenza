'use client';

export default function StepIndicator({ currentStep, totalSteps, label = "CREATE ACCOUNT" }) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <div className="flex justify-between items-center text-[10px] tracking-[0.25em] font-mono text-gold-400 uppercase mb-2">
        <span>{label}</span>
        <span>
          STEP {currentStep} OF {totalSteps}
        </span>
      </div>
      <div className="h-[2px] w-full bg-void/50 border border-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
