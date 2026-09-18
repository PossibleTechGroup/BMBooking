import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export interface ServiceDef {
  key: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  match: string[];
}

export const SERVICES: ServiceDef[] = [
  { key: "cardiology", label: "Cardiology", icon: "heart-outline", match: ["cardiol", "cardiac", "heart"] },
  { key: "dermatology", label: "Dermatology", icon: "body-outline", match: ["dermatol", "skin"] },
  { key: "neurology", label: "Neurology", icon: "pulse-outline", match: ["neurol", "neuro", "brain", "nerve"] },
  { key: "pediatrics", label: "Pediatrics", icon: "happy-outline", match: ["pediatr", "children", "child"] },
  { key: "orthopedics", label: "Orthopedics", icon: "walk-outline", match: ["orthop", "ortho", "bone", "joint"] },
  { key: "eyeCare", label: "Eye Care", icon: "eye-outline", match: ["eye", "ophthalm", "optician", "optometr"] },
];