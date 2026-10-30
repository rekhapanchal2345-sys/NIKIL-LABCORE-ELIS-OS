import re

file_path = "frontend/apps/web/src/components/patients/RegisterPatientWizard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Overlay & Panel Wrapper
content = re.sub(
    r'<div className="dr-overlay"[^>]*>\s*<div className="dr-panel dr-panel-mid">',
    r'<div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Register patient">\n      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[1050px] flex flex-col overflow-hidden ring-1 ring-slate-900/5">\n        {/* Clinical Top Accent Bar */}\n        <div className="h-1.5 w-full bg-gradient-to-r from-[#0284c7] via-[#0d9488] to-[#0284c7]" />',
    content
)

# 2. Header
content = content.replace(
    '<div className="flex items-center justify-between gap-4 px-7 py-4 bg-white border-b border-slate-200">',
    '<div className="flex items-center justify-between gap-4 px-8 py-5 bg-white border-b border-slate-200">'
)
content = content.replace(
    '<h2 className="text-[17px] font-bold text-slate-900 tracking-tight">',
    '<h2 className="text-lg font-black text-[#0f172a] uppercase tracking-wide">'
)
content = content.replace(
    '<span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">',
    '<span className="text-[9.5px] font-extrabold uppercase tracking-widest text-[#0284c7] bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-md shadow-sm">'
)

# 3. Stepper
content = content.replace(
    'className="flex items-center gap-1.5 overflow-x-auto px-6 py-2.5 bg-white border-b border-slate-200/80"',
    'className="flex items-center gap-2 overflow-x-auto px-8 py-3 bg-slate-50 border-b border-slate-200 shadow-sm"'
)

# 4. Form Body Background & Labels
content = content.replace(
    'className="px-7 py-6 overflow-y-auto bg-white"',
    'className="px-8 py-7 overflow-y-auto bg-white"'
)
content = content.replace(
    '<label className={`dr-label${required ? \' dr-required\' : \'\'}`}>{label}</label>',
    '<label className={`text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1`}>{label}{required && <span className="text-rose-500">*</span>}</label>'
)

# 5. Footer
content = content.replace(
    'className="flex items-center justify-between px-7 py-4 bg-[#f8fafc] border-t border-slate-200"',
    'className="flex items-center justify-between px-8 py-4 bg-slate-50 border-t border-slate-200 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]"'
)

# 6. Inputs Custom Classes
new_input = 'dr-input bg-slate-50 border-slate-300 focus:bg-white focus:border-[#0284c7] focus:ring-4 focus:ring-[#0284c7]/15 transition-all rounded-lg shadow-sm text-[13px] font-semibold text-slate-900'

content = content.replace(
    'const inputClass = (error?: string) => `dr-input${error ? \' dr-input-error\' : \'\'}`;',
    f'const inputClass = (error?: string) => `{new_input} ${{error ? \' border-rose-500 focus:border-rose-500 focus:ring-rose-500/15\' : \'\'}}`;'
)

# Fix Selects
content = content.replace(
    'className="dr-select font-medium"',
    f'className="{new_input.replace("dr-input", "dr-select")} py-2"'
)

# Fix standard Inputs
content = content.replace(
    'className="dr-input"',
    f'className="{new_input}"'
)

# Fix Textareas
content = content.replace(
    'className="dr-textarea"',
    f'className="{new_input.replace("dr-input", "dr-textarea")}"'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")