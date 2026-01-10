import { ReactNode } from "react";
import { getUser } from "@/actions/auth";
import { UserInfo } from "./user-info";

interface HeaderProps {
  title: ReactNode;
  description?: string;
}

export async function Header({ title, description }: HeaderProps) {
  const user = await getUser();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <UserInfo
        name={user?.user_metadata?.full_name || "User"}
        email={user?.email || ""}
      />
    </header>
  );
}
