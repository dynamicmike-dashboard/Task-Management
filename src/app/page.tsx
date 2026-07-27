import { getTasks } from "@/app/actions/teable";
import Dashboard from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { tasks, error } = await getTasks();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Task Operations Dashboard</h2>
          <p className="text-sm text-red-600 mb-2">Could not connect to the task database</p>
          <p className="text-xs text-slate-400 mb-4">{error}</p>
          <p className="text-xs text-slate-400">
            Check that TEABLE_BASE_URL, TEABLE_API_KEY, and TEABLE_TABLE_ID are set correctly.
          </p>
        </div>
      </div>
    );
  }

  return <Dashboard initialTasks={tasks} />;
}
