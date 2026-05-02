import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getFamilyPayload, joinFamily, rotateFamilySecret, updateFamilyData } from "@/lib/db";
import { addActionToData, addChildToData, addCustomActionToData, addRewardToData, deleteChildFromData, deleteCustomActionFromData, deleteRewardFromData, redeemRewardInData, undoActionInData, updateChildInData, updateCustomActionInData, updateRewardInData } from "@/lib/family-data";
import { Settings } from "@/lib/types";

type FamilyRequest =
  | { type: "addChild"; child: { name: string; avatar: string } }
  | { type: "updateChild"; id: string; updates: { name: string; avatar: string } }
  | { type: "deleteChild"; id: string }
  | { type: "addAction"; input: { childId: string; title: string; type: "positive" | "negative" | "repair"; points: number; note?: string } }
  | { type: "undoAction"; id: string }
  | { type: "addCustomAction"; input: { title: string; category: "positive" | "negative" | "repair"; points: number; note?: string; presetKey?: string; disabled?: boolean } }
  | { type: "updateCustomAction"; id: string; updates: { title: string; category: "positive" | "negative" | "repair"; points: number; note?: string; presetKey?: string; disabled?: boolean } }
  | { type: "deleteCustomAction"; id: string }
  | { type: "addReward"; input: { title: string; cost: number; description: string } }
  | { type: "updateReward"; id: string; updates: { title: string; cost: number; description: string } }
  | { type: "deleteReward"; id: string }
  | { type: "redeemReward"; rewardId: string; childId: string }
  | { type: "updateSettings"; updates: Partial<Settings> }
  | { type: "joinFamily"; syncId: string; secret: string }
  | { type: "rotateSecret" };

async function currentEmail() {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? undefined;
}

export async function GET() {
  const email = await currentEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await getFamilyPayload(email);
  if (!payload) return NextResponse.json({ error: "Family not found" }, { status: 404 });

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const email = await currentEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json() as FamilyRequest;

    if (body.type === "joinFamily") {
      const payload = await joinFamily(email, body.syncId.trim(), body.secret.trim());
      return NextResponse.json(payload);
    }

    if (body.type === "rotateSecret") {
      const payload = await rotateFamilySecret(email);
      return NextResponse.json(payload);
    }

    const payload = await updateFamilyData(email, (data) => {
      switch (body.type) {
        case "addChild":
          return addChildToData(data, body.child);
        case "updateChild":
          return updateChildInData(data, body.id, body.updates);
        case "deleteChild":
          return deleteChildFromData(data, body.id);
        case "addAction":
          return addActionToData(data, body.input);
        case "undoAction":
          return undoActionInData(data, body.id);
        case "addCustomAction":
          return addCustomActionToData(data, body.input);
        case "updateCustomAction":
          return updateCustomActionInData(data, body.id, body.updates);
        case "deleteCustomAction":
          return deleteCustomActionFromData(data, body.id);
        case "addReward":
          return addRewardToData(data, body.input);
        case "updateReward":
          return updateRewardInData(data, body.id, body.updates);
        case "deleteReward":
          return deleteRewardFromData(data, body.id);
        case "redeemReward":
          return redeemRewardInData(data, body.rewardId, body.childId);
        case "updateSettings":
          return { data: { ...data, settings: { ...data.settings, ...body.updates, defaultPointValues: { ...data.settings.defaultPointValues, ...(body.updates.defaultPointValues ?? {}) } } } };
        default:
          return { data };
      }
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Family update failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}