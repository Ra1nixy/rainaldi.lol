export interface PortfolioItem {
  id?: string;
  title: string;
  category: string;
  image: string; // base64 string
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