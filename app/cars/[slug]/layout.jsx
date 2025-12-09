// Car detail page layout with dynamic SEO metadata
import { carData } from '@/data/cars.js';

// Generate metadata dynamically based on the car
export async function generateMetadata({ params }) {
  const { slug } = params;
  const car = carData.find(c => c.slug === slug);
  
  if (!car) {
    return {
      title: 'Car Not Found',
      description: 'The requested car could not be found.',
    };
  }

  const title = `${car.name} | Sports Car Profile`;
  const description = `Detailed profile of the ${car.name}. ${car.years ? `Model years: ${car.years}.` : ''} ${car.price ? `Price range: ${car.price}.` : ''} Performance scores, specs, ownership insights, and upgrade recommendations.`;

  return {
    title,
    description,
    keywords: [
      car.name,
      car.make,
      car.model,
      'sports car',
      'performance car',
      `${car.make} review`,
      `${car.model} review`,
      'track car',
      'sports car buying guide',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url: `/cars/${slug}`,
      type: 'website',
    },
    twitter: {
      title,
      description: `Detailed profile of the ${car.name}. Performance scores, specs, and ownership insights.`,
    },
    alternates: {
      canonical: `/cars/${slug}`,
    },
  };
}

// Generate static params for all cars
export async function generateStaticParams() {
  return carData.map((car) => ({
    slug: car.slug,
  }));
}

export default function CarDetailLayout({ children }) {
  return children;
}







