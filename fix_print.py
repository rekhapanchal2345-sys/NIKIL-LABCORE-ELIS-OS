import re

file_path = "frontend/apps/web/src/components/patients/PatientRegistrationSheet.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix the Print A4 Form buttons which got turned blue
content = content.replace(
    'bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer">\n            <Printer className="w-3.5 h-3.5 text-white" />\n            <span>Print A4 Form</span>',
    'bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer">\n            <Printer className="w-3.5 h-3.5 text-white" />\n            <span>Print A4 Form</span>'
)

# And fix the bottom one if it has different padding
content = content.replace(
    'bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer">\n                <Printer className="w-3.5 h-3.5 text-white" />\n                <span>Print A4 Form</span>',
    'bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer">\n                <Printer className="w-3.5 h-3.5 text-white" />\n                <span>Print A4 Form</span>'
)

# Also in the reverse script, I made one mistake:
# 'px-1.5 py-0.5 rounded bg-sky-100/90 border border-sky-200 text-[#0284c7] text-[8.5px]'
# Wait, the screenshot shows the "01", "02", "03" badges in a light blue pill with blue text.
# Is that correctly applied? Yes, the reverse script did that.

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("FIXED PRINT BUTTONS")