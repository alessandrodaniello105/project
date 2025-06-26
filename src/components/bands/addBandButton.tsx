import { useEffect, useRef} from 'react';
import { PlusCircle } from 'lucide-react';

interface VisibilityTrackerProps {
    onVisibilityChange?: (isVisible: boolean) => void;
    className: string
}


function AddBandButton({onVisibilityChange, className}: VisibilityTrackerProps) {
    
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    
    useEffect(() => {
        if (!onVisibilityChange) return;
        const currentButton = buttonRef.current;
        if (!currentButton) return;

        const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                const newVisibility = entry.isIntersecting;
                onVisibilityChange(newVisibility);
              });
            },
            {
              root: null, // default is the viewport
              rootMargin: '0px', // no margin
              threshold: 0.1, // Trigger when 10% of the element is visible
            }
        );

        observer.observe(currentButton);

        return () => {
            if (currentButton) {
                observer.unobserve(currentButton);
            }
            observer.disconnect();
        };
    }, [onVisibilityChange]);
    
    return (
        <div>
            <button
                ref={onVisibilityChange ? buttonRef : undefined}
                type="submit"
                className={className}
                id="addBandButton">
                <PlusCircle className="w-5 h-5" />
                Add Band
            </button>
        </div>
    );
}

export default AddBandButton;