export function AILoadingSpinner() {
  return (
    <div className="relative w-24 h-24">
      {/* Outer ring */}
      <div className="absolute inset-0 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      
      {/* Middle ring */}
      <div className="absolute inset-2 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
      
      {/* Inner ring */}
      <div className="absolute inset-4 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin [animation-duration:1s]" />
      
      {/* Center pulse */}
      <div className="absolute inset-8 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full animate-glow-pulse" />
    </div>
  );
}
