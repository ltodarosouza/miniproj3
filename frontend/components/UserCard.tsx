import type { User } from "@/lib/api";

export function UserCard({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 font-semibold">
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          user.name[0]?.toUpperCase()
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium">{user.name}</p>
        <p className="truncate text-sm text-zinc-500">
          @{user.username}
          {user.bio ? ` — ${user.bio}` : ""}
        </p>
      </div>
    </div>
  );
}
