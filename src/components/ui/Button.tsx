import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition";
  const styles =
    variant === "primary"
      ? "bg-black text-white hover:bg-gray-800"
      : "bg-transparent text-black hover:bg-gray-100";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
