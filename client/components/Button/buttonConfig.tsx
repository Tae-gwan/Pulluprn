import React from "react";

export type ModalButtonType = "friends" | "chat" | "profile" | "logout";

export interface ButtonConfig {
  icon: React.ReactNode;
  label: string;
  ariaLabel: string;
  color: string;
  labelColor: string;
  path?: string;
}

export const buttonConfig: Record<ModalButtonType, ButtonConfig> = {
  friends: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    label: "Friends",
    ariaLabel: "Open friends",
    color: "#FF6B35",
    labelColor: "#727272",
    path: "/friends",
  },
  chat: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
    label: "Chat",
    ariaLabel: "Open chat",
    color: "#FF6B35",
    labelColor: "#727272",
    path: "/chat",
  },
  profile: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    ),
    label: "Profile",
    ariaLabel: "Open profile",
    color: "#FF6B35",
    labelColor: "#727272",
    path: "/profile",
  },
  logout: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
        <line x1="12" y1="2" x2="12" y2="12"></line>
      </svg>
    ),
    label: "Logout",
    ariaLabel: "Logout",
    color: "#ff2d1e",
    labelColor: "#f64040",
  },
};
