"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "font-sans rounded-xl border border-slate-200/80 shadow-lg text-[13px] font-medium",
          title: "font-semibold",
          description: "text-xs opacity-90",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
