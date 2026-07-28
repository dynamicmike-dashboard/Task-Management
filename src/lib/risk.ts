import { TaskRecord, RiskScore } from "./types";

export function computeRisk(task: TaskRecord): RiskScore {
  const factors: string[] = [];
  let score = 0;

  if (task.progress === "Completed") {
    return { level: "None", score: 0, factors: [] };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Priority
  const priorityScores: Record<string, number> = { Low: 0, Medium: 5, High: 15, Critical: 25 };
  score += priorityScores[task.priority] || 0;
  if (task.priority === "Critical") factors.push("critical priority");
  else if (task.priority === "High") factors.push("high priority");

  // Blocked
  if (task.blocked) {
    score += 20;
    factors.push(task.blockedReason ? `blocked: ${task.blockedReason}` : "blocked");
  }

  // Overdue / approaching deadline
  const due = task.expectedCompletionDate ? new Date(task.expectedCompletionDate) : null;
  if (due) {
    due.setHours(0, 0, 0, 0);
    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / 86400000);
    if (daysOverdue > 0) {
      score += Math.min(daysOverdue * 8, 40);
      factors.push(`${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue`);
    } else if (daysOverdue >= -3) {
      const daysRemaining = -daysOverdue;
      score += (4 - daysRemaining) * 5;
      if (daysRemaining <= 2) factors.push(`${daysRemaining} day${daysRemaining > 1 ? "s" : ""} remaining`);
    }
  }

  // Progress vs deadline
  if (task.progress === "Not Started") {
    if (due && due <= today) {
      score += 15;
      factors.push("not started and overdue");
    } else {
      score += 5;
      factors.push("not started");
    }
  } else if (task.progress === "In Progress") {
    const start = task.startDate ? new Date(task.startDate) : null;
    if (due && start) {
      const total = due.getTime() - start.getTime();
      if (total > 0) {
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
  }

  // Important
  if (task.important) {
    score += 10;
    factors.push("important");
  }

  // % Complete
  if (task.percentComplete > 0 && task.percentComplete < 100) {
    if (task.percentComplete < 25) {
      score += 5;
      factors.push("early stage");
    }
  }

  // Stale progress update
  if (!task.latestProgressUpdate || task.latestProgressUpdate.trim().length < 10) {
    score += 5;
    factors.push("stale update");
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
