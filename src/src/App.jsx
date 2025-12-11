/**
Aula Booking - Single-file React app (App.jsx)

Perubahan: ditambahkan Dashboard kalender.
Fitur baru:
- Ketika nama aula dipencet, tampilan kanan menampilkan kalender bulan (dashboard) untuk aula tersebut.
- Tanggal yang sudah ada pemesanan akan diberi tanda. Klik tanggal untuk lihat daftar pemesanan hari itu.
- Klik baris pemesanan akan membuka detail (jam mulai/selesai, peruntukan, PIC, catatan) dalam modal.

Cara pakai: sama seperti sebelumnya — paste file ini ke `src/App.jsx`, jalankan `npm run dev`.

Catatan: data masih disimpan di localStorage. Kalau mau sinkron ke server nanti, bilang — gw bakal tambahin.
*/

import React, { useEffect, useState } from 'react'

const AULAS = [
  { id: 'sibayak', name: 'Sibayak' },
  { id: 'sinabung', name: 'Sinabung' },
  { id: 'sibuatan', name: 'Sibuatan' },
  { id: 'sibolangit', name: 'Sibolangit' },
]

const STORAGE_KEY = 'kanwil_aula_bookings_v1'

function loadBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.error('gagal load bookings', e)
    return []
  }
}

function saveBookings(bookings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
}

export default function App() {
  const [bookings, setBookings] = useState(loadBookings())
  const [selectedAula, setSelectedAula] = useState(AULAS[0].id)
  const [viewDate, setViewDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [message, setMessage] = useState(null)
  const [showCalendar, setShowCalendar] = useState(true) // when aula clicked, show calendar by default

  useEffect(() => {
    saveBookings(bookings)
  }, [bookings])

  function addBooking(newBooking) {
    const sameAula = bookings.filter(b => b.aulaId === newBooking.aulaId && b.date === newBooking.date)
    const toMinutes = (t) => {
      const [hh, mm] = t.split(':').map(Number)
      return hh * 60 + mm
    }
    const s = toMinutes(newBooking.start)
    const e = toMinutes(newBooking.end)
    if (e <= s) {
      setMessage({ type: 'error', text: 'Jam selesai harus lebih besar dari jam mulai.' })
      return false
    }
    for (const ex of sameAula) {
      const es = toMinutes(ex.start)
      const ee = toMinutes(ex.end)
      if (!(e <= es || s >= ee)) {
        setMessage({ type: 'error', text: `Waktu bentrok dengan pemesanan lain (${ex.start} - ${ex.end}).` })
        return false
      }
    }
    const withId = { id: Date.now().toString(), ...newBooking }
    const next = [...bookings, withId].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    setBookings(next)
    setMessage({ type: 'success', text: 'Pemesanan berhasil disimpan.' })
    return true
  }

  function cancelBooking(id) {
    if (!confirm('Yakin mau batalkan pemesanan ini?')) return
    const next = bookings.filter(b => b.id !== id)
    setBookings(next)
    setMessage({ type: 'success', text: 'Pemesanan dibatalkan.' })
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Aplikasi Pemesanan & Monitoring Aula — Kanwil DPJb Sumut</h1>
          <div className="text-sm text-slate-600">Aula aktif: {AULAS.find(a => a.id === selectedAula).name}</div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="md:col-span-1 bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-3">Daftar Aula</h2>
            <ul>
              {AULAS.map(a => (
                <li key={a.id}
                    className={`p-2 rounded cursor-pointer flex justify-between items-center ${selectedAula === a.id ? 'bg-slate-100' : ''}`}
                    onClick={() => { setSelectedAula(a.id) ; setShowCalendar(true) }}>
                  <span>{a.name}</span>
                  <button className="text-xs px-2 py-1 border rounded" onClick={(e) => { e.stopPropagation(); setSelectedAula(a.id); setShowCalendar(false) }}>Lihat daftar</button>
                </li>
              ))}
            </ul>

            <hr className="my-4" />

            <h3 className="font-semibold mb-2">Pilihan</h3>
            <div className="flex flex-col gap-2">
              <label className="text-sm">Tanggal cepat</label>
              <input type="date" value={viewDate} onChange={(e) => { setViewDate(e.target.value); setShowCalendar(false) }} className="w-full p-2 border rounded" />
            </div>

            <div className="mt-4 text-sm text-slate-700">
              <strong>Catatan:</strong>
              <div>Data disimpan di browser. Gunakan tombol export/import jika mau simpan cadangan.</div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(bookings)) ; setMessage({type:'success', text:'Bookings disalin ke clipboard (JSON).' }) }} className="px-3 py-2 bg-slate-800 text-white rounded">Salin JSON</button>
              <button onClick={() => { const txt = prompt('Paste JSON bookings untuk import:') ; if (txt) { try { const data = JSON.parse(txt) ; setBookings(Array.isArray(data) ? data : []) ; setMessage({type:'success', text:'Import selesai.'}) } catch(e){ setMessage({type:'error', text:'JSON gagal di-parse.'}) } } }} className="px-3 py-2 border rounded">Import JSON</button>
            </div>
          </aside>

          <section className="md:col-span-3 bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Dashboard — {AULAS.find(a => a.id === selectedAula).name}</h2>
              <div className="flex items-center gap-3">
                <button className={`px-3 py-1 rounded ${showCalendar ? 'bg-slate-800 text-white' : 'border'}`} onClick={() => setShowCalendar(true)}>Kalender</button>
                <button className={`px-3 py-1 rounded ${!showCalendar ? 'bg-slate-800 text-white' : 'border'}`} onClick={() => setShowCalendar(false)}>Daftar Hari</button>
              </div>
            </div>

            {showCalendar ? (
              <CalendarDashboard bookings={bookings} aulaId={selectedAula} onDateSelect={(d)=>{ setViewDate(d) ; setShowCalendar(false) }} />
            ) : (
              <div>
                <div className="mb-3">Menampilkan daftar pemesanan tanggal: <strong>{viewDate}</strong></div>
                <Schedule bookings={bookings} aulaId={selectedAula} date={viewDate} onCancel={cancelBooking} />
              </div>
            )}

            <hr className="my-4" />

            <h3 className="font-semibold mb-2">Form Pemesanan</h3>
            <BookingForm defaultAula={selectedAula} onSubmit={(b) => addBooking(b)} />

            {message && (
              <div className={`mt-4 p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{message.text}</div>
            )}

          </section>
        </main>

        <footer className="mt-6 text-sm text-slate-600">Versi uji - data tidak tersimpan di server. Untuk kebutuhan produksi butuh backend (kita bisa tambahin nanti).</footer>
      </div>
    </div>
  )
}

// ----------------- Calendar Dashboard -----------------
function CalendarDashboard({ bookings, aulaId, onDateSelect }) {
  const [cursor, setCursor] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [modalBooking, setModalBooking] = useState(null)

  useEffect(()=>{ if (selectedDay) onDateSelect(formatDate(selectedDay)) }, [selectedDay])

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
  const startWeekDay = monthStart.getDay() // 0 Sun ... 6 Sat

  function prevMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
  }

  // build calendar grid as array of dates (including prev/next month to fill weeks)
  const days = []
  const firstDayIndex = startWeekDay
  const totalCells = 42 // 6 weeks view
  for (let i = 0; i < totalCells; i++) {
    const dayNumber = i - firstDayIndex + 1
    const dateObj = new Date(cursor.getFullYear(), cursor.getMonth(), dayNumber)
    days.push(dateObj)
  }

  function bookingsForDate(date) {
    const key = formatDate(date)
    return bookings.filter(b => b.aulaId === aulaId && b.date === key).sort((a,b)=>a.start.localeCompare(b.start))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <button onClick={prevMonth} className="px-2 py-1 border rounded mr-2">◀</button>
          <button onClick={nextMonth} className="px-2 py-1 border rounded">▶</button>
        </div>
        <div className="font-semibold">{cursor.toLocaleString(undefined, { month: 'long' })} {cursor.getFullYear()}</div>
        <div />
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=> <div key={d} className="py-1 font-medium">{d}</div>)}
        {days.map((d, idx)=>{
          const isCurrentMonth = d.getMonth() === cursor.getMonth()
          const key = formatDate(d)
          const list = bookingsForDate(d)
          return (
            <div key={idx} className={`p-2 h-20 border rounded ${isCurrentMonth ? '' : 'text-slate-400 bg-slate-50'}`}>
              <div className="flex justify-between items-start">
                <div className="text-xs">{d.getDate()}</div>
                <div className="text-xs">{list.length > 0 && <span className="text-[10px] px-1 py-0.5 border rounded">{list.length}</span>}</div>
              </div>

              <div className="mt-2 text-xs text-left overflow-hidden" style={{height: '3.2rem'}}>
                {list.slice(0,3).map(b => (
                  <div key={b.id} className="text-xxs truncate cursor-pointer" onClick={(e)=>{ e.stopPropagation(); setModalBooking(b) }}>{b.start} {b.purpose}</div>
                ))}
                {list.length > 3 && <div className="text-xxs mt-1">+{list.length - 3} lainnya</div>}
              </div>

              <div className="mt-2">
                <button onClick={() => { setSelectedDay(d) }} className="text-xs px-2 py-1 border rounded">Lihat</button>
              </div>
            </div>
          )
        })}
      </div>

      {modalBooking && (
        <BookingDetailModal booking={modalBooking} onClose={() => setModalBooking(null)} />
      )}
    </div>
  )
}

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2,'0')
  const dd = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${dd}`
}

function BookingDetailModal({ booking, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded shadow max-w-md w-full">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Detail Pemesanan</h3>
          <button onClick={onClose} className="px-2 py-1 border rounded">Tutup</button>
        </div>
        <div className="text-sm">
          <div><strong>Aula:</strong> {booking.aulaId}</div>
          <div><strong>Tanggal:</strong> {booking.date}</div>
          <div><strong>Waktu:</strong> {booking.start} - {booking.end}</div>
          <div><strong>Peruntukan:</strong> {booking.purpose}</div>
          <div><strong>PIC WA:</strong> {booking.pic}</div>
          <div><strong>Catatan:</strong> {booking.note || '-'}</div>
        </div>
      </div>
    </div>
  )
}

// ----------------- Schedule & Form (reuse) -----------------
function Schedule({ bookings, aulaId, date, onCancel }) {
  const list = bookings.filter(b => b.aulaId === aulaId && b.date === date).sort((a,b)=>a.start.localeCompare(b.start))
  if (list.length === 0) {
    return <div className="p-4 text-slate-500">Belum ada pemesanan untuk tanggal ini.</div>
  }
  return (
    <div className="mt-3">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-sm text-slate-600">
            <th className="py-2">Waktu</th>
            <th className="py-2">Peruntukan</th>
            <th className="py-2">PIC WA</th>
            <th className="py-2">Catatan</th>
            <th className="py-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {list.map(b => (
            <tr key={b.id} className="border-t">
              <td className="py-2 align-top">{b.start} - {b.end}</td>
              <td className="py-2 align-top">{b.purpose}</td>
              <td className="py-2 align-top">{b.pic}</td>
              <td className="py-2 align-top">{b.note || '-'}</td>
              <td className="py-2 align-top"><button onClick={() => onCancel(b.id)} className="px-2 py-1 border rounded text-sm">Batal</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BookingForm({ defaultAula, onSubmit }) {
  const [aulaId, setAulaId] = useState(defaultAula)
  useEffect(()=> setAulaId(defaultAula), [defaultAula])
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('11:00')
  const [purpose, setPurpose] = useState('')
  const [pic, setPic] = useState('')
  const [note, setNote] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!purpose.trim() || !pic.trim()) {
      alert('Isi peruntukan dan No WA PIC minimal.')
      return
    }
    const payload = { aulaId, date, start, end, purpose, pic, note }
    const ok = onSubmit(payload)
    if (ok) {
      setPurpose('')
      setNote('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="text-sm">Aula</label>
        <select value={aulaId} onChange={(e)=>setAulaId(e.target.value)} className="w-full p-2 border rounded">
          {AULAS.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm">Tanggal</label>
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="w-full p-2 border rounded" />
      </div>

      <div>
        <label className="text-sm">Jam Mulai</label>
        <input type="time" value={start} onChange={(e)=>setStart(e.target.value)} className="w-full p-2 border rounded" />
      </div>

      <div>
        <label className="text-sm">Jam Selesai</label>
        <input type="time" value={end} onChange={(e)=>setEnd(e.target.value)} className="w-full p-2 border rounded" />
      </div>

      <div className="md:col-span-2">
        <label className="text-sm">Peruntukan</label>
        <input type="text" value={purpose} onChange={(e)=>setPurpose(e.target.value)} placeholder="Misal: Pelatihan, Rapat, Acara ..." className="w-full p-2 border rounded" />
      </div>

      <div>
        <label className="text-sm">No WA PIC</label>
        <input type="text" value={pic} onChange={(e)=>setPic(e.target.value)} placeholder="62812xxxx atau 0812xxxx" className="w-full p-2 border rounded" />
      </div>

      <div>
        <label className="text-sm">Catatan (opsional)</label>
        <input type="text" value={note} onChange={(e)=>setNote(e.target.value)} className="w-full p-2 border rounded" />
      </div>

      <div className="md:col-span-2 flex gap-2">
        <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded">Pesan Aula</button>
        <button type="button" onClick={()=>{ setPurpose(''); setPic(''); setNote('') }} className="px-4 py-2 border rounded">Reset</button>
      </div>
    </form>
  )
}
