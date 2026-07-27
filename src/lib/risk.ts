import { TaskRecord, RiskScore } from "./types";

export function computeRisk(task: TaskRecord): RiskScore {
  const factors: string[] = [];
  let score = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (task.progress === "Completed") {
    return { level: "None", score: 0, factors: [] };
  }

  const due = task.expectedCompletionDate ? new Date(task.expectedCompletionDate) : null;
  const start = task.startDate ? new Date(task.startDate) : null;

  if (due) {
    due.setHours(0, 0, 0, 0);
    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / 86400000);
    if (daysOverdue > 0) {
      score += Math.min(daysOverdue * 8, 40);
      factors.push(`${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue`);
    } else if (daysOverdue > -7) {
      const daysRemaining = -daysOverdue;
      score += (7 - daysRemaining) * 3;
      if (daysRemaining <= 2) factors.push(`${daysRemaining} day${daysRemaining > 1 ? "s" : ""} remaining`);
    }
  }

  if (task.progress === "Not Started") {
    score += 10;
    factors.push("not started");
  } else if (task.progress === "In Progress") {
    if (due && start) {
      const total = due.getTime() - start.getTime();
      const elapsed = today.getTime() - start.getTime();
      const pct = elapsed / total;
      if (pct > 1) {
        score += 10;
        factors.push("past deadline");
      } else if (pct > 0.75) {
        score += 5;
        factors.push("behind schedule");
      }
    }
  }

  if (task.important) {
    score += 15;
    factors.push("important");
  }

  if (!task.latestProgressUpdate || task.latestProgressUpdate.trim().length < 10) {
    score += 5;
    factors.push("stale update");
  }

  if (task.blocked) {
    score += 10;
    factors.push("blocked");
  }

  let level: RiskScore["level"] = "Low";
  if (score >= 50) level = "Critical";
  else if (score >= 30) level = "High";
  else if (score >= 15) level = "Medium";
  else if (score === 0) level = "None";

  return { level, score, factors };
}

export function riskColor(level: RiskScore["level"]): string {
  switch (level) {
    case "Critical": return "text-red-600 bg-red-50 border-red-200";
    case "High": return "text-orange-600 bg-orange-50 border-orange-200";
    case "Medium": return "text-amber-600 bg-amber-50 border-amber-200";
    case "Low": return "text-slate-600 bg-slate-50 border-slate-200";
    case "None": return "text-emerald-600 bg-emerald-50 border-emerald-200";
  }
}
