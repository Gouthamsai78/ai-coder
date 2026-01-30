/**
 * Animated Gradient Background
 * 
 * Creates a beautiful animated mesh gradient inspired by Lovable's design.
 * Uses CSS blur and animations for smooth performance on mobile.
 */

import React from 'react';

const GradientBackground: React.FC = () => {
    return (
        <div className="gradient-bg-container">
            {/* Primary gradient blob */}
            <div className="gradient-blob gradient-blob-1" />

            {/* Secondary gradient blob */}
            <div className="gradient-blob gradient-blob-2" />

            {/* Tertiary gradient blob */}
            <div className="gradient-blob gradient-blob-3" />
        </div>
    );
};

export default GradientBackground;
