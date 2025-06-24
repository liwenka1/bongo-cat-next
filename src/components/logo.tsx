import type { LogoProps } from "@/types";

export default function Logo({ size = 48, className = "" }: LogoProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white ${className}`}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.4 }}>🐱</span>
    </div>
  );
}
