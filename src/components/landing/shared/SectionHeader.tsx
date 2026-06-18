interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    className?: string;
    titleClassName?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    subtitle,
    className = '',
    titleClassName = '',
}) => {
    return (
        <div className={`text-center mb-12 md:mb-16 ${className}`}>
            <h2
                className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white ${titleClassName}`}
            >
                {title}
            </h2>
            {subtitle && (
                <p className="mt-4 text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
                    {subtitle}
                </p>
            )}
        </div>
    );
};

export default SectionHeader;
