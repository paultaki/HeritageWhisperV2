"use client";

export function DayPillBar() {
  // Format current date as readable string
  const formatDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    };
    return today.toLocaleDateString('en-US', options);
  };

  return (
    <div className="w-full">
      <div className="max-w-md mx-auto px-4">
        <div className="flex flex-wrap items-center gap-2 justify-center py-3">
          <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[13px] font-medium tracking-tight ring-1 ring-inset ring-white/10">
            {formatDate()}
          </div>
        </div>
      </div>
    </div>
  );
}
