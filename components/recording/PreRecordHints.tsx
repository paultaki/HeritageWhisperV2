export default function PreRecordHints() {
  return (
    <div className="mx-auto w-full max-w-md px-6">
      <div
        className="mx-auto w-full max-w-sm rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)] dark:border-neutral-700/50 dark:bg-neutral-800/50"
        role="region"
        aria-label="Recording tips and privacy"
      >
        {/* Micro-tip */}
        <div className="flex items-start gap-2.5">
          <svg aria-hidden="true" className="mt-0.5 h-4 w-4 text-neutral-500 dark:text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 21h6v-2H9v2Zm3-20a7 7 0 0 0-7 7c0 2.38 1.18 4.48 3 5.74V16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A6.99 6.99 0 0 0 20 8a7 7 0 0 0-7-7Z"/>
          </svg>
          <p className="text-[15px] leading-6 text-neutral-700 dark:text-neutral-200">
            Start with the date and place.
          </p>
        </div>

        {/* Divider */}
        <div className="my-3 h-px w-full bg-neutral-200/70 dark:bg-neutral-700/50" />

        {/* Privacy */}
        <div className="flex items-start gap-2.5">
          <svg aria-hidden="true" className="mt-0.5 h-4 w-4 text-neutral-500 dark:text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8V7a5 5 0 0 0-10 0v1H5a1 1 0 0 0-1 1v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V9a1 1 0 0 0-1-1h-2Zm-8 0V7a3 3 0 0 1 6 0v1H9Z"/>
          </svg>
          <p className="text-[13px] leading-5 text-neutral-600 dark:text-neutral-300">
            Private by default. You choose what to share.
          </p>
        </div>
      </div>
    </div>
  );
}
