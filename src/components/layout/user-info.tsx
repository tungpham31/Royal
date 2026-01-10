"use client";

import { usePrivacyStore } from "@/lib/stores/privacy-store";

interface UserInfoProps {
  name: string;
  email: string;
}

export function UserInfo({ name, email }: UserInfoProps) {
  const { isPrivate } = usePrivacyStore();

  const maskedEmail = isPrivate ? "••••••@••••••" : email;
  const initial = (name?.[0] || email?.[0] || "U").toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{maskedEmail}</p>
      </div>
      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-sm font-medium text-primary">{initial}</span>
      </div>
    </div>
  );
}
