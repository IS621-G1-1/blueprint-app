export interface GraduationRequirementCategory {
  id: string;
  name: string;
  requiredCount: number;
  taken: string[];
  remaining: string[];
}

export interface GraduationRequirementsConfig {
  programme: string;
  specialisation: string;
  categories: GraduationRequirementCategory[];
}

export const graduationRequirements: GraduationRequirementsConfig = {
  programme: "MITB",
  specialisation: "Digital Transformation",
  categories: [
    {
      id: "mitb-core",
      name: "MITB Core",
      requiredCount: 3,
      taken: ["IS601"],
      remaining: ["IS602", "IS603"],
    },
    {
      id: "dt-core",
      name: "DT Core",
      requiredCount: 4,
      taken: ["IS615", "IS620", "IS621", "IS622"],
      remaining: [],
    },
    {
      id: "dt-electives",
      name: "DT Electives",
      requiredCount: 4,
      taken: ["IS619", "IS623"],
      remaining: ["IS630", "IS631"],
    },
    {
      id: "mitb-electives",
      name: "MITB Electives",
      requiredCount: 3,
      taken: ["IS640"],
      remaining: ["IS634", "IS635"],
    },
  ],
};

export function getRequirementStatus(category: GraduationRequirementCategory) {
  return category.taken.length >= category.requiredCount ? "Fulfilled" : "Unfulfilled";
}
