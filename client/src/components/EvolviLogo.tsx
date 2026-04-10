export function EvolviLogo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-6", md: "h-8", lg: "h-10" };
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <svg viewBox="0 0 24 24" className={`${sizes[size]} w-auto`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 16 L12 4 L20 16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600" />
        <path d="M8 16 L12 8 L16 16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400" />
      </svg>
      <span className={`font-bold tracking-tight text-blue-700 ${size === "sm" ? "text-lg" : size === "md" ? "text-xl" : "text-2xl"}`}>
        evolvi
      </span>
    </div>
  );
}
