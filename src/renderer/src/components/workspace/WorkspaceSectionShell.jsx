const WorkspaceSectionShell = ({
  eyebrow,
  title,
  description,
  tabs = [],
  activeTab,
  onChange,
  summary = null,
  actions = null,
  children
}) => {
  return (
    <div className="mx-auto max-w-7xl space-y-3 animate-in fade-in duration-500">
      <section className="alu-panel-strong rounded-[1.1rem] px-4 py-4 md:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--alu-brand-soft)] px-2.5 py-1 text-[10px] font-black text-[var(--alu-accent)]">
                {eyebrow}
              </div>
            )}

            <h2 className="mt-2.5 text-[1.12rem] font-black tracking-tight text-[var(--alu-text)]">
              {title}
            </h2>
            {description && (
              <p className="mt-1.5 max-w-3xl text-[11px] font-bold leading-5 text-[var(--alu-text-soft)]">
                {description}
              </p>
            )}

            {tabs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onChange(tab.id)}
                      className={`rounded-[0.8rem] border px-3 py-2 text-right transition-all ${
                        isActive
                          ? 'border-[rgba(85,104,255,0.22)] bg-[var(--alu-accent-soft)] text-[var(--alu-accent)] shadow-[0_10px_24px_rgba(85,104,255,0.08)]'
                          : 'border-[var(--alu-border)] bg-white text-[var(--alu-text-soft)] hover:border-[rgba(85,104,255,0.14)] hover:text-[var(--alu-text)]'
                      }`}
                    >
                      <div className="text-[11px] font-black">{tab.label}</div>
                      {tab.helper && (
                        <div className="mt-1 text-[9px] font-bold leading-4 opacity-80">
                          {tab.helper}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {summary && <div className="w-full xl:w-auto xl:min-w-[17rem]">{summary}</div>}
        </div>
      </section>

      {actions}

      <div>{children}</div>
    </div>
  )
}

export default WorkspaceSectionShell
