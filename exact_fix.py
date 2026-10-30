import re
file_path = "frontend/apps/web/src/components/patients/PatientRegistrationSheet.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. rounded-2xl to rounded-xl everywhere (undoing the overzealous roundings on inner cards)
content = content.replace("rounded-2xl", "rounded-xl")

# 2. Fix Top Action Bar
content = content.replace(
    'print:hidden bg-white rounded-xl border border-slate-200/90 shadow-2xs',
    'print:hidden bg-white rounded-2xl border border-slate-200/90 shadow-xs'
)

# 3. Fix Printable Sheet wrapper
content = re.sub(
    r'printable-patient-sheet"([^>]*?)className="bg-white rounded-xl border border-slate-200/90 shadow-md',
    r'printable-patient-sheet"\1className="bg-white rounded-2xl border border-slate-200/95 shadow-md',
    content
)

# 4. Global replace border-slate-200/90 to border-slate-200 (fixes inner grids and panels)
content = content.replace("border-slate-200/90", "border-slate-200")

# 5. Restore Top Action Bar border back to 200/90
content = content.replace(
    'print:hidden bg-white rounded-2xl border border-slate-200 shadow-xs',
    'print:hidden bg-white rounded-2xl border border-slate-200/90 shadow-xs'
)

# 6. Fix Download button borders
content = content.replace(
    'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700',
    'bg-white hover:bg-slate-50 border border-slate-300 text-slate-700'
)
content = content.replace(
    'bg-white hover:bg-slate-50 border border-slate-200 text-slate-800',
    'bg-white hover:bg-slate-50 border border-slate-300 text-slate-800'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("ALL MINOR DIFFERENCES FIXED")