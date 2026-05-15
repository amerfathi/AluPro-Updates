import {
  AlertCircle,
  AppWindow,
  Bell,
  CheckCircle2,
  ChevronDown,
  DownloadCloud,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  X
} from 'lucide-react'

const chipThemes = [
  {
    stripe: 'bg-[#5568ff]',
    badge: 'bg-[#eef1ff] text-[#5568ff]'
  },
  {
    stripe: 'bg-[#60d1c3]',
    badge: 'bg-[#ebfbf8] text-[#2caea1]'
  },
  {
    stripe: 'bg-[#8b7cff]',
    badge: 'bg-[#f1eeff] text-[#6c5ce7]'
  },
  {
    stripe: 'bg-[#ff8dad]',
    badge: 'bg-[#fff1f6] text-[#ff6d96]'
  }
]

const AppShell = ({
  appTitle,
  companyName,
  companyLogo,
  activeTab,
  activeLabel,
  activeDescription,
  navSections,
  onNavigate,
  onReset,
  expiryDate,
  workspaceChips,
  updateState,
  onStartDownload,
  onRestartAndInstall,
  systemMessage,
  onDismissSystemMessage,
  children
}) => {
  const {
    updateAvailable = false,
    downloadProgress = 0,
    updateReady = false,
    isDownloading = false,
    updateError = ''
  } = updateState || {}

  const userLabel = companyName || 'مصنع الألمنيوم'

  return (
    <div
      className="alu-app-shell print-wrapper flex min-h-[100dvh] w-full flex-col overflow-hidden text-[var(--alu-text)] lg:h-screen lg:flex-row"
      dir="rtl"
    >
      <aside
        className="hidden h-full w-[17rem] shrink-0 flex-col border-l border-white/6 px-4 py-5 text-[#eef2ff] shadow-[0_24px_58px_rgba(11,17,34,0.32)] print:hidden lg:flex"
        style={{
          background: `
            radial-gradient(circle at top, rgba(85, 104, 255, 0.18), transparent 28%),
            linear-gradient(180deg, #0f1629 0%, #131c32 38%, #1a2443 100%)
          `
        }}
      >
        <div className="rounded-[1.9rem] border border-white/10 bg-white/[0.05] px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-[rgba(255,255,255,0.08)] ring-1 ring-white/10">
              {companyLogo ? (
                <img src={companyLogo} alt={appTitle} className="h-8 w-8 rounded-xl object-cover" />
              ) : (
                <AppWindow className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-extrabold text-[#f7f9ff]">{appTitle}</div>
              <div className="mt-1 text-[12px] font-semibold leading-5 text-[#b9c3df]">
                منصة تسعير وإنتاج ومخزون للأبواب والنوافذ والواجهات.
              </div>
            </div>
          </div>
        </div>

        <div className="alu-scrollbar mt-5 flex-1 overflow-y-auto px-1">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6 last:mb-0">
              <div className="px-3 text-[11px] font-bold text-[#adb9d8]">{section.title}</div>

              <div className="mt-3 space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-[1.15rem] border px-3.5 py-3.5 text-right transition-all duration-200 ${
                        isActive
                          ? 'border-white/14 bg-[rgba(255,255,255,0.12)] shadow-[0_18px_30px_rgba(8,12,24,0.22)]'
                          : 'border-transparent hover:border-white/10 hover:bg-[rgba(255,255,255,0.06)]'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute inset-y-3 right-0 w-1 rounded-full bg-[#5568ff]" />
                      )}

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] transition-all ${
                          isActive
                            ? 'bg-[#5568ff] text-white shadow-[0_12px_24px_rgba(85,104,255,0.32)]'
                            : 'bg-white/8 text-[#e5eaff]'
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-extrabold leading-6 text-[#f6f8ff]">
                          {item.label}
                        </div>
                        <div className="mt-1 text-[12px] font-medium leading-5 text-[#aeb8d3]">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t border-white/8 px-1 pt-4">
          <button
            onClick={onReset}
            className="flex w-full items-center justify-center gap-2 rounded-[1.2rem] border border-white/10 bg-white/8 px-4 py-3.5 text-sm font-extrabold text-[#f7f9ff] transition-all hover:bg-white/12"
          >
            <RefreshCw size={16} />
            بدء مساحة عمل جديدة
          </button>

          {expiryDate && (
            <div className="flex items-center justify-center gap-2 rounded-[1.1rem] border border-white/8 bg-[rgba(255,255,255,0.05)] px-3 py-2 text-[12px] font-bold text-[#c8d1e8]">
              <ShieldCheck size={14} />
              صالح حتى: {expiryDate}
            </div>
          )}
        </div>
      </aside>

      <div className="print-content flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] print:hidden md:px-6 md:pt-4">
          <div className="alu-toolbar rounded-[1.9rem] px-5 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-black tracking-[0.14em] text-[var(--alu-text-soft)]">
                  مرحباً بعودتك، {userLabel}
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--alu-text)]">
                  {activeLabel}
                </h2>
                <p className="mt-1 max-w-2xl text-sm font-bold leading-6 text-[var(--alu-text-soft)]">
                  {activeDescription}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="relative hidden min-w-[280px] xl:block">
                  <Search
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--alu-text-soft)]"
                  />
                  <input
                    type="text"
                    placeholder="ابحث عن مشروع، عميل، أمر قص أو خامة"
                    className="h-11 w-full rounded-[1rem] border border-[rgba(225,230,246,0.95)] bg-[#f8faff] pr-11 pl-4 text-sm font-bold text-[var(--alu-text)] outline-none transition-all placeholder:text-[var(--alu-text-soft)]/70 focus:border-[rgba(85,104,255,0.25)] focus:bg-white focus:shadow-[0_10px_24px_rgba(85,104,255,0.08)]"
                  />
                </div>

                <button className="alu-icon-button" type="button">
                  <MessageSquareText size={18} />
                </button>

                <button className="alu-icon-button" type="button">
                  <Bell size={18} />
                </button>

                <div className="flex items-center gap-3 rounded-[1.2rem] border border-[rgba(225,230,246,0.95)] bg-white px-3.5 py-2.5 shadow-[0_12px_28px_rgba(31,38,72,0.06)]">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--alu-brand-soft)]">
                    {companyLogo ? (
                      <img
                        src={companyLogo}
                        alt={userLabel}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <AppWindow className="h-5 w-5 text-[var(--alu-accent)]" />
                    )}
                  </div>

                  <div className="hidden text-right sm:block">
                    <div className="text-sm font-black text-[var(--alu-text)]">{userLabel}</div>
                    <div className="text-[11px] font-bold text-[var(--alu-text-soft)]">
                      مساحة المصنع
                    </div>
                  </div>

                  <ChevronDown size={16} className="text-[var(--alu-text-soft)]" />
                </div>
              </div>
            </div>
          </div>

          {navSections?.length > 0 && (
            <div className="mt-4 lg:hidden">
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {navSections.flatMap((section) => section.items).map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      className={`flex shrink-0 items-center gap-2 rounded-[1rem] border px-3 py-2.5 text-sm font-black transition-all ${
                        isActive
                          ? 'border-[var(--alu-accent)] bg-[var(--alu-accent)] text-white shadow-[0_14px_28px_rgba(85,104,255,0.22)]'
                          : 'border-[rgba(225,230,246,0.95)] bg-white text-[var(--alu-text)]'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {workspaceChips?.length > 0 && (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {workspaceChips.map((chip, index) => {
                const theme = chipThemes[index % chipThemes.length]

                return (
                  <div
                    key={chip.label}
                    className="alu-panel relative overflow-hidden rounded-[1.55rem] px-5 py-4"
                  >
                    <div
                      className={`absolute inset-y-4 right-0 w-1.5 rounded-full ${theme.stripe}`}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[12px] font-black text-[var(--alu-text-soft)]">
                          {chip.label}
                        </div>
                        <div className="mt-3 text-2xl font-black tracking-tight text-[var(--alu-text)]">
                          {chip.value}
                        </div>
                      </div>

                      <div
                        className={`rounded-[0.9rem] px-2.5 py-1 text-[10px] font-black ${theme.badge}`}
                      >
                        مؤشر مباشر
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </header>

        <div className="px-4 print:hidden md:px-6">
          {updateAvailable && (
            <div className="alu-panel mb-4 rounded-[1.6rem] border-[rgba(225,230,246,0.95)] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-[1rem] bg-[var(--alu-accent-soft)] p-3 text-[var(--alu-accent)]">
                    <DownloadCloud size={24} />
                  </div>

                  <div>
                    <div className="text-base font-black text-[var(--alu-text)]">
                      تحديث جديد متوفر للنظام
                    </div>

                    {updateError ? (
                      <div className="mt-1 text-sm font-bold text-[var(--alu-danger)]">
                        {updateError}
                      </div>
                    ) : isDownloading ? (
                      <div className="mt-3 w-full max-w-sm">
                        <div className="mb-2 flex items-center justify-between text-xs font-black text-[var(--alu-text-soft)]">
                          <span>جاري تحميل التحديث</span>
                          <span>{downloadProgress}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-[#edf1fb]">
                          <div
                            className="h-2.5 rounded-full bg-[var(--alu-accent)] transition-all duration-300"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : updateReady ? (
                      <div className="mt-1 text-sm font-bold text-[#28b7a7]">
                        التحديث جاهز للتثبيت الآن.
                      </div>
                    ) : (
                      <div className="mt-1 text-sm font-bold text-[var(--alu-text-soft)]">
                        تحسينات جديدة في الواجهة والأداء متاحة لهذه النسخة.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-3">
                  {!isDownloading && !updateReady && (
                    <button
                      onClick={onStartDownload}
                      className="rounded-[1rem] bg-[var(--alu-accent)] px-5 py-3 text-sm font-black text-white transition-all hover:bg-[#4659f0]"
                    >
                      تحميل التحديث
                    </button>
                  )}

                  {updateReady && (
                    <button
                      onClick={onRestartAndInstall}
                      className="rounded-[1rem] bg-[#2ec5b5] px-5 py-3 text-sm font-black text-white transition-all hover:bg-[#24b3a4]"
                    >
                      إعادة التشغيل والتثبيت
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {systemMessage && (
            <div
              className={`alu-panel mb-4 rounded-[1.4rem] p-4 ${
                systemMessage.type === 'error'
                  ? 'border-[rgba(255,141,173,0.18)] bg-[var(--alu-danger-soft)] text-[#d55f84]'
                  : 'border-[rgba(96,209,195,0.16)] bg-[var(--alu-success-soft)] text-[#2caea1]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {systemMessage.type === 'error' ? (
                    <AlertCircle size={22} />
                  ) : (
                    <CheckCircle2 size={22} />
                  )}
                </div>
                <div className="flex-1 whitespace-pre-line text-sm font-black leading-7">
                  {systemMessage.text}
                </div>
                <button
                  onClick={onDismissSystemMessage}
                  className="rounded-xl bg-black/5 p-2 opacity-70 transition-all hover:opacity-100"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <main className="alu-workspace alu-scrollbar flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] print:px-0 print:pb-0 md:px-6 md:pb-10">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell
