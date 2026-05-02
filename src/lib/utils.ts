import { clsx, type ClassValue } from "clsx";
import { isAfter, startOfDay, startOfWeek } from "date-fns";
import { twMerge } from "tailwind-merge";
import { Action, ActionType, Child, Reward } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ageFromBirthday(birthday: string) {
  if (!birthday) return null;
  const [yearStr, monthStr, dayStr] = birthday.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;

  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;
  const dayDiff = today.getDate() - day;
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  if (age < 0 || age > 130) return null;
  return age;
}

export function childLevel(points: number) {
  if (points >= 500) return "Kindness Captain";
  if (points >= 300) return "Teamwork Trailblazer";
  if (points >= 150) return "Growth Guide";
  if (points >= 75) return "Sharing Star";
  return "Kindness Sprout";
}

export function actionsForChild(actions: Action[], childId: string) {
  return actions.filter((action) => action.childId === childId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function pointsSince(actions: Action[], since: Date) {
  return actions.filter((action) => isAfter(new Date(action.createdAt), since)).reduce((sum, action) => sum + action.points, 0);
}

export function todayPoints(actions: Action[]) {
  return pointsSince(actions, startOfDay(new Date()));
}

export function weeklyPoints(actions: Action[]) {
  return pointsSince(actions, startOfWeek(new Date(), { weekStartsOn: 1 }));
}

export function positiveStreak(actions: Action[]) {
  let streak = 0;
  for (const action of [...actions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))) {
    if (action.type === "positive" || action.type === "repair") streak += 1;
    if (action.type === "negative") break;
  }
  return streak;
}

export function positiveRatio(actions: Action[]) {
  const positives = actions.filter((action) => action.type === "positive" || action.type === "repair").length;
  const negatives = actions.filter((action) => action.type === "negative").length;
  if (negatives === 0) return positives;
  return positives / negatives;
}

export function todaysNegativeCount(actions: Action[]) {
  const start = startOfDay(new Date());
  return actions.filter((action) => action.type === "negative" && isAfter(new Date(action.createdAt), start)).length;
}

export function todaysNegativePoints(actions: Action[]) {
  const start = startOfDay(new Date());
  return Math.abs(actions.filter((action) => action.type === "negative" && isAfter(new Date(action.createdAt), start)).reduce((sum, action) => sum + action.points, 0));
}

export function availableRewards(rewards: Reward[], points: number) {
  return rewards.filter((reward) => !reward.redeemed && reward.cost <= points).sort((a, b) => a.cost - b.cost);
}

export function nextReward(rewards: Reward[], points: number) {
  return rewards.filter((reward) => !reward.redeemed && reward.cost > points).sort((a, b) => a.cost - b.cost)[0];
}

export function badgeForActions(actions: Action[]) {
  const titles = actions.map((action) => action.title.toLowerCase());
  const badges = [];
  if (titles.some((title) => title.includes("help"))) badges.push("Kind Helper");
  if (titles.some((title) => title.includes("sharing") || title.includes("share"))) badges.push("Sharing Star");
  if (titles.some((title) => title.includes("calm") || title.includes("patient"))) badges.push("Calm Down Champion");
  if (titles.some((title) => title.includes("homework"))) badges.push("Homework Hero");
  if (titles.some((title) => title.includes("sorry") || title.includes("lying"))) badges.push("Honest Heart");
  return badges;
}

export function toneForType(type: ActionType) {
  if (type === "negative") return "correction";
  if (type === "repair") return "repair";
  return "positive";
}

export function familyTotal(children: Child[]) {
  return children.reduce((sum, child) => sum + child.points, 0);
}
