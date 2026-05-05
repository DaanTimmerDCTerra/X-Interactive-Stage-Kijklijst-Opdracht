export default function VectorIcon({ src, alt = '', className = 'aspect-square h-5 w-5 object-contain shrink-0' }) {
    return <img src={src} alt={alt} className={className} draggable="false" />
}
