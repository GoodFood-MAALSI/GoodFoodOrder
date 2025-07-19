export interface Restaurant {
  id: number;
  name: string;
  street_number: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  email: string;
  phone_number: string;
  long: number;
  lat: number;
  images?: Image[];
}

export interface Image {
  id: number;
  filename: string;
  path: string;
  isMain: boolean;
}