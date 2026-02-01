"use client";

import React from "react";
import NavButton from "@/components/Button/NavButton/NavButton";

export default function LeftButtonLayout() {
  return (
    <>
      <NavButton type="friends" />
      <NavButton type="chat" />
      <NavButton type="profile" />
    </>
  );
}
