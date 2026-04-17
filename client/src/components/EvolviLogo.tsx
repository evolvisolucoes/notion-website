const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663530706232/mYkMUFHpScRrzGiAAEVjJb/logo-evolvi_9c6bc98a.svg";

export function EvolviLogo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-6", md: "h-8", lg: "h-10" };
  return (
    <img
      src={LOGO_URL}
      alt="Evolvi"
      className={`${sizes[size]} w-auto ${className}`}
    />
  );
}
