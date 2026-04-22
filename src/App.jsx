import React, { useState, useMemo, useEffect } from "react";

// Iconify web-component (Noto Emoji SVG)
if (typeof window !== "undefined" && !customElements.get("iconify-icon")) {
  const s = document.createElement("script");
  s.src = "https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js";
  document.head.appendChild(s);
}

// Google Identity Services
if (typeof window !== "undefined") {
  const s = document.createElement("script");
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────
// AUTH 設定
// 取得 Client ID：console.cloud.google.com → 憑證 → OAuth 用戶端 ID
// ALLOWED_EMAIL：只有這個 email 可以登入
// ─────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "你的Client-ID.apps.googleusercontent.com";
const ALLOWED_EMAIL    = import.meta.env.VITE_ALLOWED_EMAIL    || "你的email@gmail.com";

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────
const MOCK_EVENTS = [
  {
    id: 1,
    title: "跟 Kenji 的咖啡聊聊",
    type: "meeting",
    date: "2026-04-24",
    start: "10:30",
    end: "11:30",
    location: "Fika Fika Café．赤峰店",
    with: "Kenji",
    note: "帶上上週的設計稿！",
  },
  {
    id: 2,
    title: "AI 與人文跨域對談",
    type: "lecture",
    date: "2026-04-24",
    start: "14:00",
    end: "16:30",
    location: "台大博雅教學館 101",
    with: "沈芯菱 × 朱宥勳",
    note: "提早 20 分鐘到 ☁",
  },
  {
    id: 3,
    title: "家庭晚餐日",
    type: "dinner",
    date: "2026-04-26",
    start: "18:30",
    end: "21:00",
    location: "家裡",
    with: "爸媽 × 阿姨",
    note: "阿姨從高雄來，買伴手禮～",
  },
  {
    id: 4,
    title: "產品週會",
    type: "meeting",
    date: "2026-04-28",
    start: "09:30",
    end: "10:30",
    location: "線上．Google Meet",
    with: "Product Team",
    note: "Q2 roadmap 初稿",
  },
  {
    id: 5,
    title: "Type Design Workshop",
    type: "lecture",
    date: "2026-04-30",
    start: "19:00",
    end: "21:30",
    location: "justfont 字體工作室",
    with: "曾國榕老師",
    note: "帶筆電＆描圖紙 ✎",
  },
  {
    id: 6,
    title: "阿翔的慶生晚餐 ♡",
    type: "dinner",
    date: "2026-05-03",
    start: "19:30",
    end: "22:00",
    location: "Orchid 蘭．大直",
    with: "阿翔 × 怡君",
    note: "記得買禮物！已訂位 3 人",
  },
  {
    id: 7,
    title: "設計系返校分享",
    type: "lecture",
    date: "2026-05-08",
    start: "15:00",
    end: "17:00",
    location: "實踐大學 B 棟",
    with: "設計系學弟妹",
    note: "20 分鐘 talk．講 portfolio",
  },
  {
    id: 8,
    title: "與 Linda 簡報",
    type: "meeting",
    date: "2026-05-12",
    start: "14:00",
    end: "15:30",
    location: "客戶辦公室．信義區",
    with: "Linda",
    note: "帶紙本提案 3 份",
  },
  {
    id: 9,
    title: "母親節家族聚餐",
    type: "dinner",
    date: "2026-05-10",
    start: "12:00",
    end: "14:30",
    location: "欣葉台菜．南西",
    with: "全家人 ♡",
    note: "康乃馨！8 人包廂",
  },
];

const TYPE_META = {
  lecture: {
    zh: "講座",
    emoji: "📖",
    bg: "#FFE8D6",
    bgSoft: "#FFF3E4",
    border: "#E8B896",
    ink: "#8A4A2B",
    tape: "#F4B88E",
  },
  meeting: {
    zh: "會議",
    emoji: "☕",
    bg: "#DDEBF4",
    bgSoft: "#EDF4FA",
    border: "#9EC0D8",
    ink: "#3E5F7D",
    tape: "#A8C8DF",
  },
  dinner: {
    zh: "聚餐",
    emoji: "🍡",
    bg: "#FCDDE4",
    bgSoft: "#FEEDF1",
    border: "#E8A8B8",
    ink: "#8A3D52",
    tape: "#F2B8C6",
  },
};

const MONTH_LABELS = {
  0: { en: "January", jp: "一月" },
  1: { en: "February", jp: "二月" },
  2: { en: "March", jp: "三月" },
  3: { en: "April", jp: "四月" },
  4: { en: "May", jp: "五月" },
  5: { en: "June", jp: "六月" },
  6: { en: "July", jp: "七月" },
  7: { en: "August", jp: "八月" },
  8: { en: "September", jp: "九月" },
  9: { en: "October", jp: "十月" },
  10: { en: "November", jp: "十一月" },
  11: { en: "December", jp: "十二月" },
};
const WEEKDAYS_ZH = ["一", "二", "三", "四", "五", "六", "日"];
const WEEKDAY_SHORT = ["日", "一", "二", "三", "四", "五", "六"];

const parseYMD = (s) => {
  if (!s || typeof s !== "string" || !s.includes("-")) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
const sameDay = (a, b) => {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
};

const tiltFor = (id) => {
  const seed = (id * 9301 + 49297) % 233280;
  return ((seed / 233280) - 0.5) * 2.6;
};


// ═════════════════════════════════════════════════════════════
// GOOGLE SHEETS API (via Google Apps Script)
// ═════════════════════════════════════════════════════════════
const GAS_URL = import.meta.env.VITE_GAS_URL;

async function gasRequest(payload) {
  if (!GAS_URL) throw new Error("請在 .env 設定 VITE_GAS_URL");
  // GAS Web App 用 GET + action param 避免 CORS preflight
  const url = new URL(GAS_URL);
  url.searchParams.set("action", payload.action);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("GAS 請求失敗：" + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// 讀取全部行程
async function sheetsGetAll() {
  const data = await gasRequest({ action: "getAll" });
  return (data.events || [])
    .filter(ev => ev.title) // 過濾掉完全空白的列
    .map(ev => ({
      ...ev,
      id: ev.id || String(Date.now()),
      // date 空白時補今天，避免後續 parseYMD 炸掉
      date: ev.date || new Date().toISOString().slice(0, 10),
    }));
}

// 新增行程
async function sheetsAdd(event) {
  const data = await gasRequest({ action: "add", event });
  return data.id; // GAS 回傳新 id
}

// 更新行程
async function sheetsUpdate(event) {
  await gasRequest({ action: "update", event });
}

// 刪除行程
async function sheetsDelete(id) {
  await gasRequest({ action: "delete", id: String(id) });
}

// ─────────────────────────────────────────────────────────────
// AI PARSING — 透過 GAS 呼叫 Gemini（Key 在後端，前端看不到）
// ─────────────────────────────────────────────────────────────
async function parseEventWithAI(rawText) {
  const data = await gasRequest({ action: "parseWithAI", text: rawText });
  if (!data.parsed) throw new Error("GAS 回傳格式異常");
  return data.parsed;
}
// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// NI — Noto Icon wrapper (renders Iconify web component)
// ─────────────────────────────────────────────────────────────
function NI({ icon, size = 18, style: extraStyle = {} }) {
  return (
    <iconify-icon
      icon={icon}
      width={size}
      height={size}
      style={{ display: "inline-flex", verticalAlign: "middle", flexShrink: 0, ...extraStyle }}
    />
  );
}

export default function App() {
  const [view, setView] = useState("schedule");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | lecture | meeting | dinner
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const [toast, setToast] = useState(null);

  // ── Google 登入狀態 ────────────────────────────────────────
  const [user, setUser] = useState(() => {
    // 記住登入狀態，重整不需要重新登入
    try {
      const saved = sessionStorage.getItem("schedule_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [authError, setAuthError] = useState(null);

  // ── 初始化 Google One Tap ──────────────────────────────────
  useEffect(() => {
    if (user) return; // 已登入就不需要初始化
    const timer = setInterval(() => {
      if (!window.google) return;
      clearInterval(timer);
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          try {
            // 解析 JWT token 取得使用者資訊
            const payload = JSON.parse(atob(response.credential.split(".")[1]));
            if (payload.email !== ALLOWED_EMAIL) {
              setAuthError("此帳號（" + payload.email + "）沒有存取權限");
              return;
            }
            const userInfo = { name: payload.name, email: payload.email, picture: payload.picture };
            sessionStorage.setItem("schedule_user", JSON.stringify(userInfo));
            setUser(userInfo);
            setAuthError(null);
          } catch (e) {
            setAuthError("登入失敗，請再試一次");
          }
        },
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        { theme: "outline", size: "large", text: "signin_with", shape: "pill", locale: "zh-TW" }
      );
    }, 200);
    return () => clearInterval(timer);
  }, [user]);

  const handleSignOut = () => {
    sessionStorage.removeItem("schedule_user");
    setUser(null);
    if (window.google) window.google.accounts.id.disableAutoSelect();
  };

  // ── 初始載入：從 Sheets 讀取所有行程（登入後才載入）──────────
  useEffect(() => {
    if (!user) return;
    sheetsGetAll()
      .then(data => setEvents(data))
      .catch(err => {
        console.error("載入失敗，使用示範資料", err);
        setSyncError("無法連線到試算表，目前顯示示範資料");
        setEvents(MOCK_EVENTS);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // ── 過濾後的行程 ─────────────────────────────────────────
  const filteredEvents = events.filter(ev => {
    const matchSearch = search.trim() === "" ||
      ev.title.toLowerCase().includes(search.trim().toLowerCase());
    const matchType = filterType === "all" || ev.type === filterType;
    return matchSearch && matchType;
  });

  // ── 未登入：顯示登入頁 ─────────────────────────────────────
  if (!user) {
    return <LoginPage authError={authError} />;
  }

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleAddEvent = async (newEvent) => {
    try {
      const newId = await sheetsAdd(newEvent);
      setEvents(prev => [...prev, { ...newEvent, id: newId }]);
      setPasteOpen(false);
      showToast(`✨ 「${newEvent.title}」已加入行程本`);
    } catch (err) {
      showToast(`❌ 新增失敗：${err.message}`);
    }
  };

  const handleUpdateEvent = async (updated) => {
    try {
      await sheetsUpdate(updated);
      setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
      setEditingEvent(null);
      showToast(`✎ 「${updated.title}」已更新`);
    } catch (err) {
      showToast(`❌ 更新失敗：${err.message}`);
    }
  };

  const handleDeleteEvent = async (eventToDelete) => {
    try {
      await sheetsDelete(eventToDelete.id);
      setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
      setDeletingEvent(null);
      showToast(`🗑 「${eventToDelete.title}」已從行程本撕下`);
    } catch (err) {
      showToast(`❌ 刪除失敗：${err.message}`);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        fontFamily: "var(--body-font)",
        color: "var(--ink)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&family=Zen+Kurenaido&family=Shippori+Mincho:wght@400;500;600&family=Kosugi+Maru&display=swap');

        :root {
          --paper: #FBF6EC;
          --paper-2: #F5EEDF;
          --cream: #FEFAF0;
          --pink: #FCDDE4;
          --pink-soft: #FEEDF1;
          --blue: #DDEBF4;
          --blue-soft: #EDF4FA;
          --peach: #FFE8D6;
          --mint: #D9EBDD;
          --lavender: #E6DCEE;
          --yellow: #FBEFB7;
          --yellow-soft: #FDF7D9;
          --ink: #4A3F36;
          --ink-soft: #7C6E61;
          --ink-mute: #A89C8F;
          --line: #E2D6C1;
          --accent: #D98B8B;

          --body-font: 'Klee One', 'Noto Sans TC', system-ui, sans-serif;
          --hand-font: 'Zen Kurenaido', 'Klee One', cursive;
          --title-font: 'Shippori Mincho', 'Klee One', serif;
          --label-font: 'Kosugi Maru', 'Klee One', sans-serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--paper); }

        .paper-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            repeating-linear-gradient(
              to bottom,
              transparent 0,
              transparent 31px,
              rgba(160, 140, 110, 0.12) 31px,
              rgba(160, 140, 110, 0.12) 32px
            ),
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='3'/><feColorMatrix values='0 0 0 0 0.4 0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0.12 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        }

        .punch-holes {
          position: fixed; left: 24px; top: 0; bottom: 0; z-index: 1;
          display: flex; flex-direction: column; justify-content: space-around;
          padding: 80px 0; pointer-events: none;
        }
        .punch-holes div {
          width: 14px; height: 14px; border-radius: 50%;
          background: radial-gradient(circle at 40% 40%, #D4C8B0 0%, #B8A890 100%);
          box-shadow: inset 1px 2px 3px rgba(0,0,0,0.25);
        }

        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.85) rotate(var(--tilt, 0deg)); }
          60%  { transform: scale(1.03) rotate(var(--tilt, 0deg)); }
          100% { opacity: 1; transform: scale(1) rotate(var(--tilt, 0deg)); }
        }
        @keyframes softFade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25%      { transform: rotate(-8deg); }
          75%      { transform: rotate(8deg); }
        }
        @keyframes spinBounce {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(180deg) scale(1.15); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40%            { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes toastSlide {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .pop  { animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .fade { animation: softFade 0.6s ease both; }

        .wavy-underline {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='6' viewBox='0 0 80 6'><path d='M0 3 Q 10 0 20 3 T 40 3 T 60 3 T 80 3' stroke='%23D98B8B' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>");
          background-repeat: repeat-x;
          background-position: left bottom;
          padding-bottom: 8px;
        }

        .btn-journal {
          font-family: var(--body-font);
          font-size: 14px; font-weight: 600;
          padding: 10px 20px;
          border: 1.5px solid var(--ink);
          background: var(--cream);
          color: var(--ink);
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 2px 2px 0 var(--ink);
        }
        .btn-journal:hover:not(:disabled) {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 var(--ink);
        }
        .btn-journal:active:not(:disabled) {
          transform: translate(2px, 2px);
          box-shadow: 0 0 0 var(--ink);
        }
        .btn-journal:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-pink  { background: var(--pink); }
        .btn-blue  { background: var(--blue); }
        .btn-peach { background: var(--peach); }

        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: var(--paper); }
        ::-webkit-scrollbar-thumb {
          background: var(--line); border-radius: 999px;
          border: 2px solid var(--paper);
        }

        html, body { overflow-x: hidden; }

        /* 手機版優化 */
        @media (max-width: 600px) {
          .cal-weekday { font-size: 10px !important; padding: 4px 2px !important; }
          .cal-cell-num { font-size: 13px !important; }
          .cal-event-chip { font-size: 9px !important; padding: 2px 3px !important; }
          .punch-holes { display: none; }
        }
      `}</style>

      <div className="paper-bg" />
      <div className="punch-holes">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} />)}
      </div>

      <DecorationDoodles />

      {/* 初始載入 */}
      {loading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "var(--paper)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 16, fontFamily: "var(--body-font)",
        }}>
          <div style={{ fontSize: 48, animation: "spinBounce 1.2s ease-in-out infinite" }}>
            <NI icon="noto:blossom" size={56} />
          </div>
          <div style={{ fontFamily: "var(--title-font)", fontSize: 22, color: "var(--ink)" }}>
            正在讀取行程本...
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                width: 10, height: 10, borderRadius: "50%",
                background: "var(--accent)",
                animation: "dotBounce 1.4s ease-in-out infinite",
                animationDelay: i * 0.16 + "s",
              }} />
            ))}
          </div>
        </div>
      )}

      {/* 同步錯誤提示 */}
      {syncError && (
        <div style={{
          position: "fixed", top: 16, left: "50%",
          transform: "translateX(-50%)",
          zIndex: 200, background: "var(--yellow)",
          border: "1.5px dashed var(--ink)", borderRadius: 999,
          padding: "10px 20px", fontSize: 13,
          fontFamily: "var(--hand-font)", color: "var(--ink)",
          boxShadow: "2px 2px 0 var(--ink-mute)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <NI icon="noto:warning" size={16} />
          {syncError}
          <button onClick={() => setSyncError(null)} style={{
            border: "none", background: "transparent",
            cursor: "pointer", fontSize: 14, color: "var(--ink-soft)",
            padding: "0 4px",
          }}>✕</button>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 2 }}>
        <Header
          view={view}
          setView={setView}
          onPaste={() => setPasteOpen(true)}
          eventCount={filteredEvents.length}
          user={user}
          onSignOut={handleSignOut}
          search={search}
          setSearch={setSearch}
          filterType={filterType}
          setFilterType={setFilterType}
        />

        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px 120px 80px" }}>
          {view === "schedule" ? (
            <ScheduleView
              events={filteredEvents}
              onEdit={setEditingEvent}
              onDelete={setDeletingEvent}
            />
          ) : (
            <CalendarView
              events={filteredEvents}
              onEdit={setEditingEvent}
              onDelete={setDeletingEvent}
            />
          )}
        </main>
      </div>

      {pasteOpen && (
        <AIPasteFlow
          onClose={() => setPasteOpen(false)}
          onConfirm={handleAddEvent}
        />
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onConfirm={handleUpdateEvent}
          onDelete={() => {
            setDeletingEvent(editingEvent);
            setEditingEvent(null);
          }}
        />
      )}

      {deletingEvent && (
        <DeleteConfirmModal
          event={deletingEvent}
          onClose={() => setDeletingEvent(null)}
          onConfirm={() => handleDeleteEvent(deletingEvent)}
        />
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            background: "var(--ink)",
            color: "var(--cream)",
            padding: "14px 24px",
            borderRadius: 999,
            fontSize: 14,
            fontFamily: "var(--body-font)",
            fontWeight: 600,
            boxShadow: "4px 4px 0 var(--accent)",
            border: "1.5px solid var(--ink)",
            animation: "toastSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGIN PAGE — 手帳風 Google 登入頁
// ─────────────────────────────────────────────────────────────
function LoginPage({ authError }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        fontFamily: "var(--body-font)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&family=Shippori+Mincho:wght@400;500;600&family=Kosugi+Maru&display=swap');
        :root {
          --paper: #FBF6EC; --paper-2: #F5EEDF; --cream: #FEFAF0;
          --pink: #FCDDE4; --peach: #FFE8D6; --yellow: #FBEFB7;
          --ink: #4A3F36; --ink-soft: #7C6E61; --ink-mute: #A89C8F;
          --line: #E2D6C1; --accent: #D98B8B;
          --body-font: 'Klee One', 'Noto Sans TC', system-ui, sans-serif;
          --title-font: 'Shippori Mincho', serif;
          --label-font: 'Kosugi Maru', sans-serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes softFade {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        .login-card { animation: softFade 0.7s ease both; }
      `}</style>

      {/* 背景裝飾 */}
      <div style={{ position: "fixed", top: 60, right: 60, fontSize: 40, opacity: 0.35, animation: "gentleFloat 5s ease-in-out infinite" }}>☁️</div>
      <div style={{ position: "fixed", bottom: 60, left: 60, fontSize: 34, opacity: 0.35, transform: "rotate(-15deg)" }}>🌿</div>
      <div style={{ position: "fixed", bottom: 120, right: 80, fontSize: 20, opacity: 0.5 }}>✦</div>

      {/* 登入卡片 */}
      <div
        className="login-card"
        style={{
          background: "var(--cream)",
          padding: "48px 40px",
          borderRadius: 28,
          border: "1.5px solid var(--ink)",
          boxShadow: "6px 8px 0 var(--accent)",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* masking tape */}
        <div style={{
          position: "absolute", top: -13, left: "50%",
          transform: "translateX(-50%) rotate(-2deg)",
          width: 110, height: 26,
          background: "var(--peach)", opacity: 0.9, borderRadius: 2,
          backgroundImage: "repeating-linear-gradient(90deg, transparent 0 6px, rgba(255,255,255,0.35) 6px 10px)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }} />

        <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>

        <h1
          style={{
            fontFamily: "var(--title-font)",
            fontSize: 32,
            fontWeight: 600,
            color: "var(--ink)",
            marginBottom: 8,
            lineHeight: 1.2,
          }}
        >
          今天的行程記事本
        </h1>

        <p
          style={{
            fontFamily: "var(--body-font)",
            fontSize: 15,
            color: "var(--ink-soft)",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          請用 Google 帳號登入
        </p>

        {/* Google 登入按鈕 */}
        <div
          id="google-signin-btn"
          style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}
        />

        {authError && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              background: "#FDE8E8",
              border: "1px dashed #E8A8A8",
              borderRadius: 12,
              fontSize: 13,
              color: "#8A3D3D",
              fontFamily: "var(--body-font)",
            }}
          >
            {authError}
          </div>
        )}

        <p
          style={{
            marginTop: 20,
            fontSize: 12,
            color: "var(--ink-mute)",
            fontFamily: "var(--label-font)",
          }}
        >
          僅限授權帳號存取
        </p>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
function DecorationDoodles() {
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 80, right: 60,
          fontSize: 42, opacity: 0.4, zIndex: 1,
          animation: "gentleFloat 5s ease-in-out infinite",
        }}
      >
        <NI icon="noto:cloud" size={16} />️
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 60, left: 70,
          fontSize: 36, opacity: 0.4, zIndex: 1,
          transform: "rotate(-15deg)",
        }}
      >
        <NI icon="noto:herb" size={20} />
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 140, right: 90,
          fontSize: 22, opacity: 0.55, zIndex: 1,
          animation: "wiggle 3.5s ease-in-out infinite",
        }}
      >
        <NI icon="noto:glowing-star" size={16} />
      </div>
      <div
        style={{
          position: "fixed",
          top: 280, left: 90,
          fontSize: 24, opacity: 0.4, zIndex: 1,
          transform: "rotate(12deg)",
        }}
      >
        <NI icon="noto:blossom" size={16} />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
function Header({ view, setView, onPaste, eventCount, user, onSignOut, search, setSearch, filterType, setFilterType }) {
  const today = new Date();
  const dateLine = `${today.getFullYear()}年 ${today.getMonth() + 1}月 ${today.getDate()}日`;
  const weekday = WEEKDAY_SHORT[today.getDay()];

  return (
    <header
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "56px 48px 32px 80px",
        position: "relative",
      }}
    >
      <div
        className="fade"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 16,
          fontFamily: "var(--hand-font)",
          fontSize: 16,
          color: "var(--ink-soft)",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            background: "var(--yellow)",
            padding: "3px 12px",
            borderRadius: 999,
            border: "1px dashed var(--ink-mute)",
          }}
        >
          {dateLine}（{"週" + weekday}）
        </span>
        <span><NI icon="noto:sun" size={14} /> 晴天</span>
        <span style={{ color: "var(--ink-mute)" }}>・</span>
        <span style={{ fontSize: 14 }}>今天也要加油</span>
      </div>

      <div
        className="fade"
        style={{
          animationDelay: "0.1s",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
          marginBottom: 8,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--title-font)",
            fontSize: "clamp(40px, 6vw, 68px)",
            fontWeight: 600,
            lineHeight: 1.05,
            color: "var(--ink)",
          }}
        >
          <span className="wavy-underline">今天的</span>行程記事本
          <span
            style={{
              display: "inline-block",
              marginLeft: 16,
              fontSize: "0.5em",
              animation: "wiggle 3s ease-in-out infinite",
              transformOrigin: "center",
            }}
          >
            <NI icon="noto:blossom" size={16} />
          </span>
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid var(--ink)" }}
                />
              )}
              <button
                className="btn-journal"
                onClick={onSignOut}
                style={{ fontSize: 12, padding: "6px 14px" }}
              >
                登出
              </button>
            </div>
          )}
          <button className="btn-journal btn-pink" onClick={onPaste}>
            ＋ AI 新增行程
          </button>
        </div>
      </div>

      <p
        className="fade"
        style={{
          animationDelay: "0.18s",
          fontFamily: "var(--hand-font)",
          fontSize: 17,
          color: "var(--ink-soft)",
          marginBottom: 32,
          maxWidth: 560,
        }}
      >
        把生活的每個瞬間，一張一張貼在時間裡 ・ 目前共有{" "}
        <span
          style={{
            background: "var(--pink-soft)",
            padding: "1px 10px",
            borderRadius: 999,
            color: "var(--ink)",
            fontWeight: 600,
          }}
        >
          {eventCount} 個預定
        </span>
      </p>

      <div
        className="fade"
        style={{
          animationDelay: "0.26s",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <ViewTab
          active={view === "schedule"}
          onClick={() => setView("schedule")}
          color="peach"
          icon="📋"
          label="行程一覧"
          sub="行程"
        />
        <ViewTab
          active={view === "calendar"}
          onClick={() => setView("calendar")}
          color="blue"
          icon="🗓"
          label="月曆"
          sub="月曆"
        />
      </div>

      {/* 搜尋 + 篩選列 */}
      <div
        className="fade"
        style={{
          animationDelay: "0.32s",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginTop: 16,
        }}
      >
        {/* 搜尋框 */}
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160, maxWidth: 360 }}>
          <span style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", fontSize: 14, opacity: 0.5,
          }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋行程標題..."
            style={{
              width: "100%",
              padding: "10px 14px 10px 34px",
              border: "1.5px solid var(--line)",
              borderRadius: 999,
              background: "var(--cream)",
              fontFamily: "var(--body-font)",
              fontSize: 14,
              color: "var(--ink)",
              outline: "none",
              boxShadow: "2px 2px 0 var(--line)",
              transition: "border-color 0.2s ease",
            }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--line)"}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute", right: 10, top: "50%",
                transform: "translateY(-50%)",
                border: "none", background: "transparent",
                cursor: "pointer", fontSize: 13, color: "var(--ink-mute)",
                padding: "2px 4px",
              }}
            >✕</button>
          )}
        </div>

        {/* 類型篩選 */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { key: "all",     label: "全部",  bg: "var(--cream)",  border: "var(--ink)" },
            { key: "lecture", label: "📖 講座", bg: "#FFF3E4", border: "#E8B896" },
            { key: "meeting", label: "☕ 會議", bg: "#EDF4FA", border: "#9EC0D8" },
            { key: "dinner",  label: "🍡 聚餐", bg: "#FEEDF1", border: "#E8A8B8" },
          ].map(({ key, label, bg, border }) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: `1.5px solid ${filterType === key ? border : "var(--line)"}`,
                background: filterType === key ? bg : "transparent",
                fontFamily: "var(--body-font)",
                fontSize: 13,
                fontWeight: filterType === key ? 600 : 400,
                color: "var(--ink)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: filterType === key ? `2px 2px 0 ${border}` : "none",
                transform: filterType === key ? "translate(-1px,-1px)" : "translate(0,0)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 篩選結果提示 */}
        {(search || filterType !== "all") && (
          <span
            style={{
              fontFamily: "var(--hand-font)",
              fontSize: 13,
              color: "var(--ink-soft)",
            }}
          >
            找到 {eventCount} 件
            {search && <span>・含「{search}」</span>}
            {filterType !== "all" && (
              <button
                onClick={() => { setSearch(""); setFilterType("all"); }}
                style={{
                  marginLeft: 8,
                  border: "none", background: "transparent",
                  cursor: "pointer", fontSize: 12,
                  color: "var(--accent)", fontFamily: "var(--hand-font)",
                  textDecoration: "underline",
                }}
              >
                清除篩選
              </button>
            )}
          </span>
        )}
      </div>
    </header>
  );
}

function ViewTab({ active, onClick, color, icon, label, sub }) {
  const colorMap = { peach: "var(--peach)", blue: "var(--blue)" };
  return (
    <button
      onClick={onClick}
      style={{
        border: "1.5px solid var(--ink)",
        background: active ? colorMap[color] : "var(--cream)",
        borderRadius: 18,
        padding: "12px 22px",
        cursor: "pointer",
        fontFamily: "var(--body-font)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        transform: active ? "translate(-2px, -2px)" : "translate(0, 0)",
        boxShadow: active ? "4px 4px 0 var(--ink)" : "2px 2px 0 var(--ink-mute)",
        transition: "all 0.25s ease",
        opacity: active ? 1 : 0.75,
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--ink-mute)",
            letterSpacing: "0.15em",
            fontFamily: "var(--label-font)",
          }}
        >
          {sub}
        </div>
      </div>
    </button>
  );
}

// ═════════════════════════════════════════════════════════════
// AI PASTE FLOW — 三階段流程
// stage 1: input（貼上文字）
// stage 2: loading（AI 解析中）
// stage 3: preview（預覽並編輯）
// ═════════════════════════════════════════════════════════════
function AIPasteFlow({ onClose, onConfirm }) {
  const [stage, setStage] = useState("input"); // input | loading | preview
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setStage("loading");
    setError(null);
    try {
      const result = await parseEventWithAI(rawText);
      setParsed(result);
      setStage("preview");
    } catch (err) {
      console.error(err);
      setError("AI 整理失敗了，再試一次看看 🥺");
      setStage("input");
    }
  };

  const handleBack = () => {
    setStage("input");
  };

  return (
    <div
      onClick={stage === "input" ? onClose : undefined}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(74, 63, 54, 0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "softFade 0.25s ease",
        overflow: "auto",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: stage === "preview" ? 640 : 560 }}>
        {stage === "input" && (
          <InputStage
            value={rawText}
            onChange={setRawText}
            onClose={onClose}
            onSubmit={handleParse}
            error={error}
          />
        )}
        {stage === "loading" && <LoadingStage />}
        {stage === "preview" && parsed && (
          <PreviewStage
            initial={parsed}
            onBack={handleBack}
            onCancel={onClose}
            onConfirm={onConfirm}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stage 1: INPUT
// ─────────────────────────────────────────────────────────────
function InputStage({ value, onChange, onClose, onSubmit, error }) {
  return (
    <div
      className="pop"
      style={{
        "--tilt": "0deg",
        background: "var(--cream)",
        padding: 36,
        borderRadius: 28,
        border: "1.5px solid var(--ink)",
        boxShadow: "6px 8px 0 var(--accent)",
        position: "relative",
      }}
    >
      {/* masking tape */}
      <div
        style={{
          position: "absolute",
          top: -14,
          left: "50%",
          transform: "translateX(-50%) rotate(-2deg)",
          width: 120,
          height: 28,
          background: "var(--peach)",
          opacity: 0.85,
          borderRadius: 2,
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0 6px, rgba(255,255,255,0.35) 6px 10px)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      />

      {/* 步驟指示 */}
      <StepIndicator current={1} />

      <div
        style={{
          fontFamily: "var(--hand-font)",
          fontSize: 14,
          color: "var(--ink-soft)",
          marginBottom: 6,
        }}
      >
        ✿ 步驟 1 — 貼上文字 ✿
      </div>
      <h2
        style={{
          fontFamily: "var(--title-font)",
          fontSize: 30,
          fontWeight: 600,
          color: "var(--ink)",
          marginBottom: 8,
          lineHeight: 1.2,
        }}
      >
        把文字交給 AI 看看～
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "var(--ink-soft)",
          marginBottom: 20,
          lineHeight: 1.6,
        }}
      >
        講座訊息、Email 邀請、朋友訊息都可以。AI 會抽出時間、地點、對象，<br />
        <strong>下一步可以檢查跟編輯</strong>，確認後才會加到行程本 <NI icon="noto:ribbon" size={14} />
      </p>

      {error && (
        <div
          style={{
            background: "#FDE8E8",
            border: "1px dashed #E8A8A8",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 13,
            color: "#8A3D3D",
            marginBottom: 16,
            fontFamily: "var(--hand-font)",
          }}
        >
          {error}
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例如：下週三晚上七點跟阿翔在大直 Orchid 吃晚餐慶生，記得買禮物..."
        style={{
          width: "100%",
          minHeight: 140,
          padding: 16,
          border: "1.5px solid var(--line)",
          background: "var(--paper)",
          fontFamily: "var(--body-font)",
          fontSize: 14,
          color: "var(--ink)",
          borderRadius: 16,
          resize: "vertical",
          outline: "none",
          lineHeight: 1.6,
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: "var(--hand-font)",
            fontSize: 13,
            color: "var(--ink-mute)",
          }}
        >
          {value.length} 字 ・ AI 幫你整理
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-journal" onClick={onClose}>
            取消
          </button>
          <button
            className="btn-journal btn-pink"
            onClick={onSubmit}
            disabled={!value.trim()}
          >
            讓 AI 整理 →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stage 2: LOADING
// ─────────────────────────────────────────────────────────────
function LoadingStage() {
  return (
    <div
      className="pop"
      style={{
        "--tilt": "0deg",
        background: "var(--cream)",
        padding: "56px 40px",
        borderRadius: 28,
        border: "1.5px solid var(--ink)",
        boxShadow: "6px 8px 0 var(--accent)",
        position: "relative",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 64,
          marginBottom: 20,
          display: "inline-block",
          animation: "spinBounce 1.2s ease-in-out infinite",
        }}
      >
        <NI icon="noto:blossom" size={16} />
      </div>

      <h2
        style={{
          fontFamily: "var(--title-font)",
          fontSize: 26,
          fontWeight: 600,
          color: "var(--ink)",
          marginBottom: 10,
          lineHeight: 1.2,
        }}
      >
        AI 正在整理中...
      </h2>
      <p
        style={{
          fontFamily: "var(--hand-font)",
          fontSize: 15,
          color: "var(--ink-soft)",
          marginBottom: 24,
        }}
      >
        幫你從文字裡找出時間、地點、對象喔 <NI icon="noto:hot-beverage" size={16} />
      </p>

      {/* bouncing dots */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--accent)",
              animation: "dotBounce 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stage 3: PREVIEW — 可編輯預覽（同時用於編輯現有事件）
// ─────────────────────────────────────────────────────────────
function PreviewStage({ initial, onBack, onCancel, onConfirm, onDelete, mode = "create" }) {
  const [draft, setDraft] = useState(initial);

  const update = (key, value) => setDraft({ ...draft, [key]: value });

  // 判斷哪些欄位是空的（要提示補齊）
  const emptyFields = [];
  if (!draft.title) emptyFields.push("title");
  if (!draft.date) emptyFields.push("date");
  if (!draft.start) emptyFields.push("start");

  const canConfirm = draft.title && draft.date && draft.start;

  const meta = TYPE_META[draft.type];
  const isEdit = mode === "edit";

  return (
    <div
      className="pop"
      style={{
        "--tilt": "0deg",
        background: "var(--cream)",
        padding: 32,
        borderRadius: 28,
        border: "1.5px solid var(--ink)",
        boxShadow: "6px 8px 0 var(--accent)",
        position: "relative",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      {/* masking tape */}
      <div
        style={{
          position: "absolute",
          top: -14,
          left: "30%",
          transform: "rotate(-4deg)",
          width: 110,
          height: 26,
          background: meta.tape,
          opacity: 0.85,
          borderRadius: 2,
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0 5px, rgba(255,255,255,0.35) 5px 9px)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      />

      {!isEdit && <StepIndicator current={2} />}

      <div
        style={{
          fontFamily: "var(--hand-font)",
          fontSize: 14,
          color: "var(--ink-soft)",
          marginBottom: 6,
        }}
      >
        {isEdit ? "✎ 編輯中 ✎" : "✿ 步驟 2 — 預覽與調整 ✿"}
      </div>
      <h2
        style={{
          fontFamily: "var(--title-font)",
          fontSize: 28,
          fontWeight: 600,
          color: "var(--ink)",
          marginBottom: 6,
          lineHeight: 1.2,
        }}
      >
        {isEdit ? "編輯這個行程" : "確認一下這個行程～"}
      </h2>
      <p
        style={{
          fontSize: 13,
          color: "var(--ink-soft)",
          marginBottom: 20,
          lineHeight: 1.6,
        }}
      >
        {isEdit ? (
          "點任何欄位都可以修改。改完記得存檔喔 ✨"
        ) : (
          <>
            AI 幫你整理好了。點任何欄位都可以修改，
            {emptyFields.length > 0 && (
              <span style={{ color: "#C08A2E", fontWeight: 600 }}>
                {" "}有 {emptyFields.length} 個欄位 AI 猜不到，再幫忙補一下喔 ✎
              </span>
            )}
          </>
        )}
      </p>

      {/* 類型切換 — 貼紙風 */}
      <div style={{ marginBottom: 16 }}>
        <FieldLabel label="類型" emoji="🏷" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(TYPE_META).map(([k, m]) => {
            const active = draft.type === k;
            return (
              <button
                key={k}
                onClick={() => update("type", k)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: active ? m.bg : "var(--paper)",
                  border: `1.5px solid ${active ? m.border : "var(--line)"}`,
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  color: active ? m.ink : "var(--ink-mute)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: active ? `2px 2px 0 ${m.border}` : "none",
                  transform: active ? "translate(-1px, -1px)" : "translate(0, 0)",
                  fontFamily: "var(--body-font)",
                }}
              >
                <span>{m.emoji}</span>
                {m.zh}
              </button>
            );
          })}
        </div>
      </div>

      {/* 預覽卡片 — 實際長相 */}
      <div
        style={{
          background: meta.bgSoft,
          border: `1.5px solid ${meta.border}`,
          borderRadius: 20,
          padding: 20,
          marginBottom: 20,
          boxShadow: `3px 4px 0 ${meta.border}`,
          position: "relative",
        }}
      >
        {!isEdit && (
          <div
            style={{
              position: "absolute",
              top: -12,
              right: 16,
              background: "var(--yellow)",
              border: "1px dashed var(--ink-mute)",
              padding: "2px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontFamily: "var(--hand-font)",
              color: "var(--ink-soft)",
              transform: "rotate(3deg)",
            }}
          >
            <NI icon="noto:sparkles" size={16} /> AI 解析預覽
          </div>
        )}

        {/* 標題 */}
        <EditableField
          label="標題"
          emoji="✎"
          value={draft.title}
          onChange={(v) => update("title", v)}
          isEmpty={!draft.title}
          placeholder="幫這個行程取個名字..."
          fontSize={20}
          fontFamily="var(--title-font)"
          fontWeight={600}
        />

        {/* 日期 + 時間 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr 1fr",
            gap: 10,
            marginTop: 14,
          }}
        >
          <EditableField
            label="日期"
            emoji="📅"
            type="date"
            value={draft.date}
            onChange={(v) => update("date", v)}
            isEmpty={!draft.date}
            placeholder="YYYY-MM-DD"
          />
          <EditableField
            label="開始"
            emoji="🕐"
            type="time"
            value={draft.start}
            onChange={(v) => update("start", v)}
            isEmpty={!draft.start}
            placeholder="HH:MM"
          />
          <EditableField
            label="結束"
            emoji="🕔"
            type="time"
            value={draft.end}
            onChange={(v) => update("end", v)}
            isEmpty={!draft.end}
            placeholder="HH:MM"
          />
        </div>

        {/* 地點 */}
        <div style={{ marginTop: 14 }}>
          <EditableField
            label="地點"
            emoji="📍"
            value={draft.location}
            onChange={(v) => update("location", v)}
            isEmpty={!draft.location}
            placeholder="在哪裡呢？"
          />
        </div>

        {/* 對象 */}
        <div style={{ marginTop: 14 }}>
          <EditableField
            label="對象"
            emoji="👥"
            value={draft.with}
            onChange={(v) => update("with", v)}
            isEmpty={!draft.with}
            placeholder="跟誰一起？"
          />
        </div>

        {/* 備註 */}
        <div style={{ marginTop: 14 }}>
          <EditableField
            label="備註"
            emoji="✐"
            value={draft.note}
            onChange={(v) => update("note", v)}
            isEmpty={!draft.note}
            placeholder="要提醒自己什麼嗎？（選填）"
            multiline
            optional
          />
        </div>
      </div>

      {/* 提示 */}
      {!canConfirm && (
        <div
          style={{
            background: "var(--yellow-soft)",
            border: "1px dashed #D4B44E",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 13,
            color: "#7A5B1E",
            marginBottom: 16,
            fontFamily: "var(--hand-font)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span><NI icon="noto:light-bulb" size={15} /></span>
          <span>標題、日期、開始時間 是必填欄位，補齊就能加入了～</span>
        </div>
      )}

      {/* 按鈕列 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* 左側 */}
        {isEdit ? (
          <button
            className="btn-journal"
            onClick={onDelete}
            style={{
              background: "#FDE8E8",
              borderColor: "#B85A5A",
              color: "#8A3D3D",
              boxShadow: "2px 2px 0 #B85A5A",
            }}
          >
            <NI icon="noto:wastebasket" size={18} /> 刪除這個
          </button>
        ) : (
          <button className="btn-journal" onClick={onBack}>
            ← 重新貼文字
          </button>
        )}

        {/* 右側 */}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-journal" onClick={onCancel}>
            取消
          </button>
          <button
            className="btn-journal btn-pink"
            onClick={() => onConfirm(draft)}
            disabled={!canConfirm}
          >
            {isEdit ? "儲存變更 ✨" : "加入行程本 ✨"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Step Indicator
// ─────────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = [
    { num: 1, label: "貼上" },
    { num: 2, label: "預覽" },
    { num: 3, label: "加入" },
  ];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 18,
      }}
    >
      {steps.map((s, i) => {
        const done = s.num < current;
        const active = s.num === current;
        return (
          <React.Fragment key={s.num}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px 4px 4px",
                borderRadius: 999,
                background: active
                  ? "var(--pink)"
                  : done
                  ? "var(--mint)"
                  : "transparent",
                border: active ? "1.5px solid var(--ink)" : "1.5px solid transparent",
                opacity: active || done ? 1 : 0.4,
                transition: "all 0.3s ease",
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: active
                    ? "var(--ink)"
                    : done
                    ? "var(--ink)"
                    : "var(--line)",
                  color: "var(--cream)",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--label-font)",
                }}
              >
                {done ? "✓" : s.num}
              </span>
              <span
                style={{
                  fontFamily: "var(--label-font)",
                  fontSize: 11,
                  color: "var(--ink)",
                  fontWeight: 600,
                }}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                style={{
                  flex: "0 0 16px",
                  height: 2,
                  backgroundImage:
                    "radial-gradient(circle, var(--ink-mute) 1px, transparent 1px)",
                  backgroundSize: "5px 2px",
                  backgroundRepeat: "repeat-x",
                  backgroundPosition: "center",
                  opacity: 0.6,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Editable Field — 點擊即編輯
// ─────────────────────────────────────────────────────────────
function FieldLabel({ label, emoji }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        color: "var(--ink-mute)",
        fontFamily: "var(--label-font)",
        letterSpacing: "0.05em",
        marginBottom: 4,
      }}
    >
      <span style={{ fontSize: 11 }}>{emoji}</span>
      {label}
    </div>
  );
}

function EditableField({
  label,
  emoji,
  value,
  onChange,
  isEmpty,
  placeholder,
  type = "text",
  multiline = false,
  optional = false,
  fontSize = 14,
  fontFamily,
  fontWeight,
}) {
  const [focused, setFocused] = useState(false);

  // 空欄位顯示警告底色（除非是 optional）
  const showWarning = isEmpty && !optional && !focused;

  const baseStyle = {
    width: "100%",
    padding: "8px 10px",
    background: showWarning
      ? "var(--yellow-soft)"
      : focused
      ? "var(--cream)"
      : "rgba(255, 255, 255, 0.5)",
    border: showWarning
      ? "1px dashed #D4B44E"
      : focused
      ? "1.5px solid var(--accent)"
      : "1px solid var(--line)",
    borderRadius: 10,
    fontFamily: fontFamily || "var(--body-font)",
    fontSize: fontSize,
    fontWeight: fontWeight || 400,
    color: "var(--ink)",
    outline: "none",
    transition: "all 0.2s ease",
    lineHeight: 1.5,
  };

  return (
    <div>
      <FieldLabel label={label} emoji={emoji} />
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{ ...baseStyle, minHeight: 60, resize: "vertical" }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={baseStyle}
        />
      )}
      {showWarning && (
        <div
          style={{
            fontFamily: "var(--hand-font)",
            fontSize: 11,
            color: "#C08A2E",
            marginTop: 3,
            paddingLeft: 4,
          }}
        >
          <NI icon="noto:pencil" size={14} /> 這個 AI 沒猜到，幫忙填一下～
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SCHEDULE VIEW
// ═════════════════════════════════════════════════════════════
function ScheduleView({ events, onEdit, onDelete }) {
  const grouped = useMemo(() => {
    const byMonth = new Map();
    const sorted = [...events].sort((a, b) => {
      if (a.date !== b.date) return (a.date || "").localeCompare(b.date || "");
      return (a.start || "").localeCompare(b.start || "");
    });
    for (const ev of sorted) {
      const d = parseYMD(ev.date);
      if (!d) continue; // 跳過日期無效的行程
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!byMonth.has(key)) {
        byMonth.set(key, { year: d.getFullYear(), month: d.getMonth(), items: [] });
      }
      byMonth.get(key).items.push(ev);
    }
    return Array.from(byMonth.values());
  }, [events]);

  return (
    <section style={{ paddingTop: 32 }}>
      {grouped.length === 0 ? (
        <div
          className="fade"
          style={{
            textAlign: "center",
            padding: "80px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 64 }}>📋</div>
          <div
            style={{
              fontFamily: "var(--title-font)",
              fontSize: 24,
              color: "var(--ink)",
              fontWeight: 600,
            }}
          >
            還沒有行程喔
          </div>
          <div
            style={{
              fontFamily: "var(--hand-font)",
              fontSize: 16,
              color: "var(--ink-soft)",
              lineHeight: 1.6,
              maxWidth: 320,
            }}
          >
            點右上角的「＋ AI 新增行程」<br />
            貼上活動文字，讓 AI 幫你整理 ✨
          </div>
        </div>
      ) : (
        grouped.map((group, gi) => (
          <MonthGroup
            key={`${group.year}-${group.month}`}
            group={group}
            index={gi}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </section>
  );
}

function MonthGroup({ group, index, onEdit, onDelete }) {
  const mm = MONTH_LABELS[group.month] || { zh: "未知月份", en: "Unknown" };

  const byDate = useMemo(() => {
    const map = new Map();
    for (const ev of group.items) {
      if (!map.has(ev.date)) map.set(ev.date, []);
      map.get(ev.date).push(ev);
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [group.items]);

  return (
    <div
      className="fade"
      style={{
        animationDelay: `${0.1 + index * 0.08}s`,
        marginBottom: 56,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, var(--pink) 0%, var(--peach) 100%)",
            padding: "14px 28px",
            borderRadius: "24px 24px 24px 6px",
            border: "1.5px solid var(--ink)",
            boxShadow: "3px 3px 0 var(--ink)",
            transform: "rotate(-1.5deg)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--title-font)",
              fontSize: 32,
              fontWeight: 600,
              color: "var(--ink)",
              lineHeight: 1,
            }}
          >
            {mm.zh}
          </div>
          <div
            style={{
              fontFamily: "var(--label-font)",
              fontSize: 11,
              color: "var(--ink-soft)",
              letterSpacing: "0.15em",
              marginTop: 4,
            }}
          >
            {mm.en.toUpperCase()} · {group.year}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 80,
            height: 2,
            backgroundImage:
              "radial-gradient(circle, var(--ink-mute) 1.5px, transparent 1.5px)",
            backgroundSize: "10px 2px",
            backgroundRepeat: "repeat-x",
            backgroundPosition: "center",
          }}
        />

        <span
          style={{
            fontFamily: "var(--hand-font)",
            fontSize: 16,
            color: "var(--ink-soft)",
            background: "var(--yellow)",
            padding: "4px 14px",
            borderRadius: 999,
            border: "1px dashed var(--ink-mute)",
          }}
        >
          {group.items.length} 件
        </span>
      </div>

      {byDate.map((day, di) => (
        <DaySection
          key={day.date}
          date={day.date}
          items={day.items}
          index={di}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function DaySection({ date, items, index, onEdit, onDelete }) {
  const d = parseYMD(date);
  const dayNum = d.getDate();
  const weekday = WEEKDAY_SHORT[d.getDay()];
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;

  return (
    <div
      className="fade"
      style={{
        animationDelay: `${0.15 + index * 0.06}s`,
        display: "grid",
        gridTemplateColumns: "110px 1fr",
        gap: 28,
        marginBottom: 36,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "16px 12px",
          background: "var(--cream)",
          borderRadius: 20,
          border: "1.5px solid var(--ink)",
          boxShadow: "3px 3px 0 var(--ink-mute)",
          transform: `rotate(${tiltFor(dayNum) * 0.5}deg)`,
        }}
      >
        <div
          style={{
            fontFamily: "var(--label-font)",
            fontSize: 11,
            color: isWeekend ? "var(--accent)" : "var(--ink-mute)",
            letterSpacing: "0.15em",
            marginBottom: 2,
          }}
        >
          {"週" + weekday}
        </div>
        <div
          style={{
            fontFamily: "var(--title-font)",
            fontSize: 48,
            fontWeight: 600,
            lineHeight: 1,
            color: isWeekend ? "var(--accent)" : "var(--ink)",
          }}
        >
          {dayNum}
        </div>
        <div
          style={{
            fontFamily: "var(--hand-font)",
            fontSize: 12,
            color: "var(--ink-soft)",
            marginTop: 6,
          }}
        >
          {items.length} 件行程
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {items.map((ev, i) => (
          <EventSticker
            key={ev.id}
            event={ev}
            index={i}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function EventSticker({ event, index, onEdit, onDelete }) {
  const meta = TYPE_META[event.type];
  const tilt = tiltFor(event.id);
  const [hover, setHover] = useState(false);

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="pop"
      style={{
        "--tilt": `${tilt}deg`,
        animationDelay: `${0.2 + index * 0.08}s`,
        background: meta.bgSoft,
        border: `1.5px solid ${meta.border}`,
        borderRadius: 24,
        padding: "22px 26px",
        boxShadow: hover
          ? `5px 7px 0 ${meta.border}, 0 12px 24px rgba(74, 63, 54, 0.12)`
          : `3px 4px 0 ${meta.border}`,
        transform: `rotate(${tilt}deg) translateY(${hover ? -3 : 0}px)`,
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -10,
          left: "10%",
          width: 70,
          height: 20,
          background: meta.tape,
          opacity: 0.8,
          transform: "rotate(-6deg)",
          borderRadius: 2,
          boxShadow: "0 2px 3px rgba(0,0,0,0.08)",
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0 4px, rgba(255,255,255,0.3) 4px 8px)",
        }}
      />

      {/* 編輯/刪除浮動按鈕 */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          display: "flex",
          gap: 6,
          opacity: hover ? 1 : 0,
          transform: hover ? "translateY(0)" : "translateY(-4px)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
          pointerEvents: hover ? "auto" : "none",
          zIndex: 5,
        }}
      >
        <ActionButton
          ariaLabel="編集"
          title="編輯"
          bg="var(--cream)"
          border={meta.border}
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit(event);
          }}
        >
          <NI icon="noto:pencil" size={14} />
        </ActionButton>
        <ActionButton
          ariaLabel="削除"
          title="刪除"
          bg="var(--cream)"
          border="#E8A8A8"
          hoverBg="#FDE8E8"
          onClick={(e) => {
            e.stopPropagation();
            onDelete && onDelete(event);
          }}
        >
          <NI icon="noto:cross-mark" size={13} />
        </ActionButton>
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: meta.bg,
          padding: "3px 12px 3px 8px",
          borderRadius: 999,
          border: `1px solid ${meta.border}`,
          fontSize: 12,
          fontWeight: 600,
          color: meta.ink,
          marginBottom: 10,
        }}
      >
        <span>{meta.emoji}</span>
        {meta.zh}
      </div>

      <h3
        style={{
          fontFamily: "var(--title-font)",
          fontSize: 22,
          fontWeight: 600,
          color: "var(--ink)",
          marginBottom: 14,
          lineHeight: 1.3,
        }}
      >
        {event.title}
      </h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 18px",
          fontSize: 14,
          color: "var(--ink-soft)",
          marginBottom: 12,
        }}
      >
        <MetaChip icon="🕐" label={`${event.start || "—"} – ${event.end || "—"}`} />
        {event.location && <MetaChip icon="📍" label={event.location} />}
        {event.with && <MetaChip icon="👥" label={event.with} />}
      </div>

      {event.note && (
        <NoteSection note={event.note} border={meta.border} ink={meta.ink} />
      )}
    </article>
  );
}

function NoteSection({ note, border, ink }) {
  const [expanded, setExpanded] = useState(false);
  const MAX_LEN = 60;
  const isLong = note.length > MAX_LEN;
  return (
    <div
      style={{
        marginTop: 8,
        paddingTop: 12,
        borderTop: `1px dashed ${border}`,
        fontFamily: "var(--hand-font)",
        fontSize: 15,
        color: ink,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span style={{ opacity: 0.6, flexShrink: 0 }}><NI icon="noto:pencil" size={14} /></span>
        <span style={{ whiteSpace: "pre-wrap" }}>
          {isLong && !expanded ? note.slice(0, MAX_LEN) + "..." : note}
        </span>
      </div>
      {isLong && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          style={{
            marginTop: 6,
            marginLeft: 22,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 12,
            color: ink,
            opacity: 0.7,
            fontFamily: "var(--hand-font)",
            padding: 0,
            textDecoration: "underline",
          }}
        >
          {expanded ? "收合 ↑" : "展開全文 ↓"}
        </button>
      )}
    </div>
  );
}

function MetaChip({ icon, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// ActionButton — 小圓鈕（編輯 / 刪除 / 關閉）
// ─────────────────────────────────────────────────────────────
function ActionButton({
  children,
  onClick,
  ariaLabel,
  title,
  bg = "var(--cream)",
  border = "var(--line)",
  hoverBg,
  size = 28,
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `1px solid ${border}`,
        background: hover && hoverBg ? hoverBg : bg,
        color: "var(--ink-soft)",
        cursor: "pointer",
        fontSize: 13,
        fontFamily: "var(--body-font)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        padding: 0,
        transition: "all 0.2s ease",
        boxShadow: hover ? `1px 2px 0 ${border}` : "none",
        transform: hover ? "translate(-1px, -1px)" : "translate(0, 0)",
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// EditEventModal — 重用 PreviewStage 的編輯版本
// ─────────────────────────────────────────────────────────────
function EditEventModal({ event, onClose, onConfirm, onDelete }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(74, 63, 54, 0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 160,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "softFade 0.25s ease",
        overflow: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 640 }}
      >
        <PreviewStage
          initial={event}
          mode="edit"
          onBack={null}
          onCancel={onClose}
          onConfirm={onConfirm}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DeleteConfirmModal — 刪除前確認
// ─────────────────────────────────────────────────────────────
function DeleteConfirmModal({ event, onClose, onConfirm }) {
  const meta = TYPE_META[event.type];
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(74, 63, 54, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 170,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "softFade 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pop"
        style={{
          "--tilt": "0deg",
          background: "var(--cream)",
          maxWidth: 420,
          width: "100%",
          padding: "32px 28px 24px",
          borderRadius: 24,
          border: "1.5px solid var(--ink)",
          boxShadow: "6px 8px 0 #E8A8A8",
          position: "relative",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 40,
            marginBottom: 10,
            animation: "wiggle 2s ease-in-out infinite",
            display: "inline-block",
          }}
        >
          <NI icon="noto:wastebasket" size={18} />
        </div>

        <div
          style={{
            fontFamily: "var(--hand-font)",
            fontSize: 14,
            color: "var(--ink-soft)",
            marginBottom: 4,
          }}
        >
          確定要刪除嗎？
        </div>
        <h2
          style={{
            fontFamily: "var(--title-font)",
            fontSize: 24,
            fontWeight: 600,
            color: "var(--ink)",
            marginBottom: 16,
            lineHeight: 1.3,
          }}
        >
          確定要撕下這張貼紙嗎？
        </h2>

        {/* 事件摘要卡 */}
        <div
          style={{
            background: meta.bgSoft,
            border: `1px dashed ${meta.border}`,
            borderRadius: 14,
            padding: "12px 14px",
            marginBottom: 20,
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: meta.ink,
              marginBottom: 4,
              fontWeight: 600,
            }}
          >
            <span>{meta.emoji}</span>
            {meta.zh}
          </div>
          <div
            style={{
              fontFamily: "var(--title-font)",
              fontSize: 17,
              fontWeight: 600,
              color: "var(--ink)",
              lineHeight: 1.3,
              marginBottom: 4,
            }}
          >
            {event.title || "（未命名）"}
          </div>
          {(event.date || event.start) && (
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-soft)",
                fontFamily: "var(--label-font)",
              }}
            >
              {event.date} {event.start && `・ ${event.start}`}
            </div>
          )}
        </div>

        <p
          style={{
            fontFamily: "var(--hand-font)",
            fontSize: 13,
            color: "var(--ink-soft)",
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          撕下來之後就找不回來囉 <NI icon="noto:pleading-face" size={16} />
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn-journal" onClick={onClose}>
            不要刪了
          </button>
          <button
            className="btn-journal"
            onClick={onConfirm}
            style={{
              background: "#FDE8E8",
              borderColor: "#B85A5A",
              color: "#8A3D3D",
              boxShadow: "2px 2px 0 #B85A5A",
            }}
          >
            確定撕下 <NI icon="noto:cross-mark" size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// CALENDAR VIEW
// ═════════════════════════════════════════════════════════════
function CalendarView({ events, onEdit, onDelete }) {
  const firstDate = useMemo(() => {
    const sorted = [...events].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    return sorted.length ? parseYMD(sorted[0].date) : new Date();
  }, [events]);

  const [cursor, setCursor] = useState(
    new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)
  );
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const mm = MONTH_LABELS[month];

  const firstOfMonth = new Date(year, month, 1);
  const startDayOfWeek = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsOnDate = (date) =>
    events
      .filter((ev) => ev.date && parseYMD(ev.date) && sameDay(parseYMD(ev.date), date))
      .sort((a, b) => (a.start || "").localeCompare(b.start || ""));

  const today = new Date();

  return (
    <section style={{ paddingTop: 32 }}>
      <div
        className="fade"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "var(--cream)",
            border: "1.5px solid var(--ink)",
            borderRadius: "28px 28px 28px 6px",
            padding: "16px 28px",
            boxShadow: "3px 3px 0 var(--ink)",
            transform: "rotate(-1deg)",
            display: "flex",
            alignItems: "baseline",
            gap: 14,
          }}
        >
          <span style={{ fontSize: 28 }}><NI icon="noto:spiral-calendar" size={20} /></span>
          <div>
            <div
              style={{
                fontFamily: "var(--title-font)",
                fontSize: 36,
                fontWeight: 600,
                color: "var(--ink)",
                lineHeight: 1,
              }}
            >
              {mm.zh}
              <span
                style={{
                  fontSize: 16,
                  color: "var(--ink-mute)",
                  marginLeft: 10,
                  fontWeight: 400,
                }}
              >
                {year}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--label-font)",
                fontSize: 11,
                color: "var(--ink-soft)",
                letterSpacing: "0.15em",
                marginTop: 2,
              }}
            >
              {mm.en.toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn-journal"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            ← 前月
          </button>
          <button
            className="btn-journal btn-peach"
            onClick={() =>
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
            }
          >
            今天
          </button>
          <button
            className="btn-journal"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            次月 →
          </button>
        </div>
      </div>

      <div
        className="fade"
        style={{
          animationDelay: "0.1s",
          background: "var(--cream)",
          borderRadius: 24,
          border: "1.5px solid var(--ink)",
          boxShadow: "4px 5px 0 var(--ink-mute)",
          padding: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {WEEKDAYS_ZH.map((w, i) => (
            <div
              key={w}
              style={{
                textAlign: "center",
                padding: "8px 4px",
                fontFamily: "var(--label-font)",
                fontSize: 13,
                fontWeight: 600,
                color: i === 5 ? "#5D8DB5" : i === 6 ? "var(--accent)" : "var(--ink-soft)",
              }}
            >
              {w}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          {cells.map((date, i) => (
            <CalendarCell
              key={i}
              date={date}
              events={date ? eventsOnDate(date) : []}
              isToday={date && sameDay(date, today)}
              dayOfWeek={i % 7}
              onEventClick={setSelectedEvent}
              onShowMore={(d, evs) => setSelectedDay({ date: d, events: evs })}
            />
          ))}
        </div>
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(ev) => {
            setSelectedEvent(null);
            onEdit && onEdit(ev);
          }}
          onDelete={(ev) => {
            setSelectedEvent(null);
            onDelete && onDelete(ev);
          }}
        />
      )}

      {selectedDay && (
        <DayEventsModal
          date={selectedDay.date}
          events={selectedDay.events}
          onClose={() => setSelectedDay(null)}
          onEventClick={(ev) => {
            setSelectedDay(null);
            setSelectedEvent(ev);
          }}
        />
      )}
    </section>
  );
}

function CalendarCell({ date, events, isToday, dayOfWeek, onEventClick, onShowMore }) {
  const isSat = dayOfWeek === 5;
  const isSun = dayOfWeek === 6;

  if (!date) {
    return (
      <div
        style={{
          minHeight: "clamp(60px, 10vw, 120px)",
          borderRadius: 12,
          background:
            "repeating-linear-gradient(45deg, transparent 0 6px, var(--paper-2) 6px 7px)",
          opacity: 0.4,
        }}
      />
    );
  }

  const MAX_VISIBLE = 2;
  const visible = events.slice(0, MAX_VISIBLE);
  const hiddenCount = events.length - MAX_VISIBLE;

  return (
    <div
      style={{
        minHeight: "clamp(60px, 10vw, 120px)",
        borderRadius: 14,
        padding: "clamp(4px, 1vw, 8px)",
        background: isToday ? "var(--yellow)" : "var(--paper)",
        border: isToday ? "2px dashed var(--accent)" : "1px solid var(--line)",
        position: "relative",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        overflow: "hidden",
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "2px 3px 0 var(--line)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: "var(--title-font)",
            fontSize: isToday ? 20 : 17,
            fontWeight: isToday ? 600 : 500,
            color: isToday
              ? "var(--accent)"
              : isSun
              ? "var(--accent)"
              : isSat
              ? "#5D8DB5"
              : "var(--ink)",
            lineHeight: 1,
          }}
        >
          {date.getDate()}
        </span>
        {isToday && (
          <span
            style={{
              fontFamily: "var(--hand-font)",
              fontSize: 11,
              color: "var(--accent)",
              background: "var(--cream)",
              padding: "1px 8px",
              borderRadius: 999,
              border: "1px solid var(--accent)",
            }}
          >
            今天
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        {visible.map((ev) => {
          const meta = TYPE_META[ev.type];
          return (
            <button
              key={ev.id}
              onClick={(e) => {
                e.stopPropagation();
                onEventClick(ev);
              }}
              title={`${ev.start || ""} ${ev.title}`}
              style={{
                background: meta.bg,
                border: `1px solid ${meta.border}`,
                borderRadius: 8,
                padding: "3px 6px",
                fontSize: 10.5,
                color: meta.ink,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                fontFamily: "var(--body-font)",
                textAlign: "left",
                minWidth: 0,
                width: "100%",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `1px 2px 0 ${meta.border}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span style={{ fontSize: 10, flexShrink: 0 }}>{meta.emoji}</span>
              {ev.start && (
                <span
                  style={{
                    fontFamily: "var(--label-font)",
                    fontSize: 9.5,
                    fontWeight: 600,
                    flexShrink: 0,
                    opacity: 0.85,
                  }}
                >
                  {ev.start}
                </span>
              )}
              <span
                style={{
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {ev.title}
              </span>
            </button>
          );
        })}
        {hiddenCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowMore(date, events);
            }}
            style={{
              fontFamily: "var(--hand-font)",
              fontSize: 11,
              color: "var(--ink-soft)",
              background: "var(--cream)",
              border: "1px dashed var(--ink-mute)",
              borderRadius: 8,
              padding: "2px 6px",
              textAlign: "left",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ＋ 還有 {hiddenCount} 件
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EventDetailModal — 點日曆事件後開啟的詳細卡片
// ─────────────────────────────────────────────────────────────
function EventDetailModal({ event, onClose, onEdit, onDelete }) {
  const meta = TYPE_META[event.type];
  const d = event.date ? parseYMD(event.date) : null;
  const weekday = d ? WEEKDAY_SHORT[d.getDay()] : "—";
  const mm = d ? MONTH_LABELS[d.getMonth()] : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(74, 63, 54, 0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 150,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "softFade 0.25s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pop"
        style={{
          "--tilt": "0deg",
          background: meta.bgSoft,
          maxWidth: 460,
          width: "100%",
          padding: 32,
          borderRadius: 24,
          border: `1.5px solid ${meta.border}`,
          boxShadow: `5px 7px 0 ${meta.border}`,
          position: "relative",
        }}
      >
        {/* masking tape */}
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "20%",
            transform: "rotate(-4deg)",
            width: 100,
            height: 24,
            background: meta.tape,
            opacity: 0.85,
            borderRadius: 2,
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 5px, rgba(255,255,255,0.35) 5px 9px)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        />

        {/* 右上角關閉 */}
        <button
          onClick={onClose}
          aria-label="close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: `1px solid ${meta.border}`,
            background: "var(--cream)",
            cursor: "pointer",
            fontSize: 14,
            color: "var(--ink-soft)",
            fontFamily: "var(--body-font)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          <NI icon="noto:cross-mark" size={13} />
        </button>

        {/* 類型 chip */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: meta.bg,
            border: `1px solid ${meta.border}`,
            padding: "3px 12px 3px 8px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            color: meta.ink,
            marginBottom: 14,
          }}
        >
          <span>{meta.emoji}</span>
          {meta.zh}
        </div>

        {/* 標題 */}
        <h2
          style={{
            fontFamily: "var(--title-font)",
            fontSize: 26,
            fontWeight: 600,
            color: "var(--ink)",
            lineHeight: 1.25,
            marginBottom: 18,
          }}
        >
          {event.title}
        </h2>

        {/* 日期時間 */}
        <div
          style={{
            background: "var(--cream)",
            border: `1px dashed ${meta.border}`,
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div
              style={{
                fontFamily: "var(--label-font)",
                fontSize: 10,
                color: "var(--ink-mute)",
                letterSpacing: "0.15em",
              }}
            >
              {mm ? `${mm.zh} ・ ${"週" + weekday}` : "—"}
            </div>
            <div
              style={{
                fontFamily: "var(--title-font)",
                fontSize: 40,
                fontWeight: 600,
                color: meta.ink,
                lineHeight: 1,
                marginTop: 2,
              }}
            >
              {d ? d.getDate() : "—"}
            </div>
            <div
              style={{
                fontFamily: "var(--label-font)",
                fontSize: 10,
                color: "var(--ink-mute)",
                marginTop: 2,
              }}
            >
              {d ? d.getFullYear() : ""}
            </div>
          </div>
          <div
            style={{
              width: 1,
              alignSelf: "stretch",
              backgroundImage:
                "linear-gradient(to bottom, transparent 0, var(--ink-mute) 3px, var(--ink-mute) 6px, transparent 6px)",
              backgroundSize: "1px 8px",
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--hand-font)",
                fontSize: 13,
                color: "var(--ink-mute)",
                marginBottom: 2,
              }}
            >
              <NI icon="noto:one-oclock" size={15} /> 時間
            </div>
            <div
              style={{
                fontFamily: "var(--body-font)",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              {event.start || "—"}
              <span style={{ color: "var(--ink-mute)", margin: "0 8px" }}>→</span>
              {event.end || "—"}
            </div>
          </div>
        </div>

        {/* 地點 & 對象 */}
        {(event.location || event.with) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {event.location && (
              <DetailRow icon="📍" label="地點" value={event.location} meta={meta} />
            )}
            {event.with && (
              <DetailRow icon="👥" label="對象" value={event.with} meta={meta} />
            )}
          </div>
        )}

        {/* 備註 */}
        {event.note && (
          <div
            style={{
              background: "var(--cream)",
              border: `1px dashed ${meta.border}`,
              borderRadius: 14,
              padding: "12px 14px",
              fontFamily: "var(--hand-font)",
              fontSize: 15,
              color: meta.ink,
              lineHeight: 1.6,
              display: "flex",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span style={{ opacity: 0.6, flexShrink: 0 }}><NI icon="noto:pencil" size={14} /></span>
            <span>{event.note}</span>
          </div>
        )}

        {/* 編輯 / 刪除 按鈕列 */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            paddingTop: 12,
            borderTop: `1px dashed ${meta.border}`,
          }}
        >
          <button
            className="btn-journal"
            onClick={() => onDelete && onDelete(event)}
            style={{
              background: "#FDE8E8",
              borderColor: "#B85A5A",
              color: "#8A3D3D",
              boxShadow: "2px 2px 0 #B85A5A",
              fontSize: 13,
              padding: "8px 16px",
            }}
          >
            <NI icon="noto:wastebasket" size={18} /> 刪除
          </button>
          <button
            className="btn-journal btn-peach"
            onClick={() => onEdit && onEdit(event)}
            style={{ fontSize: 13, padding: "8px 16px" }}
          >
            <NI icon="noto:pencil" size={14} /> 編輯
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, meta }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 12px",
        background: "var(--cream)",
        borderRadius: 12,
        border: `1px solid ${meta.border}`,
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--label-font)",
            fontSize: 10,
            color: "var(--ink-mute)",
            letterSpacing: "0.1em",
            marginBottom: 1,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--ink)",
            fontWeight: 500,
            wordBreak: "break-word",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DayEventsModal — 點「+ 還有 N 件」後顯示當日所有活動清單
// ─────────────────────────────────────────────────────────────
function DayEventsModal({ date, events, onClose, onEventClick }) {
  const weekday = WEEKDAY_SHORT[date.getDay()];
  const mm = MONTH_LABELS[date.getMonth()];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(74, 63, 54, 0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 150,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "softFade 0.25s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pop"
        style={{
          "--tilt": "0deg",
          background: "var(--cream)",
          maxWidth: 440,
          width: "100%",
          padding: 28,
          borderRadius: 24,
          border: "1.5px solid var(--ink)",
          boxShadow: "5px 7px 0 var(--accent)",
          position: "relative",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <button
          onClick={onClose}
          aria-label="close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "1px solid var(--line)",
            background: "var(--paper)",
            cursor: "pointer",
            fontSize: 14,
            color: "var(--ink-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          <NI icon="noto:cross-mark" size={13} />
        </button>

        <div
          style={{
            fontFamily: "var(--hand-font)",
            fontSize: 14,
            color: "var(--ink-soft)",
            marginBottom: 4,
          }}
        >
          {mm.zh} {date.getDate()} 日（{"週" + weekday}）
        </div>
        <h2
          style={{
            fontFamily: "var(--title-font)",
            fontSize: 26,
            fontWeight: 600,
            color: "var(--ink)",
            marginBottom: 18,
          }}
        >
          這天的行程 ・ {events.length} 件
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {events.map((ev) => {
            const meta = TYPE_META[ev.type];
            return (
              <button
                key={ev.id}
                onClick={() => onEventClick(ev)}
                style={{
                  background: meta.bgSoft,
                  border: `1.5px solid ${meta.border}`,
                  borderRadius: 16,
                  padding: "12px 14px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--body-font)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translate(-2px, -2px)";
                  e.currentTarget.style.boxShadow = `3px 4px 0 ${meta.border}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translate(0, 0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: 52,
                    textAlign: "center",
                    flexShrink: 0,
                    fontFamily: "var(--label-font)",
                    fontSize: 13,
                    color: meta.ink,
                    fontWeight: 600,
                  }}
                >
                  {ev.start || "—"}
                </div>
                <div
                  style={{
                    width: 1,
                    alignSelf: "stretch",
                    background: meta.border,
                    opacity: 0.6,
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: meta.ink,
                      marginBottom: 2,
                    }}
                  >
                    <span>{meta.emoji}</span>
                    {meta.zh}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--title-font)",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--ink)",
                      lineHeight: 1.3,
                    }}
                  >
                    {ev.title}
                  </div>
                  {ev.location && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--ink-soft)",
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <NI icon="noto:round-pushpin" size={15} /> {ev.location}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}