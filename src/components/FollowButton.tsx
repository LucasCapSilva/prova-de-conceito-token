import { useState } from "react";
import {
  followSeller,
  isFollowing,
  unfollowSeller,
} from "../lib/follows";

export default function FollowButton({
  sellerId,
  compact = false,
}: {
  sellerId: string;
  compact?: boolean;
}) {
  const [followed, setFollowed] = useState(() => isFollowing(sellerId));

  const toggle = () => {
    if (followed) {
      unfollowSeller(sellerId);
    } else {
      followSeller(sellerId);
    }
    setFollowed(!followed);
  };

  const cls = compact
    ? "rounded-[6px] px-3 py-1.5 text-xs font-bold"
    : "rounded-[6px] px-4 py-2 text-sm font-bold";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={followed}
      className={
        followed
          ? `border border-brand bg-white text-brand transition hover:border-brand-dark hover:text-brand-dark ${cls}`
          : `btn-brand ${cls}`
      }
    >
      {followed ? "Seguindo" : "+ Seguir"}
    </button>
  );
}
