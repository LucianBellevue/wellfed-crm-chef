// Common types for media components
export interface MediaFile {
  id: string;
  name: string;
  type: string;
  url: string;
  description: string;
  createdAt: Date;
  size: number;
}
export interface Recipe {
  _id?: string;
  id?: string;
  name: string;
  // Add other recipe properties as needed
}

