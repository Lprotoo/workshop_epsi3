import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { sendChat } from '../services/api'

export default function Chat() {
  const { t, locale } = useLanguage()
  const welcome = useMemo(
    () => ({ role: 'assistant', content: t('chat.welcome') }),
    [t],
  )
  const [messages, setMessages] = useState([welcome])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    setMessages((current) => (current.length <= 1 ? [welcome] : current))
  }, [welcome])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, sending])

  async function handleSend(event) {
    event.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)

    try {
      const reply = await sendChat(
        nextMessages
          .filter((item) => item.role !== 'assistant' || item.content !== welcome.content)
          .slice(-8)
          .map((item) => ({
            role: item.role === 'assistant' ? 'assistant' : 'user',
            content: item.content,
          })),
        locale,
      )
      setMessages((current) => [...current, { role: 'assistant', content: reply }])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: t('chat.error', { message: error.message }),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-hud-accent">{t('chat.kicker')}</p>
          <h1 className="mt-1 text-3xl font-semibold">{t('chat.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-hud-muted">
            {t('chat.intro')}
            <Link to="/questionnaire" className="text-hud-accent hover:underline">
              {t('chat.introLink')}
            </Link>
            .
          </p>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-hud-border bg-hud-panel p-4"
      >
        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}`}
            className={`max-w-[85%] rounded-lg border px-4 py-3 text-sm leading-6 ${
              message.role === 'user'
                ? 'ml-auto border-hud-accent/40 bg-hud-accent/10'
                : 'border-hud-border bg-hud-raised text-hud-muted'
            }`}
          >
            <p className="mb-1 font-mono text-[10px] tracking-[0.16em] text-hud-accent">
              {message.role === 'user' ? t('chat.crew') : t('chat.assistant')}
            </p>
            <p className="whitespace-pre-wrap text-white">{message.content}</p>
          </article>
        ))}
        {sending ? (
          <p className="font-mono text-xs tracking-[0.16em] text-hud-muted">{t('chat.typing')}</p>
        ) : null}
      </div>

      <form className="mt-4 flex gap-3" onSubmit={handleSend}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          rows={2}
          placeholder={t('chat.placeholder')}
          className="min-h-[52px] flex-1 resize-none rounded-lg border border-hud-border bg-hud-bg px-3 py-2 text-sm text-white outline-none focus:border-hud-accent"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-lg border border-hud-accent/50 bg-hud-accent/20 px-5 text-sm font-medium hover:bg-hud-accent/30 disabled:opacity-40"
        >
          {t('chat.send')}
        </button>
      </form>
    </div>
  )
}
