export const DOCTORS_BY_CATEGORY: Record<
  string,
  {
    id: string;
    name: string;
    specialty: string;
    generalSpecialty: string;
    rating: string;
    reviews: string;
    hospital: string;
    experience: number;
  }[]
> = {};

export const TAB_DOCTORS: {
  id: string;
  name: string;
  specialty: string;
  generalSpecialty: string;
  rating: string;
  reviews: string;
  hospital: string;
  experience: number;
}[] = [];

export function getAllDoctors() {
  return Object.values(DOCTORS_BY_CATEGORY).flat();
}

export function findDoctorById(id: string) {
  return getAllDoctors().find((d) => d.id === id);
}

export function getFeaturedDoctors() {
  return getAllDoctors().slice(0, 10);
}
