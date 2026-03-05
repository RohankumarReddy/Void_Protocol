"use client"

import { useUsername } from "@/hooks/use-username"
import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import MatrixRain from "@/components/matrix-rain"
// --- UTILS (LOGIC UNTOUCHED) ---
const useHash = () => {
  const [hash, setHash] = useState("SHA-256: 00000000")
  useEffect(() => {
    setHash("SHA-256: " + Math.random().toString(16).substr(2, 8).toUpperCase())
  }, [])
  return hash
}

const RedactedLabel = ({ text, chance = 0.1 }: { text: string; chance?: number }) => {
  const [display, setDisplay] = useState(text)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < chance) {
        setDisplay(Math.random() > 0.5 ? "[NULL]" : "[REDACTED]")
        setTimeout(() => setDisplay(text), 150 + Math.random() * 500)
      }
    }, 2000 + Math.random() * 5000)
    return () => clearInterval(interval)
  }, [text, chance])
  
  return (
    <span className={display !== text ? "text-[#9D00FF] bg-[#050505] px-1 inline-block" : "inline-block"}>
      {display}
    </span>
  )
}

// --- MODULAR UI COMPONENTS ---

const CornerBrackets = () => (
  <>
    <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-l-2 border-t-2 border-[#00FFFF] shadow-[0_0_10px_#00FFFF] opacity-80" />
    <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-r-2 border-t-2 border-[#00FFFF] shadow-[0_0_10px_#00FFFF] opacity-80" />
    <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-l-2 border-b-2 border-[#00FFFF] shadow-[0_0_10px_#00FFFF] opacity-80" />
    <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-r-2 border-b-2 border-[#00FFFF] shadow-[0_0_10px_#00FFFF] opacity-80" />
  </>
)

const StatusIndicator = ({ label, active = true, color = "bg-[#00FFFF]", glow = "shadow-[0_0_8px_#00FFFF]" }: { label: string, active?: boolean, color?: string, glow?: string }) => (
  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/70 bg-black/60 border border-white/10 px-2 py-1 backdrop-blur-sm">
    <div className={`w-2 h-2 ${active ? `${color} ${glow} animate-pulse-fast` : 'bg-gray-800'}`} />
    <span className="font-vt323 text-sm mt-0.5">{label}</span>
  </div>
)

const SystemHeader = ({ hash }: { hash: string }) => (
  <div className="w-full border-b border-[#00FFFF]/30 bg-[#00FFFF]/5 p-3 flex justify-between items-center relative overflow-hidden">
    {/* Animated sweeping scanline across the header */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00FFFF]/20 to-transparent w-[200%] animate-scan" />
    
    <div className="flex items-center gap-4 relative z-10">
      <div className="px-2 py-1 bg-[#00FFFF]/20 border border-[#00FFFF] text-[#00FFFF] text-xs font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(0,255,255,0.3)]">
        SYS.OP
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-[#00FFFF]/70 uppercase tracking-[0.2em]">Connection: Secure</span>
        <span className="text-xs text-white font-mono tracking-wider">{hash}</span>
      </div>
    </div>
    
    <div className="flex gap-2 relative z-10 hidden sm:flex">
      <StatusIndicator label="NET" active color="bg-[#00FF66]" glow="shadow-[0_0_8px_#00FF66]" />
      <StatusIndicator label="ENC" active color="bg-[#9D00FF]" glow="shadow-[0_0_8px_#9D00FF]" />
      <StatusIndicator label="UPLINK" active color="bg-[#00FFFF]" glow="shadow-[0_0_8px_#00FFFF]" />
    </div>
  </div>
)

const WarningAlert = ({ wasDestroyed, error }: { wasDestroyed: boolean, error: string | null }) => {
  if (!wasDestroyed && !error) return null;
  
  return (
    <div className="my-4 border border-[#ea4f01] bg-[#ea4f01]/10 p-4 relative overflow-hidden group glitch-container">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjZWE0ZjAxIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwLjIiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik0wIDQwaDQwTTAgMjBoNDBNMjAgMHY0ME00MCAwdjQwIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ea4f01] shadow-[0_0_10px_#ea4f01] animate-pulse-fast" />
      
      <div className="pl-4 relative z-10 flex items-start gap-3">
        <div className="mt-1 w-4 h-4 bg-[#ea4f01] flex items-center justify-center text-black text-xs font-bold">!</div>
        <div>
          {wasDestroyed && (
            <>
              <p className="text-[#ea4f01] text-sm font-bold tracking-[0.2em] uppercase glitch-text" data-text="ROOM DESTROYED">Room Destroyed</p>
              <p className="text-[#ea4f01]/80 text-xs mt-1 font-vt323 text-lg">CRITICAL: Data purge complete. History securely overwritten.</p>
            </>
          )}
          {error === "room-not-found" && (
            <>
              <p className="text-[#ea4f01] text-sm font-bold tracking-[0.2em] uppercase glitch-text" data-text="SIGNAL LOST">Signal Lost</p>
              <p className="text-[#ea4f01]/80 text-xs mt-1 font-vt323 text-lg">Target coordinates are invalid or session has expired.</p>
            </>
          )}
          {error === "room-full" && (
            <>
              <p className="text-[#ea4f01] text-sm font-bold tracking-[0.2em] uppercase glitch-text" data-text="CAPACITY REACHED">Capacity Reached</p>
              <p className="text-[#ea4f01]/80 text-xs mt-1 font-vt323 text-lg">Server protocol rejects additional incoming connections.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const IdentityBlock = ({ username }: { username: string | null }) => (
  <div className="space-y-1 mb-6">
    <div className="flex justify-between items-end">
      <label className="text-[10px] text-[#00FFFF] uppercase tracking-[0.3em] block pl-1">
        Subject Identity
      </label>
      <span className="text-[8px] text-[#9D00FF] uppercase tracking-widest pr-1 animate-pulse">Classified // Level 4</span>
    </div>
    
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFFF]/50 to-[#9D00FF]/50 rounded-sm opacity-30 group-hover:opacity-60 transition duration-500 blur-md"></div>
      <div className="relative bg-[#050505] border border-[#00FFFF]/50 p-4 flex items-center justify-between shadow-[inset_0_0_20px_rgba(0,255,255,0.1)]">
        <span className="text-xl text-[#00FF66] font-vt323 tracking-widest drop-shadow-[0_0_5px_rgba(0,255,102,0.8)]">
          {username ? `> ${username}` : <span className="opacity-50">&gt; AWAITING_INPUT...<span className="animate-blink">_</span></span>}
        </span>
        <div className="flex gap-2">
           <div className="h-4 w-1 bg-[#00FFFF] animate-pulse-fast opacity-80" />
           <div className="h-4 w-1 bg-[#00FFFF] animate-pulse opacity-50" />
           <div className="h-4 w-1 bg-[#00FFFF] animate-pulse-fast opacity-30" />
        </div>
      </div>
    </div>
  </div>
)

const NeonButton = ({ onClick, disabled, isPending }: { onClick: () => void, disabled: boolean, isPending: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="group relative w-full overflow-hidden border border-[#00FFFF] bg-[#00FFFF]/5 p-4 hover:bg-[#00FFFF]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)]"
  >
    {/* Radar sweep line */}
    <div className="absolute top-0 bottom-0 left-[-10%] w-[10%] bg-gradient-to-r from-transparent via-[#00FFFF] to-transparent group-hover:animate-sweep opacity-50" />
    
    {/* Holographic lines */}
    <div className="absolute top-1 left-1 right-1 h-[1px] bg-[#00FFFF]/30" />
    <div className="absolute bottom-1 left-1 right-1 h-[1px] bg-[#00FFFF]/30" />
    
    <div className="relative flex items-center justify-center gap-4">
      {isPending ? (
        <span className="text-[#00FFFF] font-bold tracking-[0.4em] text-sm animate-pulse drop-shadow-[0_0_8px_#00FFFF]">
          [ ESTABLISHING_LINK ]
        </span>
      ) : (
        <>
          <span className="w-2 h-2 bg-[#ea4f01] group-hover:bg-[#00FF66] transition-colors shadow-[0_0_5px_#ea4f01] group-hover:shadow-[0_0_8px_#00FF66]" />
          <span className="text-[#00FFFF] group-hover:text-white font-bold tracking-[0.4em] text-sm transition-colors drop-shadow-[0_0_5px_#00FFFF]">
            INITIATE_PROTOCOL
          </span>
          <span className="w-2 h-2 bg-[#ea4f01] group-hover:bg-[#00FF66] transition-colors shadow-[0_0_5px_#ea4f01] group-hover:shadow-[0_0_8px_#00FF66]" />
        </>
      )}
    </div>
  </button>
)

const TerminalPanel = ({ children }: { children: React.ReactNode }) => (
  <div className="relative border border-[#00FFFF]/40 bg-[#050505]/95 backdrop-blur-md shadow-[0_0_50px_-10px_rgba(0,255,255,0.15)] flex flex-col w-full">
    <CornerBrackets />
    {children}
  </div>
)

// --- PAGE ---
export default function Page() {
  return <Lobby />
}

function Lobby() {
  const { username } = useUsername()
  const router = useRouter()
  const searchParams = useSearchParams()
  const wasDestroyed = searchParams.get("destroyed") === "true"
  const error = searchParams.get("error")
  const hash = useHash()

  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: async () => {
      const res = await client.room.create.post()
      if (res.status === 200) router.push(`/room/${res.data?.roomId}`)
    },
  })

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-[#050505] font-share-tech selection:bg-[#00FFFF] selection:text-black text-[#00FFFF] overflow-hidden">
      <MatrixRain />
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.06] pointer-events-none" />
      <div className="absolute inset-0 radial-vignette z-0 pointer-events-none" />
      <div className="absolute inset-0 digital-grain z-10 pointer-events-none opacity-20" />
      <div className="absolute inset-0 crt-scanline z-50 opacity-30 pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 crt-flicker z-40 opacity-10 pointer-events-none" />

      {/* MAIN OS WINDOW */}
      <div className="relative z-20 w-full max-w-2xl flex flex-col gap-2">
        
        <div className="flex justify-between items-end px-1">
          <span className="text-[10px] text-[#00FFFF]/60 tracking-[0.3em] uppercase">
            VoidOS v9.9.4 // Terminal Mode
          </span>
          <div className="flex gap-1">
             <div className="w-6 h-1 bg-[#00FFFF]/30" />
             <div className="w-6 h-1 bg-[#00FFFF]/50" />
             <div className="w-6 h-1 bg-[#00FFFF]" />
          </div>
        </div>

        <TerminalPanel>
          <SystemHeader hash={hash} />
          
          <div className="p-6 sm:p-10 relative">
            {/* Background watermark logo inside terminal */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[150px] font-bold text-[#00FFFF]/[0.02] pointer-events-none select-none">
              V.OS
            </div>

            <div className="relative z-10">
              <div className="mb-8">
                 <h1 className="text-5xl font-bold tracking-tighter mb-2 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#9D00FF] drop-shadow-none">VOID</span>_PROTOCOL
                 </h1>
                 <div className="text-[#00FFFF]/80 text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                   <span className="inline-block w-8 h-[1px] bg-[#9D00FF] shadow-[0_0_5px_#9D00FF]"></span>
                   <RedactedLabel text="Encrypted Channel Setup" chance={0.15} />
                   <span className="inline-block flex-1 h-[1px] bg-gradient-to-r from-[#9D00FF] to-transparent opacity-50"></span>
                 </div>
              </div>

              <WarningAlert wasDestroyed={wasDestroyed} error={error} />

              <div className="bg-black/40 border border-[#00FFFF]/20 p-6 shadow-inner relative">
                <div className="absolute top-0 left-4 w-12 h-[1px] bg-[#00FFFF]" />
                <div className="absolute bottom-0 right-4 w-12 h-[1px] bg-[#00FFFF]" />
                
                <IdentityBlock username={username} />

                <div className="pt-4 mt-6 border-t border-[#00FFFF]/10 border-dashed">
                  <NeonButton onClick={() => createRoom()} disabled={isPending} isPending={isPending} />
                  
                  <div className="flex justify-between items-center mt-3 px-1 text-[9px] text-[#00FFFF]/60 font-mono">
                    <span>ROOT_ACCESS: GRANTED</span>
                    <span className="flex items-center gap-1">
                      LATENCY: <span className="text-[#00FF66]">12ms</span> 
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TerminalPanel>

        <div className="mt-2 flex justify-between px-2 text-[10px] text-[#00FFFF]/40 uppercase tracking-widest font-mono">
          <span>{new Date().toISOString().split('T')[0]}</span>
          <span className="animate-pulse">_AWAITING_COMMAND</span>
        </div>
      </div>

      {/* FIXED STYLE TAG FOR RETRO EFFECTS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;600&family=Share+Tech+Mono&family=VT323&display=swap');
        
        body { 
            background-color: #050505;
        }

        .font-share-tech {
          font-family: 'Share Tech Mono', monospace;
        }
        
        .font-vt323 {
          font-family: 'VT323', monospace;
          letter-spacing: 0.1em;
        }

        /* Scanline Backgrounds */
        .bg-grid-pattern {
            background-size: 30px 30px;
            background-image: linear-gradient(to right, #00FFFF 1px, transparent 1px),
                              linear-gradient(to bottom, #00FFFF 1px, transparent 1px);
        }

        .radial-vignette {
          background: radial-gradient(circle at center, transparent 40%, #050505 100%);
        }

        .digital-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
        }
        
        .crt-scanline {
          background: linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%),
                      linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06));
          background-size: 100% 4px, 6px 100%;
        }

        /* Animations */
        @keyframes sweep {
          0% { left: -10%; }
          100% { left: 110%; }
        }
        .animate-sweep {
          animation: sweep 2s linear infinite;
        }

        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(50%); }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }

        @keyframes pulse-fast {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-pulse-fast {
          animation: pulse-fast 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }

        @keyframes crt-flicker {
          0% { opacity: 0.1; }
          5% { opacity: 0.15; }
          10% { opacity: 0.1; }
          15% { opacity: 0.2; }
          20% { opacity: 0.1; }
          50% { opacity: 0.1; }
          55% { opacity: 0.12; }
          60% { opacity: 0.1; }
          100% { opacity: 0.1; }
        }
        .crt-flicker {
          animation: crt-flicker 5s infinite;
        }

        /* Glitch Text Effect */
        .glitch-text {
          position: relative;
        }
        .glitch-text::before, .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #ea4f01;
          color: black;
          opacity: 0;
        }
        .glitch-container:hover .glitch-text::before {
          left: 2px;
          text-shadow: -1px 0 #00FFFF;
          animation: glitch-anim-1 2s infinite linear alternate-reverse;
          opacity: 1;
          background: transparent;
          color: #ea4f01;
        }
        .glitch-container:hover .glitch-text::after {
          left: -2px;
          text-shadow: 1px 0 #9D00FF;
          animation: glitch-anim-2 3s infinite linear alternate-reverse;
          opacity: 1;
          background: transparent;
          color: #ea4f01;
        }
        @keyframes glitch-anim-1 {
          0% { clip: rect(20px, 9999px, 85px, 0); }
          20% { clip: rect(5px, 9999px, 45px, 0); }
          40% { clip: rect(60px, 9999px, 15px, 0); }
          60% { clip: rect(35px, 9999px, 90px, 0); }
          80% { clip: rect(80px, 9999px, 55px, 0); }
          100% { clip: rect(10px, 9999px, 30px, 0); }
        }
        @keyframes glitch-anim-2 {
          0% { clip: rect(15px, 9999px, 50px, 0); }
          20% { clip: rect(80px, 9999px, 20px, 0); }
          40% { clip: rect(30px, 9999px, 75px, 0); }
          60% { clip: rect(55px, 9999px, 10px, 0); }
          80% { clip: rect(95px, 9999px, 60px, 0); }
          100% { clip: rect(25px, 9999px, 85px, 0); }
        }
      `}</style>
    </main>
  )
}