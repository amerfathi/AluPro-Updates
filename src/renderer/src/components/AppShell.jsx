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
      className="alu-app-shell print-wrapper flex h-screen w-full overflow-hidden text-[13px] text-[var(--alu-text)]"
      dir="rtl"
    >
      <aside className="alu-sidebar hidden h-full w-[13.5rem] shrink-0 flex-col px-2.5 py-3 text-[#eef2ff] print:hidden lg:flex">
        <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.045] px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[0.75rem] bg-[rgba(255,255,255,0.08)] ring-1 ring-white/10">
              {companyLogo ? (
                <img src={companyLogo} alt={appTitle} className="h-6 w-6 rounded-md object-cover" />
              ) : (
                <AppWindow className="h-4 w-4 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-extrabold text-[#f7f9ff]">{appTitle}</div>
              <div className="mt-0.5 text-[10px] font-semibold leading-[1rem] text-[#b9c3df]">
                إدارة الإنتاج والمخزون
              </div>
            </div>
          </div>
        </div>

        <div className="alu-scrollbar mt-3 flex-1 overflow-y-auto px-1">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4 last:mb-0">
              <div className="px-2.5 text-[9px] font-bold tracking-[0.08em] text-[#adb9d8]">
                {section.title}
              </div>

              <div className="mt-2 space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`group relative flex w-full items-center gap-2 overflow-hidden rounded-[0.85rem] border px-2.5 py-2 text-right transition-all duration-200 ${
                        isActive
                          ? 'border-white/14 bg-[rgba(255,255,255,0.12)] shadow-[0_12px_20px_rgba(8,12,24,0.22)]'
                          : 'border-transparent hover:border-white/10 hover:bg-[rgba(255,255,255,0.06)]'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute inset-y-3 right-0 w-1 rounded-full bg-[#5568ff]" />
                      )}

                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.72rem] transition-all ${
                          isActive
                            ? 'bg-[#5568ff] text-white shadow-[0_12px_24px_rgba(85,104,255,0.32)]'
                            : 'bg-white/8 text-[#e5eaff]'
                        }`}
                      >
                        <Icon size={14} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-extrabold leading-5 text-[#f6f8ff]">
                          {item.label}
                        </div>
                        {isActive && (
                          <div className="mt-0.5 text-[9px] font-medium leading-4 text-[#aeb8d3]">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-white/8 px-1 pt-2.5">
          <button
            onClick={onReset}
            className="flex w-full items-center justify-center gap-2 rounded-[0.85rem] border border-white/10 bg-white/8 px-3 py-2 text-[12px] font-extrabold text-[#f7f9ff] transition-all hover:bg-white/12"
          >
            <RefreshCw size={14} />
            بدء مساحة عمل جديدة
          </button>

          {expiryDate && (
            <div className="flex items-center justify-center gap-2 rounded-[0.85rem] border border-white/8 bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-[10px] font-bold text-[#c8d1e8]">
              <ShieldCheck size={13} />
              صالح حتى: {expiryDate}
            </div>
          )}
        </div>
      </aside>

      <div className="print-content flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="px-3 pb-2.5 pt-2.5 print:hidden md:px-4">
          <div className="alu-toolbar rounded-[1rem] px-3.5 py-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="text-[9px] font-black tracking-[0.1em] text-[var(--alu-text-soft)]">
                  مرحباً بعودتك، {userLabel}
                </div>
                <h2 className="mt-1 text-[18px] font-black tracking-tight text-[var(--alu-text)]">
                  {activeLabel}
                </h2>
                <p className="mt-0.5 max-w-2xl text-[11px] font-bold leading-5 text-[var(--alu-text-soft)] xl:line-clamp-1">
                  {activeDescription}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="relative hidden min-w-[220px] 2xl:block">
                  <Search
                    size={14}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--alu-text-soft)]"
                  />
                  <input
                    type="text"
                    placeholder="بحث سريع"
                    className="h-8 w-full rounded-[0.75rem] border border-[rgba(214,220,232,0.95)] bg-[#f8fafe] pr-9 pl-3 text-[11px] font-bold text-[var(--alu-text)] outline-none transition-all placeholder:text-[var(--alu-text-soft)]/70 focus:border-[rgba(37,99,235,0.28)] focus:bg-white focus:shadow-[0_8px_18px_rgba(37,99,235,0.08)]"
                  />
                </div>

                <button className="alu-icon-button" type="button">
                  <MessageSquareText size={18} />
                </button>

                <button className="alu-icon-button" type="button">
                  <Bell size={18} />
                </button>

                <div className="flex items-center gap-2 rounded-[0.85rem] border border-[rgba(214,220,232,0.95)] bg-white px-2.5 py-1.5 shadow-[0_8px_16px_rgba(31,38,72,0.06)]">
                  <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[var(--alu-brand-soft)]">
                    {companyLogo ? (
                      <img
                        src={companyLogo}
                        alt={userLabel}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <AppWindow className="h-4 w-4 text-[var(--alu-accent)]" />
                    )}
                  </div>

                  <div className="hidden text-right sm:block">
                    <div className="text-[12px] font-black text-[var(--alu-text)]">{userLabel}</div>
                    <div className="text-[9px] font-bold text-[var(--alu-text-soft)]">
                      مساحة المصنع
                    </div>
                  </div>

                  <ChevronDown size={14} className="text-[var(--alu-text-soft)]" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="px-3 print:hidden md:px-4">
          {updateAvailable && (
            <div className="alu-panel mb-3 rounded-[1.35rem] border-[rgba(225,230,246,0.95)] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-[0.9rem] bg-[var(--alu-accent-soft)] p-2.5 text-[var(--alu-accent)]">
                    <DownloadCloud size={20} />
                  </div>

                  <div>
                    <div className="text-[15px] font-black text-[var(--alu-text)]">
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
                      <div className="mt-1 text-[12px] font-bold text-[var(--alu-text-soft)]">
                        تحسينات جديدة في الواجهة والأداء متاحة لهذه النسخة.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-3">
                  {!isDownloading && !updateReady && (
                    <button
                      onClick={onStartDownload}
                      className="rounded-[0.95rem] bg-[var(--alu-accent)] px-4 py-2.5 text-[12px] font-black text-white transition-all hover:bg-[#4659f0]"
                    >
                      تحميل التحديث
                    </button>
                  )}

                  {updateReady && (
                    <button
                      onClick={onRestartAndInstall}
                      className="rounded-[0.95rem] bg-[#2ec5b5] px-4 py-2.5 text-[12px] font-black text-white transition-all hover:bg-[#24b3a4]"
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
                    <AlertCircle size={18} />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                </div>
                <div className="flex-1 whitespace-pre-line text-[12px] font-black leading-6">
                  {systemMessage.text}
                </div>
                <button
                  onClick={onDismissSystemMessage}
                  className="rounded-xl bg-black/5 p-2 opacity-70 transition-all hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <main className="alu-workspace alu-scrollbar flex-1 overflow-y-auto px-2.5 pb-4 print:px-0 print:pb-0 md:px-3.5">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell
