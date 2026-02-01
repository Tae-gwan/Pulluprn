"use client";

import React, { memo } from "react";
import ModalButton from "@/components/Button/ModalButton/ModalButton";

const RightButtonLayout = memo(function RightButtonLayout() {
  return <ModalButton type="logout" />;
});

export default RightButtonLayout;
