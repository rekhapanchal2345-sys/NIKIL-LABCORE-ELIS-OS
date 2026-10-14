export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="text-gray-500 dark:text-gray-400">Loading orders...</p>
    </div>
  );
}
