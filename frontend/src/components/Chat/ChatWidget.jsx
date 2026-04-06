import { useContext, useEffect, useRef, useState } from "react"
import axios from "axios"
import { toast } from "react-hot-toast"
import { StoreContext } from "../../context/StoreContext"
import "./ChatWidget.css"

const WELCOME =
  "Hi! I’m Tomato Assistant — I can help with the menu, prices, your orders, and how to leave a review after delivery. What do you need?"

const ChatWidget = ({ setShowLogin }) => {
  const { token, url } = useContext(StoreContext)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setMessages((prev) => {
      if (prev.length > 0) return prev
      return [{ role: "assistant", content: WELCOME }]
    })
  }, [open])

  useEffect(() => {
    const onExternalOpen = () => setOpen(true)
    window.addEventListener("tomato:open-chat", onExternalOpen)
    return () => window.removeEventListener("tomato:open-chat", onExternalOpen)
  }, [])

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, loading, open])

  const sendMessage = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    if (!token) {
      toast.error("Please sign in to chat with Tomato Assistant")
      setShowLogin?.(true)
      return
    }

    const userMsg = { role: "user", content: text }
    setInput("")
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }))

      const { data } = await axios.post(
        `${url}/api/chat/message`,
        { message: text, history },
        { headers: { token } }
      )

      if (!data.success) {
        toast.error(data.message || "Could not send your message")
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message || "Something went wrong. Please try again in a moment."
          }
        ])
        return
      }

      const reply = data.reply || ""
      setMessages((prev) => [...prev, { role: "assistant", content: reply }])
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Could not reach the server. Check that the backend is running and GEMINI_API_KEY is set."
      toast.error(msg)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, we couldn’t get a response. Please try again later." }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-widget-root">
      {open && (
        <div className="chat-widget-panel" role="dialog" aria-label="Tomato Assistant chat">
          <div className="chat-widget-header">
            <div>
              <h2>Tomato Assistant</h2>
              <span>Menu · Orders · Complaints</span>
            </div>
            <button
              type="button"
              className="chat-widget-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="chat-widget-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`chat-widget-bubble ${m.role === "user" ? "user" : "assistant"}`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="chat-widget-typing" aria-live="polite">
                <span>Tomato is typing</span>
                <span className="chat-widget-typing-dots" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}
          </div>

          {!token && (
            <p className="chat-widget-login-hint">
              Sign in to use the assistant.{" "}
              <button type="button" onClick={() => setShowLogin?.(true)}>
                Sign in
              </button>
            </p>
          )}

          <form className="chat-widget-form" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder={token ? "Type a message…" : "Sign in to send a message…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              maxLength={2000}
              autoComplete="off"
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={`chat-widget-toggle${open ? " chat-widget-toggle--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Collapse Tomato Assistant" : "Open Tomato Assistant"}
      >
        {open ? (
          <svg
            className="chat-widget-toggle-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <span className="chat-widget-toggle-content">
            <span className="chat-widget-toggle-ring" aria-hidden />
            <svg
              className="chat-widget-toggle-icon chat-widget-toggle-icon--chat"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 7.5 7.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                stroke="currentColor"
                strokeWidth="1.65"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="11.5" r="1.15" fill="currentColor" />
              <circle cx="12" cy="11.5" r="1.15" fill="currentColor" />
              <circle cx="15" cy="11.5" r="1.15" fill="currentColor" />
            </svg>
          </span>
        )}
      </button>
    </div>
  )
}

export default ChatWidget
