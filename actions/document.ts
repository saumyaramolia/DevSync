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

async function requireMembership(userId: string, workspaceId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!member) throw new Error("Not a member of this workspace");
  return member;
}

export async function createDocument(workspaceId: string) {
  const user = await requireUser();
  await requireMembership(user.id, workspaceId);
  const doc = await prisma.document.create({ data: { workspaceId } });
  revalidatePath("/workspace/[id]", "page");
  return doc;
}

export async function getDocumentsByWorkspace(workspaceId: string) {
  const user = await requireUser();
  await requireMembership(user.id, workspaceId);
  return prisma.document.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateDocumentTitle(documentId: string, title: string) {
  const user = await requireUser();
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");
  const member = await requireMembership(user.id, doc.workspaceId);
  if (member.role === "VIEWER") throw new Error("Forbidden");
  const updated = await prisma.document.update({
    where: { id: documentId },
    data: { title },
  });
  revalidatePath("/workspace/[id]", "page");
  return updated;
}

export async function deleteDocument(documentId: string) {
  const user = await requireUser();
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");
  const member = await requireMembership(user.id, doc.workspaceId);
  if (member.role === "VIEWER") throw new Error("Forbidden");
  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath("/workspace/[id]", "page");
}
