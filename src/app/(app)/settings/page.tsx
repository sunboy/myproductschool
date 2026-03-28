'use client'

import { useState } from 'react'
import { LumaGlyph } from '@/components/shell/LumaGlyph'

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
        enabled ? 'bg-primary' : 'bg-outline-variant'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
          enabled ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const [dailyGoal, setDailyGoal] = useState(3)
  const [notifications, setNotifications] = useState({
    dailyQuickTake: true,
    streakAlert: true,
    weeklyResults: true,
    levelUp: true,
    lumaTips: false,
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top App Bar */}
      <header className="flex justify-between items-center w-full px-8 py-6 sticky top-0 z-40 bg-surface border-b border-on-surface/10">
        <div className="flex items-center space-x-4">
          <button className="material-symbols-outlined text-primary hover:opacity-70 transition-all">arrow_back</button>
          <h2 className="font-headline text-2xl text-primary-container">Settings</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button className="material-symbols-outlined text-on-surface-variant hover:opacity-70">more_vert</button>
        </div>
      </header>

      {/* Content Canvas */}
      <div className="max-w-4xl w-full mx-auto px-8 py-12 flex flex-col space-y-12 animate-fade-in-up">
        {/* 1. ACCOUNT */}
        <section className="card-elevated rounded-xl p-8">
          <h3 className="font-label text-xs font-bold uppercase tracking-[0.2em] text-outline mb-8">ACCOUNT</h3>
          <div className="flex items-center space-x-6 mb-10">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary text-2xl font-headline font-bold">S</div>
            <div>
              <button className="text-primary font-bold hover:underline">Change photo</button>
            </div>
          </div>
          <div className="space-y-6">
            {/* Name Row */}
            <div className="flex justify-between items-center py-4 border-b border-outline-variant/20">
              <div>
                <label className="block text-xs text-outline font-bold mb-1">Display name</label>
                <p className="font-body text-lg">Sandeep</p>
              </div>
              <button className="material-symbols-outlined text-outline hover:text-primary transition-colors">edit</button>
            </div>
            {/* Email Row */}
            <div className="flex justify-between items-center py-4 border-b border-outline-variant/20">
              <div>
                <label className="block text-xs text-outline font-bold mb-1">Email</label>
                <p className="font-body text-lg">sandeep@example.com</p>
              </div>
              <button className="material-symbols-outlined text-outline hover:text-primary transition-colors">edit</button>
            </div>
            {/* Role Row */}
            <div className="flex justify-between items-center py-4 border-b border-outline-variant/20">
              <div>
                <label className="block text-xs text-outline font-bold mb-1">Role</label>
                <p className="font-body text-lg italic">Engineer &rarr; PM</p>
              </div>
              <button className="material-symbols-outlined text-outline hover:text-primary transition-colors">edit</button>
            </div>
          </div>
          <div className="mt-10">
            <button className="bg-primary-container text-on-primary px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all">Save changes</button>
          </div>
        </section>

        {/* 2. NOTIFICATIONS */}
        <section className="card-elevated rounded-xl p-8">
          <h3 className="font-label text-xs font-bold uppercase tracking-[0.2em] text-outline mb-8">NOTIFICATIONS</h3>
          <div className="space-y-2">
            {/* Item 1 */}
            <div className="flex justify-between items-center h-16 px-4 hover:bg-surface-container rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <span className="font-body">Daily Quick Take reminder</span>
                <span className="bg-primary-container/10 text-primary-container text-xs px-2 py-1 rounded font-bold">9:00 AM</span>
              </div>
              <Toggle enabled={notifications.dailyQuickTake} onToggle={() => toggleNotification('dailyQuickTake')} />
            </div>
            {/* Item 2 */}
            <div className="flex justify-between items-center h-20 px-4 hover:bg-surface-container rounded-lg transition-colors">
              <div>
                <p className="font-body">Streak at-risk alert</p>
                <p className="text-xs text-outline">6:00 PM if not practiced</p>
              </div>
              <Toggle enabled={notifications.streakAlert} onToggle={() => toggleNotification('streakAlert')} />
            </div>
            {/* Item 3 */}
            <div className="flex justify-between items-center h-16 px-4 hover:bg-surface-container rounded-lg transition-colors">
              <span className="font-body">Weekly cohort results</span>
              <Toggle enabled={notifications.weeklyResults} onToggle={() => toggleNotification('weeklyResults')} />
            </div>
            {/* Item 4 */}
            <div className="flex justify-between items-center h-16 px-4 hover:bg-surface-container rounded-lg transition-colors">
              <span className="font-body">Level up celebrations</span>
              <Toggle enabled={notifications.levelUp} onToggle={() => toggleNotification('levelUp')} />
            </div>
            {/* Item 5 */}
            <div className="flex justify-between items-center h-16 px-4 hover:bg-surface-container rounded-lg transition-colors">
              <span className="font-body text-outline">Luma coaching tips</span>
              <Toggle enabled={notifications.lumaTips} onToggle={() => toggleNotification('lumaTips')} />
            </div>
          </div>
        </section>

        {/* 3. LEARNING */}
        <section className="card-elevated rounded-xl p-8">
          <h3 className="font-label text-xs font-bold uppercase tracking-[0.2em] text-outline mb-8">LEARNING</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Daily Goal */}
            <div className="p-4 bg-surface rounded-lg">
              <label className="block text-xs text-outline font-bold mb-3">Daily goal</label>
              <div className="flex items-center justify-between">
                <span className="font-headline text-xl">{dailyGoal} challenges</span>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setDailyGoal(Math.max(1, dailyGoal - 1))}
                    className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary-container hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <button
                    onClick={() => setDailyGoal(Math.min(10, dailyGoal + 1))}
                    className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary-container hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
            </div>
            {/* Flow Focus */}
            <div className="p-4 bg-surface rounded-lg">
              <label className="block text-xs text-outline font-bold mb-3">Preferred FLOW focus</label>
              <div className="flex items-center justify-between cursor-pointer">
                <span className="font-headline text-xl">Lens</span>
                <span className="material-symbols-outlined text-outline">expand_more</span>
              </div>
            </div>
            {/* Difficulty */}
            <div className="p-4 bg-surface rounded-lg">
              <label className="block text-xs text-outline font-bold mb-3">Challenge difficulty</label>
              <div className="flex items-center justify-between cursor-pointer">
                <span className="font-headline text-xl">Mixed</span>
                <span className="material-symbols-outlined text-outline">expand_more</span>
              </div>
            </div>
            {/* Timezone */}
            <div className="p-4 bg-surface rounded-lg">
              <label className="block text-xs text-outline font-bold mb-3">Reminder timezone</label>
              <div className="flex items-center justify-between">
                <span className="font-headline text-xl">Asia/Kolkata</span>
                <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">Change</button>
              </div>
              <p className="text-[10px] text-outline mt-1">(IST)</p>
            </div>
          </div>
        </section>

        {/* 4. PLAN */}
        <section className="card-elevated rounded-xl p-8 border-l-4 border-primary">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="font-label text-xs font-bold uppercase tracking-[0.2em] text-outline mb-4">PLAN</h3>
              <div className="flex items-center space-x-3">
                <span className="font-headline text-3xl">Current plan</span>
                <span className="bg-outline-variant/30 text-on-surface text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest">Free</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <button className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all flex items-center space-x-2">
                <span>Upgrade to Pro</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <a className="text-xs text-outline font-bold hover:text-primary transition-colors" href="#">View billing history</a>
            </div>
          </div>
        </section>

        {/* 5. PRIVACY & SECURITY */}
        <section className="card-elevated rounded-xl p-8">
          <h3 className="font-label text-xs font-bold uppercase tracking-[0.2em] text-outline mb-8">PRIVACY &amp; SECURITY</h3>
          <div className="flex flex-col md:flex-row gap-8">
            <a className="flex items-center space-x-2 text-primary-container font-bold hover:opacity-70 transition-all group" href="#">
              <span className="material-symbols-outlined">download</span>
              <span>Export my data</span>
            </a>
            <a className="flex items-center space-x-2 text-error font-bold hover:opacity-70 transition-all group" href="#">
              <span className="material-symbols-outlined">delete_forever</span>
              <span>Delete account</span>
            </a>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-auto px-8 py-12 flex flex-col md:flex-row justify-between items-center border-t border-on-surface/5 bg-surface-container-low">
        <div className="text-on-surface-variant/60 font-label text-[10px] uppercase tracking-[0.25em] mb-4 md:mb-0">
          HackProduct v2.0 &middot; Sunboy Labs
        </div>
        <div className="flex space-x-6 text-on-surface-variant/60 font-label text-[10px] uppercase tracking-[0.25em]">
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  )
}
