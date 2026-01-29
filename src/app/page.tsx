"use client"

import { useUsername } from "@/hooks/use-username"
import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

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
    <span className={display !== text ? "text-[#9D00FF] bg-black/50 px-1 inline-block" : ""}>
      {display}
    </span>
  )
}

// --- COMPONENTS ---

// New: A decorative corner bracket for that technical feel
const CornerBrackets = () => (
  <>
    <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-[#00FFFF] opacity-50" />
    <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-[#00FFFF] opacity-50" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-[#00FFFF] opacity-50" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-[#00FFFF] opacity-50" />
  </>
)

const StatusBadge = ({ label, active = true, color = "bg-[#00FFFF]" }: { label: string, active?: boolean, color?: string }) => (
  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/50 border border-white/10 px-2 py-1 bg-black/40">
    <div className={`w-1.5 h-1.5 ${active ? `${color} animate-pulse` : 'bg-gray-800'}`} />
    {label}
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
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-[#050505] font-mono selection:bg-[#9D00FF] selection:text-white text-[#00FFFF] overflow-hidden">
      
      {/* --- BACKGROUND LAYERS --- */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute inset-0 void-gradient z-0 pointer-events-none" />
      <div className="absolute inset-0 digital-grain z-10 pointer-events-none opacity-30" />
      <div className="absolute inset-0 crt-scanline z-50 opacity-20 pointer-events-none mix-blend-overlay" />

      {/* --- MAIN TERMINAL FRAME --- */}
      <div className="relative z-20 w-full max-w-lg">
        
        {/* TOP STATUS BAR */}
        <div className="flex justify-between items-end mb-2 px-1">
            <span className="text-[10px] text-[#9D00FF]/80 tracking-[0.2em] uppercase">
                SECURE_CONNECTION_ESTABLISHED
            </span>
            <span className="text-[10px] text-white/20 font-mono">
                {hash}
            </span>
        </div>

        {/* CONTAINER */}
        <div className="relative border border-[#000080] bg-[#050505]/90 backdrop-blur-sm shadow-[0_0_30px_-5px_rgba(157,0,255,0.15)]">
          <CornerBrackets />
          
          {/* HEADER SECTION */}
          <div className="border-b border-[#000080] bg-white/[0.02] p-6 pb-4">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h1 className="text-4xl font-bold text-white tracking-tighter mb-1 relative inline-block">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#983b0c] to-[#162519]">VOID</span>_PROTOCOL
                  </h1>
                  <div className="text-[#00FFFF]/60 text-xs uppercase tracking-[0.2em] flex items-center gap-2 mt-1">
                    <span className="inline-block w-2 h-0.5 bg-[#ea4f01]"></span>
                    <RedactedLabel text="Encrypted Channel 01" chance={0.1} />
                  </div>
               </div>
               <div className="flex flex-col gap-1">
                 <StatusBadge label="NET" active />
                 <StatusBadge label="ENC" active color="bg-[#9D00FF]" />
               </div>
            </div>
          </div>

          {/* ALERTS SECTION (Conditional) */}
          {(wasDestroyed || error) && (
            <div className="border-b border-[#000080] bg-[#ea4f01]/5 p-4 relative overflow-hidden group">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ea4f01] group-hover:w-1.5 transition-all" />
               <div className="pl-3">
                {wasDestroyed && (
                    <>
                    <p className="text-[#ea4f01] text-sm font-bold animate-pulse tracking-widest uppercase">Room Destroyed</p>
                    <p className="text-[#ea4f01]/70 text-xs mt-1">Data purge complete. History deleted.</p>
                    </>
                )}
                {error === "room-not-found" && (
                    <>
                    <p className="text-[#ea4f01] text-sm font-bold tracking-widest uppercase">Signal Lost</p>
                    <p className="text-[#ea4f01]/70 text-xs mt-1">Target coordinates invalid or expired.</p>
                    </>
                )}
                {error === "room-full" && (
                    <>
                    <p className="text-[#ea4f01] text-sm font-bold tracking-widest uppercase">Capacity Reached</p>
                    <p className="text-[#ea4f01]/70 text-xs mt-1">Protocol rejects additional connections.</p>
                    </>
                )}
               </div>
            </div>
          )}

          {/* MAIN CONTENT AREA */}
          <div className="p-6 space-y-6">
            
            {/* Identity Module */}
            <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest block pl-1">
                    Subject Identity
                </label>
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFFF] to-[#9D00FF] rounded-sm opacity-20 group-hover:opacity-40 transition duration-500 blur-sm"></div>
                    <div className="relative bg-black border border-[#000080] p-4 flex items-center justify-between">
                        <span className="text-lg text-white font-mono tracking-tight">
                            {username || <span className="animate-pulse opacity-50">INITIALIZING...</span>}
                        </span>
                        <div className="h-2 w-2 bg-[#00FFFF] animate-pulse rounded-full shadow-[0_0_10px_#00FFFF]" />
                    </div>
                </div>
            </div>

            {/* Action Module */}
            <div className="pt-2">
                <button
                onClick={() => createRoom()}
                disabled={isPending}
                className="group relative w-full overflow-hidden border border-[#00FFFF]/30 bg-[#00FFFF]/5 p-4 hover:border-[#00FFFF] hover:bg-[#00FFFF]/10 transition-all duration-300"
                >
                {/* Button Scanline */}
                <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,255,255,0.1)_50%,transparent_100%)] translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 ease-in-out" />
                
                <div className="relative flex items-center justify-center gap-3">
                    {isPending ? (
                         <span className="text-[#00FFFF] font-bold tracking-[0.3em] text-sm animate-pulse">ESTABLISHING...</span>
                    ) : (
                        <>
                        <span className="w-1.5 h-1.5 bg-[#ea4f01] group-hover:bg-[#00FFFF] transition-colors" />
                        <span className="text-[#00FFFF] group-hover:text-white font-bold tracking-[0.3em] text-sm transition-colors">
                            INITIATE_PROTOCOL
                        </span>
                        <span className="w-1.5 h-1.5 bg-[#ea4f01] group-hover:bg-[#00FFFF] transition-colors" />
                        </>
                    )}
                </div>
                </button>
                <div className="flex justify-between mt-2 px-1 opacity-50">
                    <span className="text-[8px] uppercase">Encryption: AES-256</span>
                    <span className="text-[8px] uppercase">Latency: &lt;12ms</span>
                </div>
            </div>

          </div>
        </div>

        {/* FOOTER DECORATION */}
        <div className="mt-4 flex justify-center opacity-30">
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#00FFFF] to-transparent" />
        </div>
      </div>

      {/* --- GLOBAL STYLES (UPDATED) --- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;600&display=swap');
        
        body { 
            font-family: 'Fira Code', monospace; 
            letter-spacing: -0.5px;
            background-color: #050505;
        }

        .bg-grid-pattern {
            background-size: 40px 40px;
            background-image: linear-gradient(to right, #000080 1px, transparent 1px),
                              linear-gradient(to bottom, #000080 1px, transparent 1px);
        }

        .void-gradient {
          background: radial-gradient(circle at 50% 0%, #120124 0%, transparent 60%);
        }

        .digital-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
        }
        
        .crt-scanline {
          background: linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%),
                      linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06));
          background-size: 100% 4px, 6px 100%;
        }
      `}</style>
    </main>
  )
}