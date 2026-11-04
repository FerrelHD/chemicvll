"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href?: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<"div">) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "h-full px-3 py-4 hidden md:flex md:flex-col bg-surface-container-low w-[240px] flex-shrink-0 transition-colors select-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className={cn(
            "fixed h-full w-full inset-0 bg-surface-container-lowest p-8 z-[100] flex flex-col justify-between md:hidden shadow-2xl",
            className
          )}
        >
          <div
            className="absolute right-6 top-6 z-50 text-on-surface-variant hover:text-on-surface cursor-pointer p-1.5 rounded-full hover:bg-surface-container-high transition"
            onClick={() => setOpen(false)}
          >
            <X className="w-5 h-5" />
          </div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: any;
}) => {
  const content = (
    <>
      <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
        {link.icon}
      </div>
      <span className="text-on-surface text-sm whitespace-nowrap inline-block !p-0 !m-0">
        {link.label}
      </span>
    </>
  );

  const baseClass = cn(
    "flex items-center justify-start gap-3 group/sidebar py-2 px-2.5 rounded-xl transition duration-150 cursor-pointer w-full text-left",
    link.isActive
      ? "bg-white text-on-surface font-semibold shadow-sm border border-outline/40"
      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60",
    className
  );

  if (link.onClick) {
    return (
      <button
        type="button"
        onClick={link.onClick}
        className={baseClass}
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={link.href || "#"}
      className={baseClass}
      {...props}
    >
      {content}
    </Link>
  );
};

