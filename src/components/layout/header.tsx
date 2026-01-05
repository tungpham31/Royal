import { ReactNode } from "react";
import { getUser } from "@/actions/auth";

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

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{user?.user_metadata?.full_name || "User"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-medium text-primary">
            {(user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "U").toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
