import { useEffect } from "react";

export function useTitle(title, description) {
  useEffect(() => {
    document.title = `${title} | Jayalakshmi Cabs & Services`;
    const tag = document.querySelector('meta[name="description"]');
    if (tag && description) tag.setAttribute("content", description);
  }, [title, description]);
}
