export type Planting = {
  id: string;
  crop: string;
  variety: string | null;
  status: string;
  plantedOn: string | null;
};

export type Observation = {
  id: string;
  lat: number;
  lng: number;
  health: number;
  weedPressure: string;
  note: string | null;
  photo: string | null;
  createdAt: string;
};

export type SoilSample = {
  id: string;
  lat: number;
  lng: number;
  moisture: number | null;
  ph: number | null;
  temperature: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  note: string | null;
  createdAt: string;
};

export type WeedPin = {
  id: string;
  lat: number;
  lng: number;
  density: string;
  species: string | null;
  note: string | null;
  status: string;
  createdAt: string;
};

export type Field = {
  id: string;
  name: string;
  landType: string;
  geometry: { type: "Polygon"; coordinates: number[][][] };
  areaAcres: number;
  centerLat: number;
  centerLng: number;
  plantings: Planting[];
  scouts: Observation[];
  soil: SoilSample[];
  weeds: WeedPin[];
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string; // owner, manager, scout, member
};

export type Farm = {
  id: string;
  name: string;
  location: string | null;
  fields: Field[];
  team: TeamMember[];
};

export type SessionUser = { id: string; name: string; email: string };
