export interface PortfolioItem {
  id?: string;
  title: string;
  category: string;
  image: string; // base64 string (first/cover image, backward compat)
  images?: string[]; // array of base64 strings for multi-image support
  technologies: string[];
  description: string;
  demoLink: string;
  githubLink: string;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

export interface Category {
  id: string;
  name: string;
}