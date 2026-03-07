import * as React from 'react';

declare module 'react-leaflet' {
  export const MapContainer: React.FC<any>;
  export const TileLayer: React.FC<any>;
  export const Marker: React.FC<any>;
  export const Popup: React.FC<any>;
  export const useMap: () => any;
  export const useMapEvents: (handlers: any) => any;
  export const ZoomControl: React.FC<any>;
  export const ScaleControl: React.FC<any>;
  export const AttributionControl: React.FC<any>;
  export const Circle: React.FC<any>;
  export const CircleMarker: React.FC<any>;
  export const Polyline: React.FC<any>;
  export const Polygon: React.FC<any>;
  export const Rectangle: React.FC<any>;
  export const LayerGroup: React.FC<any>;
  export const FeatureGroup: React.FC<any>;
  export const GeoJSON: React.FC<any>;
  export const ImageOverlay: React.FC<any>;
  export const VideoOverlay: React.FC<any>;
  export const WMSTileLayer: React.FC<any>;
  export const LayersControl: React.FC<any> & { BaseLayer: React.FC<any>; Overlay: React.FC<any> };
  export const Tooltip: React.FC<any>;
  export const Pane: React.FC<any>;
}
