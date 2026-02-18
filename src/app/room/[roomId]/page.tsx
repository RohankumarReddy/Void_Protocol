"use client"

import { useUsername } from "@/hooks/use-username"
import { client } from "@/lib/client"
import { useRealtime } from "@/lib/realtime-client"
import { useMutation, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

// --- UTILS ---

// deterministic hash generation to prevent hydration mismatch
const getStableHash = (seed: string) => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return "0x" + Math.abs(hash).toString(16).toUpperCase().padStart(8, "0")
}

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
  const [entermsg , setentermsg ] =useState(false) 
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [copyStatus, setCopyStatus] = useState("ENCRYPT_LINK")
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  
  // Hydration safe random initialization
  const [mountHash, setMountHash] = useState("INITIALIZING...")
  useEffect(() => {
    setMountHash("SHA-256: " + Math.random().toString(16).slice(2, 10).toUpperCase())
  }, [])

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

  // --- AUTO SCROLL LOGIC ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
    <main className="relative flex flex-col h-screen max-h-screen overflow-hidden bg-[#02040a] text-slate-300 font-mono tracking-tight selection:bg-[#00FFFF] selection:text-black">
      
      {/* --- CSS BACKGROUNDS (Safe) --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        .scanline {
          background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
          background-size: 100% 4px;
        }
        .grid-bg {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(30, 62, 98, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(30, 62, 98, 0.1) 1px, transparent 1px);
        }
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #1E3E62; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #00FFFF; }
      `}} />

      {/* --- VISUAL LAYERS --- */}
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#050505]/50 to-[#050505] pointer-events-none z-0" />
      <div className="absolute inset-0 scanline pointer-events-none z-50 opacity-10 pointer-events-none" />

      {/* --- HEADER --- */}
      <header className="relative z-30 p-4 lg:p-6 pb-2">
        <div className="grid grid-cols-12 gap-4 auto-rows-[80px]">
          
          {/* Main Info Module */}
          <div className="col-span-12 md:col-span-8 relative group overflow-hidden bg-[#0a0f18]/80 backdrop-blur-md border border-[#1E3E62]/50 rounded-sm hover:border-[#00FFFF]/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.1)] transition-all duration-300 mt-[-8]">
            {/* Decoration Corner */}
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00FFFF] opacity-30 group-hover:opacity-100 transition-opacity" />
            
            <div className="h-full p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-[#00FFFF] uppercase tracking-widest font-bold">
                  Target_Protocol_v2.0
                </span>
                <span className="text-[10px] text-[#00FFFF] opacity-70 font-mono">
                  {mountHash}
                </span>
              </div>
              
              <div className="flex items-end justify-between">
                 <div>
                    <h1 className="text-2xl text-red-800 hover:text-shadow-red-700 transition-colors duration-200 font-bold tracking-tighter truncate max-w-[200px] md:max-w-md">
                      {/* Fixed: Improved contrast for the second half of the ID */}
                      {roomId.slice(0, 8)}<span className="text-red-800 hover:text-shadow-red-700 transition-colors duration-200 ">{roomId.slice(8)}</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] uppercase text-green-500">Live Connection</span>
                    </div>
                 </div>
                 
                 <button 
                   onClick={copyLink}
                   className="group/btn relative px-4  py-2.5 overflow-hidden bg-[#1E3E62]/20 border border-[#1E3E62] hover:border-[#00FFFF] hover:bg-[#00FFFF]/10 transition-all cursor-pointer"
                 >
                    {/* Fixed: Text color flow */}
                    <span className="text-xs font-bold text-[#00FFFF] group-hover/btn:text-white uppercase tracking-wider relative z-10 transition-colors duration-200">
                      {copyStatus === "ENCRYPT_LINK" ? "Copy Uplink" : "Link Secured"}
                    </span>
                 </button>
              </div>
            </div>
          </div>

          {/* TTL Monitor */}
          <div className="col-span-6 md:col-span-2 relative bg-[#0a0f18]/80 backdrop-blur-md border border-[#1E3E62]/50 rounded-sm p-4 flex flex-col justify-between group hover:border-purple-500/50 transition-colors mt-[-8]">
             <span className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">
               TTL_Timer
             </span>
             <div className="text-right">
                <div className="text-3xl font-black text-white tabular-nums tracking-tighter leading-none">
                  {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : "--:--"}
                </div>
                <div className="text-[9px] text-slate-500 uppercase mt-1">
                  Auto-Purge
                </div>
             </div>
             <div className="absolute bottom-0 left-0 h-1 bg-purple-600 transition-all duration-1000" style={{ width: `${Math.min(((timeRemaining || 0) / 300) * 100, 100)}%`}} />
          </div>

          {/* Destruct Button */}
          <div className="col-span-6 md:col-span-2">
            <button
              onClick={() => destroyRoom()}
              className="w-full h-full relative group bg-red-950/20 backdrop-blur-md border border-red-900/50 hover:bg-red-900/40 hover:border-red-500 transition-all duration-300 flex flex-col items-center justify-center gap-2 overflow-hidden rounded-sm"
            >
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,0,0,0.05)_10px,rgba(255,0,0,0.05)_20px)] opacity-50 mt-[-8]" />
              <span className="text-red-500 group-hover:text-red-400 font-bold tracking-[0.2em] text-xs uppercase z-10">
                Purge
              </span>
              <div className="w-16 h-px bg-red-800 group-hover:w-24 group-hover:bg-red-500 transition-all z-10" />
            </button>
          </div>

        </div>
      </header>

      {/* --- MESSAGES --- */}
      <div className="relative z-20 flex-1 overflow-y-auto p-4 space-y-6">
        {messages?.messages.map((msg) => {
          const isMe = msg.sender === username
          const msgHash = getStableHash(msg.id)

          return (
            <div
              key={msg.id}
              className={`flex w-full group ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`
                  relative max-w-[85%] md:max-w-[60%] p-4 rounded-sm border backdrop-blur-md transition-all duration-300
                  ${isMe 
                    ? "bg-[#0a0f18]/90 border-[#00FFFF]/30 hover:border-[#00FFFF]/60 text-right" 
                    : "bg-[#0e1520]/90 border-[#1E3E62]/30 hover:border-[#9D00FF]/50 text-left"
                  }
                `}
              > 
                {/* Decorative bits */}
                <div className={`absolute top-0 w-3 h-3 border-t border-${isMe ? "r" : "l"} ${isMe ? "border-[#00FFFF]" : "border-[#9D00FF]"} opacity-50`} />
                <div className={`absolute bottom-0 w-3 h-3 border-b border-${isMe ? "l" : "r"} ${isMe ? "border-[#00FFFF]" : "border-[#9D00FF]"} opacity-50`} />

                <div className={`flex items-center gap-3 mb-2 text-[10px] font-mono tracking-wider ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <span className={`${isMe ? "text-[#00FFFF]" : "text-[#9D00FF]"} font-bold`}>
                     {isMe ? "OPERATOR" : msg.sender.toUpperCase()}
                  </span>
                  <span className="text-slate-600">::</span>
                  <span className="text-slate-500 opacity-60">{msgHash}</span>
                </div>

                <p className="text-sm md:text-base text-slate-200 leading-relaxed font-light break-words">
                  {msg.text}
                </p>

                <div className={`mt-3 text-[9px] text-slate-500 font-mono flex items-center gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                  <span>T-{format(msg.timestamp, "HH:mm:ss")}</span>
                  <div className={`w-1 h-1 rounded-full ${isMe ? "bg-[#00FFFF]" : "bg-[#9D00FF]"} opacity-50`} />
                </div>
              </div>
            </div>
          )
        })}
        {/* Invisible element for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* --- INPUT --- */}
      <div className="relative z-30 p-4 border-t border-[#1E3E62]/30 bg-[#02040a]/90 backdrop-blur-xl">
        <div className="max-w-full relative group">
           {/* Animated Border Gradient */}
           <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00FFFF] to-[#9D00FF] opacity-20 group-hover:opacity-50 blur transition duration-500" />
           
           <div className="relative flex items-stretch bg-black rounded-sm overflow-hidden border border-[#1E3E62]/50">
             <div className="w-10 bg-[#0a0f18] flex items-center justify-center border-r border-[#1E3E62]/50">
               <span className="text-[#00FFFF] animate-pulse">›</span>
             </div>
             
             <input
               ref={inputRef}
               type="text"
               value={input}
               onKeyDown={(e) => {
                 if (e.key === "Enter" && input.trim()) {
                   sendMessage({ text: input })
                   inputRef.current?.focus()
                 }
               }}
               onChange={(e) => setInput(e.target.value)}
               placeholder="ENTER_PAYLOAD..."
               className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none font-mono"
               spellCheck={false}
               autoComplete="off"
             />

             <button
               onClick={() => {
                 sendMessage({ text: input })
                 inputRef.current?.focus()
               }}
               disabled={!input.trim() || isPending}
               className="px-6 bg-[#0a0f18] text-[#00FFFF] text-xs font-bold uppercase tracking-widest hover:bg-[#00FFFF] hover:text-black transition-all border-l border-[#1E3E62]/50 disabled:opacity-90 disabled:hover:bg-[#0a0f18] disabled:hover:text-[#00FFFF]"
             >
               {isPending ? "TX..." : "SEND"}
             </button>
           </div>
        </div>
        
        {/* Footer info */}
        <div className="flex justify-between items-center mt-2 px-1">
           <span className="text-[8px] text-[#00FFFF] uppercase tracking-[0.2em]">Secure Connection Established</span>
           <span className="text-[8px] text-[#00FFFF]  font-mono">LATENCY: &lt;12ms</span>
        </div>
      </div>

    </main>
  )
}

export default Page