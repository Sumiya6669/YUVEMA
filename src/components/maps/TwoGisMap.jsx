import React from "react";
import { siteConfig } from "@/config/site";

function buildMapHtml() {
  const { lat, lon, zoom } = siteConfig.mapCoordinates;

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body, #map {
        height: 100%;
        margin: 0;
      }

      body {
        overflow: hidden;
        background: #fbf7f1;
      }

      .leaflet-container {
        font-family: Arial, sans-serif;
      }

      .custom-marker {
        width: 20px;
        height: 20px;
        border-radius: 999px;
        background: linear-gradient(135deg, #f6ead9 0%, #d6b185 100%);
        border: 2px solid rgba(255, 255, 255, 0.95);
        box-shadow: 0 10px 18px rgba(126, 98, 71, 0.24);
      }

      .leaflet-marker-icon:not(.yuvema-marker),
      .leaflet-marker-shadow,
      .leaflet-overlay-pane svg,
      .leaflet-pane img[src*="marker"],
      .leaflet-pane img[src*="poi"] {
        display: none !important;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://maps.api.2gis.ru/2.0/loader.js?pkg=full"></script>
    <script>
      window.addEventListener("load", function () {
        if (!window.DG) return;

        window.DG.then(function () {
          var map = window.DG.map("map", {
            center: [${lat}, ${lon}],
            zoom: ${zoom},
            scrollWheelZoom: false,
            zoomControl: true,
            fullscreenControl: false,
            attributionControl: false
          });

          var icon = window.DG.divIcon({
            html: "<div class='custom-marker'></div>",
            className: "yuvema-marker",
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          window.DG.marker([${lat}, ${lon}], { icon: icon }).addTo(map);
        });
      });
    </script>
  </body>
</html>`;
}

export default function TwoGisMap() {
  return (
    <iframe
      title="Карта YUVEMA в 2GIS"
      srcDoc={buildMapHtml()}
      className="h-full min-h-[320px] w-full rounded-[1.65rem] border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    />
  );
}
