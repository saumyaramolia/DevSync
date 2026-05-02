"use client";

import { useEffect, useState } from "react";
import { child, onDisconnect, onValue, remove, set } from "firebase/database";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { getPresenceRef } from "@/lib/firebase";

interface PresenceUser {
  id: string;
  name: string;
  image: string | null;
  joinedAt: number;
}

interface PresenceBarProps {
  documentId: string;
  currentUser: { id: string; name: string; image?: string };
}

const MAX_VISIBLE = 5;

export function PresenceBar({ documentId, currentUser }: PresenceBarProps) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const presenceRef = getPresenceRef(documentId);
    const userRef = child(presenceRef, currentUser.id);

    // Register presence and set up disconnect cleanup
    set(userRef, {
      id: currentUser.id,
      name: currentUser.name,
      image: currentUser.image ?? null,
      joinedAt: Date.now(),
    });
    onDisconnect(userRef).remove();

    // Subscribe to all presence entries
    const unsub = onValue(presenceRef, (snap) => {
      const data = snap.val() ?? {};
      const all = Object.values(data) as PresenceUser[];
      const mine = all.filter((u) => u.id === currentUser.id);
      const others = all
        .filter((u) => u.id !== currentUser.id)
        .sort((a, b) => a.joinedAt - b.joinedAt);
      setUsers([...mine, ...others]);
    });

    return () => {
      unsub();
      remove(userRef);
    };
  }, [documentId, currentUser.id, currentUser.name, currentUser.image]);

  const visible = users.slice(0, MAX_VISIBLE);
  const overflow = users.length - MAX_VISIBLE;

  if (!users.length) return null;

  return (
    <div className="flex items-center gap-2">
      <AvatarGroup>
        {visible.map((user) => (
          <div key={user.id} className="relative" title={user.name}>
            <Avatar size="sm">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback>
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 size-2 rounded-full bg-green-500 ring-1 ring-white" />
          </div>
        ))}
        {overflow > 0 && (
          <AvatarGroupCount>+{overflow}</AvatarGroupCount>
        )}
      </AvatarGroup>
      <span className="text-xs text-slate-400">
        {users.length === 1 ? "1 person" : `${users.length} people`} editing
      </span>
    </div>
  );
}
