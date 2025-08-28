import { Patient } from "@/types/fhir";

export const getPatientName = (patient: Patient) => {
  if (!patient.name || patient.name.length === 0) return "";

  const preferredName =
    patient.name.find((name) => name.use === "official") ||
    patient.name.find((name) => name.use === "usual") ||
    patient.name.find((name) => name.use === "temp") ||
    patient.name[0];

  if (!preferredName) return "";

  const given = preferredName.given ? preferredName.given.join(" ") : "";
  const family = preferredName.family || "";

  return `${given} ${family}`.trim() || "Unknown";
};

export const getPatientAge = (patient: Patient) => {
  if (!patient.birthDate) return 0;

  try {
    const birthDate = new Date(patient.birthDate);

    if (isNaN(birthDate.getTime())) return 0;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return Math.max(0, age);
  } catch (error) {
    return 0;
  }
};

export const getPatientMRN = (patient: Patient) => {
  if (patient.identifier && patient.identifier.length > 0) {
    return patient.identifier[0].value;
  }
};
