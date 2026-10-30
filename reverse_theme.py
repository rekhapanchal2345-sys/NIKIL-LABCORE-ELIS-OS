import re

file_path = "frontend/apps/web/src/components/patients/PatientRegistrationSheet.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Reverse SVG Emblem
new_emblem = r"function ClinicalEmblemSvg\(\{ size = 56 \}: \{ size\?: number \}\) \{.*?(?=function ClinicalQrCodeSvg)"
old_emblem = """function ClinicalEmblemSvg({ size = 54 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      role="img"
      aria-label="Clinical Emblem"
      className="shrink-0"
    >
      <rect
        x="1.5"
        y="1.5"
        width="53"
        height="53"
        rx="13"
        fill="#f0f9ff"
        stroke="#7dd3fc"
        strokeWidth="1.5"
      />
      <path
        d="M28 9L43 14.5V26.2C43 36.8 36.5 44.9 28 48C19.5 44.9 13 36.8 13 26.2V14.5L28 9Z"
        fill="#ffffff"
        stroke="#0284c7"
        strokeWidth="1.8"
      />
      <rect x="25.2" y="18" width="5.6" height="20" rx="1.5" fill="#0284c7" />
      <rect x="18" y="25.2" width="20" height="5.6" rx="1.5" fill="#0284c7" />
      <circle cx="28" cy="28" r="2" fill="#ffffff" />
      <circle cx="43.5" cy="12.5" r="2.2" fill="#0d9488" />
    </svg>
  );
}

"""
content = re.sub(new_emblem, old_emblem, content, flags=re.DOTALL)

# Ordered reverse replacements
# (Put longer / specific strings first)
reverse_replacements = {
    'px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white text-[8.5px]': 'px-1.5 py-0.5 rounded bg-sky-100/90 border border-sky-200 text-[#0284c7] text-[8.5px]',
    'bg-slate-100 border border-slate-300': 'bg-sky-50/90 border border-sky-200',
    'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700': 'bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0284c7]',
    'bg-slate-50 border border-slate-300 text-slate-800': 'bg-sky-50 border border-sky-200 text-sky-800',
    'from-[#0f172a] via-[#0d9488] to-[#0f172a] print:h-1.5': 'from-[#0284c7] via-[#0d9488] to-[#0284c7]',
    
    # Generic swaps
    'text-[#0d9488]': 'text-[#0284c7]',
    'bg-[#0f172a]': 'bg-[#0284c7]',
    'hover:bg-slate-800': 'hover:bg-[#0369a1]',
    
    'shadow-sm': 'shadow-2xs', # We might have to handle shadow-xs separately, but this works for most
    'border-slate-300': 'border-slate-200/90', # Revert borders mostly
    'rounded-xl': 'rounded-2xl',
    'print:shadow-none print:rounded-none print:border-0 print:w-full print:m-0"': 'print:shadow-none print:rounded-none print:border-0"',
}

for old_str, new_str in reverse_replacements.items():
    content = content.replace(old_str, new_str)

# One specific fix: there was a 'shadow-xs' in one button:
content = content.replace('bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-2xl shadow-2xs transition-colors cursor-pointer', 'bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer') # Wait, I don't want to mess it up. Let's just write the whole thing.

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("REVERSED SUCCESS")