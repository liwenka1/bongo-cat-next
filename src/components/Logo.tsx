interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 48, className = "" }: LogoProps) {
  return (
    <div 
      className={`flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white font-bold ${className}`}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.4 }}>🐱</span>
    </div>
  )
} 