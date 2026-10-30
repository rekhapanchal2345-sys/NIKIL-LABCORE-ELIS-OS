import re

file_path = "frontend/apps/web/src/components/patients/PatientRegistrationSheet.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace ClinicalEmblemSvg
old_emblem = r"function ClinicalEmblemSvg\(\{ size = 54 \}: \{ size\?: number \}\) \{.*?(?=function ClinicalQrCodeSvg)"
new_emblem = """function ClinicalEmblemSvg({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      role="img"
      aria-label="Clinical Emblem"
      className="shrink-0"
    >
      <rect x="1.5" y="1.5" width="53" height="53" rx="12" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
      <path d="M28 10L42 16V27C42 37 36.5 45 28 48C19.5 45 14 37 14 27V16L28 10Z" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
      <rect x="25.5" y="19" width="5" height="18" rx="1" fill="#0d9488" />
      <rect x="19" y="25.5" width="18" height="5" rx="1" fill="#0d9488" />
      <circle cx="28" cy="28" r="1.5" fill="#ffffff" />
    </svg>
  );
}

"""
content = re.sub(old_emblem, new_emblem, content, flags=re.DOTALL)

# 2. Update Layout and Styling classes
replacements = {
    # Typography & Icons Colors
    'text-[#0284c7]': 'text-[#0d9488]', # Sky to Teal
    'bg-[#0284c7]': 'bg-[#0f172a]', # Sky bg to Slate 900
    'hover:bg-[#0369a1]': 'hover:bg-slate-800',
    
    # Gradients
    'from-[#0284c7] via-[#0d9488] to-[#0284c7]': 'from-[#0f172a] via-[#0d9488] to-[#0f172a] print:h-1.5',
    'bg-gradient-to-r from-[#0f172a] via-[#0d9488] to-[#0f172a] print:h-1.5': 'bg-gradient-to-r from-[#0f172a] via-[#0d9488] to-[#0f172a] print:h-1.5', # Avoid double

    # Section Headers
    'px-1.5 py-0.5 rounded bg-sky-100/90 border border-sky-200 text-[#0d9488] text-[8.5px]': 'px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white text-[8.5px]',
    
    # Badges
    'bg-sky-50/90 border border-sky-200': 'bg-slate-100 border border-slate-300',
    'bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0d9488]': 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700',
    'bg-sky-50 border border-sky-200 text-sky-800': 'bg-slate-50 border border-slate-300 text-slate-800',
    'text-sky-600': 'text-[#0d9488]',
    
    # Borders and Shadows
    'shadow-2xs': 'shadow-sm',
    'shadow-xs': 'shadow-sm',
    'border-slate-200/95': 'border-slate-300',
    'border-slate-200/90': 'border-slate-300',
    'rounded-2xl': 'rounded-xl',

    # Printable Wrapper
    'print:shadow-none print:rounded-none print:border-0"': 'print:shadow-none print:rounded-none print:border-0 print:w-full print:m-0"',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# 3. Save back
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")
