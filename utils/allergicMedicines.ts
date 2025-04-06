export const allergicMedicines = [
  "Penicillin",
  "Aspirin",
  "Ibuprofen",
  "Sulfa",
  "Amoxicillin",
  "Paracetamol",
  "Cephalosporins",
  //add more
  "Antibiotics",
  "Codeine",
  "Morphine",
  "Naproxen",
];

export const checkAllergicMedicines = (prescription: string): string[] => {
  const prescriptionList = prescription
    .split(",")
    .map((med) => med.trim().toLowerCase());
  return allergicMedicines
    .filter((med) => prescriptionList.includes(med.toLowerCase()))
    .map((med) => med.trim());
};
