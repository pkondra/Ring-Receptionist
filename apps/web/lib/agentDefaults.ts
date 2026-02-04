export const DEFAULT_QUALIFICATION_GOALS = [
  { key: "callerName", label: "Caller Name", required: true },
  { key: "phone", label: "Phone Number", required: true },
  { key: "address", label: "Address / Suburb", required: true },
  { key: "reason", label: "Reason for Call", required: true },
  { key: "numberOfTrees", label: "Number of Trees", required: false },
  { key: "sizeEstimate", label: "Tree Size Estimate", required: false },
  { key: "urgency", label: "Urgency Level", required: true },
  { key: "hazards", label: "Hazards Present", required: false },
  { key: "accessConstraints", label: "Access Constraints", required: false },
  { key: "preferredWindow", label: "Preferred Scheduling Window", required: false },
] as const;

export const DEFAULT_EMERGENCY_TRIGGERS = [
  { keyword: "tree on house", action: "markUrgent" as const },
  { keyword: "power line", action: "markUrgent" as const },
  { keyword: "downed power line", action: "suggestDispatch" as const },
  { keyword: "blocked road", action: "markUrgent" as const },
  { keyword: "emergency", action: "suggestDispatch" as const },
];

export const DEFAULT_EMERGENCY_INSTRUCTIONS =
  "If caller describes hazards such as a tree on a house, downed power line, or blocked road: immediately mark as urgent, offer to note details for emergency dispatch, and inform the caller someone will follow up as soon as possible. Placeholder for transfer logic.";

export const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export type QualificationGoal = {
  key: string;
  label: string;
  required: boolean;
};

export type EmergencyTrigger = {
  keyword: string;
  action: "markUrgent" | "suggestDispatch" | "transferPlaceholder";
};

export type EmergencyProtocol = {
  triggers: EmergencyTrigger[];
  instructions: string;
};
