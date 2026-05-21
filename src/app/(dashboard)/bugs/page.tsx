"use client";

import React from "react";
import { BugDashboard } from "@/features/bugs/components/BugDashboard";

export default function BugsPage() {
  return (
    <div className="flex-1 overflow-y-auto space-y-6 px-5 md:px-12 pt-10 pb-32">
      <BugDashboard />
    </div>
  );
}
