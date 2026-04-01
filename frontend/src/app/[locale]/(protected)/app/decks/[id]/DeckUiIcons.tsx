type IconProps = { className?: string };

/** Heroicons-style X mark for close / remove actions. */
export function IconXMark({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
