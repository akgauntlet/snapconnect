/**
 * @file FilterPreview.tsx
 * @description Renders a real-time preview of a selected AR filter over the camera view.
 *
 * @author SnapConnect Team
 * @created 2024-07-27
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { GamingFilterType } from '../../services/ar-filters';

interface FilterPreviewProps {
  filter: GamingFilterType | null;
}

const filterOverlayColors: Partial<Record<GamingFilterType, string>> = {
    'cyberpunk': 'rgba(0, 255, 255, 0.2)',
    'neon-glow': 'rgba(255, 0, 255, 0.3)',
    'matrix': 'rgba(0, 255, 0, 0.2)',
    'retro-gaming': 'rgba(255, 165, 0, 0.2)',
    'glitch': 'rgba(255, 0, 0, 0.1)',
    'hologram': 'rgba(0, 200, 255, 0.2)',
};

/**
 * A component to render a real-time preview of an AR filter.
 * This is an overlay that sits on top of the camera view.
 * @param {FilterPreviewProps} props The component props.
 * @param {GamingFilterType | null} props.filter The currently selected filter.
 * @returns {React.ReactElement | null} The rendered filter preview, or null if no filter is selected.
 */
function FilterPreview({ filter }: FilterPreviewProps): React.ReactElement | null {
  if (!filter) {
    return null;
  }

  const overlayColor = filterOverlayColors[filter] || 'transparent';

  return (
    <View 
      style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }]}
    >
      {/* For filters that are UI overlays, we can render them here */}
      {filter === 'fps-overlay' && <Text style={styles.overlayText}>60 FPS</Text>}
      {filter === 'health-bar' && (
        <View style={styles.healthBarContainer}>
            <View style={styles.healthBar} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    overlayText: {
        position: 'absolute',
        top: 140, // Positioned lower to avoid top controls
        right: 20,
        color: 'lime',
        fontSize: 24,
        fontFamily: 'Orbitron-Bold',
        textShadow: '0px 0px 5px black',
    } as any,
    healthBarContainer: {
        position: 'absolute',
        top: 140, // Positioned lower to avoid top controls
        left: 20,
        width: '40%',
        height: 20,
        borderColor: 'white',
        borderWidth: 2,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 4,
    },
    healthBar: {
        width: '80%', // Example health level
        height: '100%',
        backgroundColor: '#ff4757',
        borderRadius: 2,
    }
});

export default FilterPreview; 
