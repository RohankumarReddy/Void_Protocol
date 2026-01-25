"use client"

import { useUsername } from "@/hooks/use-username"
import { client } from "@/lib/client"
import { useRealtime } from "@/lib/realtime-client"
import { useMutation, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

// --- CRYPTO-AESTHETIC UTILITIES ---
// Safe hash generator after mount
const useHash = () => {
  const [hash, setHash] = useState("SHA-256: 00000000")
  useEffect(() => {
    setHash("SHA-256: " + Math.random().toString(16).substr(2, 8).toUpperCase())
  }, [])
  return hash
}

// Randomly redact text (safe, starts only after mount)
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
    <span className={display !== text ? "text-[#9D00FF] bg-black/50 px-1" : ""}>
      {display}
    </span>
  )
}

// Format seconds safely
function formatTimeRemaining(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

const Page = () => {
  const params = useParams()
  const roomId = params.roomId as string
  const router = useRouter()
  const { username } = useUsername()
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [copyStatus, setCopyStatus] = useState("ENCRYPT_LINK")
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({ query: { roomId } })
      return res.data
    },
  })

  useEffect(() => {
    if (ttlData?.ttl !== undefined) setTimeRemaining(ttlData.ttl)
  }, [ttlData])

  useEffect(() => {
    if (timeRemaining === null || timeRemaining < 0) return
    if (timeRemaining === 0) {
      router.push("/?destroyed=true")
      return
    }
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timeRemaining, router])

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.get({ query: { roomId } })
      return res.data
    },
  })

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await client.messages.post({ sender: username, text }, { query: { roomId } })
      setInput("")
    },
  })

  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy"],
    onData: ({ event }) => {
      if (event === "chat.message") refetch()
      if (event === "chat.destroy") router.push("/?destroyed=true")
    },
  })

  const { mutate: destroyRoom } = useMutation({
    mutationFn: async () => {
      await client.room.delete(null, { query: { roomId } })
    },
  })

  const copyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopyStatus("LINK_SECURED")
    setTimeout(() => setCopyStatus("ENCRYPT_LINK"), 2000)
  }

  return (
    <main className="relative flex flex-col h-screen max-h-screen overflow-hidden bg-[#050505] text-[#1E3E62] selection:bg-[#9D00FF] selection:text-white font-mono tracking-tighter">
      
      {/* --- COBALT-VOID CSS ENGINE --- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;600&display=swap');
        body { font-family: 'Fira Code', monospace; letter-spacing: -0.5px; }

        .void-gradient { background: radial-gradient(circle at top right, #120124 0%, transparent 40%), radial-gradient(circle at bottom left, #120124 0%, transparent 40%); }
        .digital-grain { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E"); }
        .crt-scanline { background: linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06)); background-size: 100% 3px, 3px 100%; pointer-events: none; }

        .bento-module { border: 1px solid #000080; background: rgba(5,5,5,0.6); backdrop-filter: blur(4px); transition: all 0.2s cubic-bezier(0.4,0,0.2,1); position: relative; }
        .bento-module:hover { border-color: #9D00FF; background: rgba(5,5,5,0.8); box-shadow: 2px 2px 0px #9D00FF; }
        .bento-module:active { transform: translateX(1px); }

        .text-burn { text-shadow: 0 0 8px rgba(255,255,255,0.4); }
        .glitch-text:hover { animation: text-shake 0.3s infinite; color: #00FFFF; }
        @keyframes text-shake { 0%{transform:skewX(-15deg);} 5%{transform:skewX(15deg);} 10%{transform:skewX(-15deg);} 15%{transform:skewX(15deg);} 20%{transform:skewX(0deg);} 100%{transform:skewX(0deg);} }

        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:#050505;border-left:1px solid #000080} ::-webkit-scrollbar-thumb{background:#1E3E62} ::-webkit-scrollbar-thumb:hover{background:#9D00FF}
      `}</style>

      {/* --- VISUAL OVERLAYS --- */}
      <div className="absolute inset-0 void-gradient z-0 pointer-events-none" />
      <div className="absolute inset-0 digital-grain z-10 pointer-events-none opacity-50" />
      <div className="absolute inset-0 crt-scanline z-50 opacity-50 mix-blend-overlay" />

      {/* --- HEADER --- */}
      <header className="relative z-30 p-4 border-b border-[#000080] bg-[#050505]/90">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 md:col-span-5 bento-module group p-3 flex flex-col justify-between h-20 cursor-default">
            <span className="text-[9px] text-[#000080] font-bold group-hover:text-[#9D00FF] transition-colors">{useHash()}</span>
            <div>
              <span className="text-xs text-[#1E3E62] block mb-1">TARGET_PROTOCOL</span>
              <div className="flex items-center justify-between">
                <h1 className="text-[#FFFFFF] text-burn text-lg font-bold truncate tracking-widest">{roomId.slice(0,12)}</h1>
                <button onClick={copyLink} className="text-[10px] text-[#00FFFF] hover:underline decoration-[#9D00FF] uppercase">[{copyStatus}]</button>
              </div>
            </div>
          </div>
          <div className="col-span-4 md:col-span-3 bento-module p-3 flex flex-col justify-between h-20">
            <span className="text-[9px] text-[#000080] font-bold">TTL_MONITOR</span>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-bold leading-none ${timeRemaining && timeRemaining<60 ? 'text-[#9D00FF] animate-pulse':'text-[#FFFFFF] text-burn'}`}>
                {timeRemaining!==null ? formatTimeRemaining(timeRemaining) : "--:--"}
              </span>
              <span className="text-[9px] text-[#1E3E62] mb-1">SEC</span>
            </div>
          </div>
          <div className="col-span-12 md:col-span-4">
            <button onClick={() => destroyRoom()} className="w-full h-20 bento-module bg-[#120124]/50 hover:bg-[#9D00FF]/10 text-red-500/70 hover:text-[#FFFFFF] flex items-center justify-center gap-3 transition-all group">
              <span className="w-2 h-2 bg-red-500 rounded-none group-hover:animate-ping" />
              <span className="tracking-[0.2em] text-xs font-bold glitch-text">INITIATE_PURGE</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- MESSAGE STREAM --- */}
      <div className="relative z-20 flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {messages?.messages.length===0 && (
          <div className="flex items-center justify-center h-full opacity-40">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 border border-[#000080] mx-auto flex items-center justify-center text-[#9D00FF] animate-spin">✣</div>
              <p className="text-[#1E3E62] text-xs tracking-widest"><RedactedLabel text="SIGNAL_NOT_FOUND"/></p>
            </div>
          </div>
        )}
        {messages?.messages.map(msg => {
          const isMe = msg.sender===username
          const msgHash = useHash()
          return (
            <div key={msg.id} className={`flex w-full ${isMe?"justify-end":"justify-start"}`}>
              <div className={`max-w-[85%] md:max-w-[60%] bento-module p-3 ${isMe?"border-r-4 border-r-[#00FFFF]":"border-l-4 border-l-[#9D00FF]"}`}>
                <div className="flex items-center gap-4 mb-2 border-b border-[#000080]/30 pb-1">
                  <span className="text-[8px] text-[#1E3E62] font-mono">{msgHash}</span>
                  <div className="flex-1"/>
                  <span className={`text-[10px] font-bold tracking-wider ${isMe?"text-[#00FFFF]":"text-[#9D00FF]"}`}>
                    {isMe ? "OPERATOR" : msg.sender.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-[#FFFFFF] leading-relaxed font-light opacity-90 break-all">{msg.text}</p>
                <div className="mt-2 text-right">
                  <span className="text-[8px] text-[#1E3E62]">T-MINUS {format(msg.timestamp,"HH:mm:ss")}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* --- INPUT DECK --- */}
      <div className="relative z-30 p-4 bg-[#050505] border-t border-[#000080]">
        <div className="bento-module flex items-stretch h-14 p-0 overflow-hidden focus-within:border-[#00FFFF] focus-within:shadow-[0_0_15px_rgba(0,255,255,0.15)]">
          <div className="w-12 bg-[#120124] flex items-center justify-center border-r border-[#000080]">
            <span className="text-[#9D00FF] text-xl animate-pulse">»</span>
          </div>
          <input
            autoFocus
            ref={inputRef}
            type="text"
            value={input}
            onKeyDown={(e) => {
              if (e.key==="Enter" && input.trim()) {
                sendMessage({ text: input })
                inputRef.current?.focus()
              }
            }}
            placeholder="ENTER_ENCRYPTED_PAYLOAD..."
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-[#FFFFFF] placeholder-[#1E3E62] px-4 text-sm caret-[#00FFFF]"
            spellCheck={false}
          />
          <button
            onClick={() => {sendMessage({text:input}); inputRef.current?.focus()}}
            disabled={!input.trim() || isPending}
            className="px-6 bg-[#000080]/20 hover:bg-[#9D00FF] text-[#00FFFF] hover:text-[#FFFFFF] text-xs font-bold tracking-[0.2em] transition-all disabled:opacity-30 disabled:cursor-not-allowed border-l border-[#000080]"
          >
            TX_DATA
          </button>
        </div>
        <div className="flex justify-between mt-3 px-1 text-[8px] text-[#1E3E62] uppercase tracking-widest font-bold">
          <span>UPLINK: <RedactedLabel text="UNSTABLE" chance={0.3}/></span>
          <span>LATENCY: 42ms</span>
          <span><RedactedLabel text="AUTHORIZED_ONLY" chance={0.1}/></span>
        </div>
      </div>
    </main>
  )
}

export default Page
