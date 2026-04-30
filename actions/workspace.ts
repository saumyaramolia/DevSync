"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session.user;
}

export async function createWorkspace(name: string) {
  const user = await requireUser();
  const workspace = await prisma.workspace.create({
    data: {
      name,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  revalidatePath("/dashboard");
  return workspace;
}

export async function getUserWorkspaces() {
  const user = await requireUser();
  return prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { workspace: { updatedAt: "desc" } },
  });
}

export async function deleteWorkspace(workspaceId: string) {
  const user = await requireUser();
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });
  if (!member || member.role !== "OWNER") throw new Error("Forbidden");
  await prisma.workspace.delete({ where: { id: workspaceId } });
  revalidatePath("/dashboard");
}
