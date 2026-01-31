import data from './placeholder-images.json';
import type { ImagePlaceholder } from './types';

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;

export function getImageData(id: string): ImagePlaceholder {
    const image = PlaceHolderImages.find(img => img.id === id);
    if (image) {
        return image;
    }
    
    const generic = PlaceHolderImages.find(img => img.id === 'generic-animation');
    if (generic) {
        return generic;
    }
    
    return {
        id: 'fallback',
        description: 'fallback image',
        imageUrl: 'https://placehold.co/600x400',
        imageHint: 'placeholder',
        width: 600,
        height: 400
    };
}
