<script>
	import { onMount } from 'svelte';
	import * as maplibre from 'maplibre-gl';
	import * as h3 from 'h3-js';
  
	let map;
	let polygonCoordinates = [];
	let h3Indices = [];
  
	const initMap = () => {
	  map = new maplibre.Map({
		container: 'map', 
		style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', 
		center: [-99.1332, 19.4326], 
		zoom: 5 
	  });
  
	  map.on('load', () => {
		map.addSource('drawn-polygon', {
		  type: 'geojson',
		  data: {
			type: 'FeatureCollection',
			features: []
		  }
		});
  
		map.addLayer({
		  id: 'drawn-polygon-layer',
		  type: 'fill',
		  source: 'drawn-polygon',
		  layout: {},
		  paint: {
			'fill-color': '#888888',
			'fill-opacity': 0.4
		  }
		});
	  });
  
	  map.on('click', (e) => {
		polygonCoordinates.push([e.lngLat.lng, e.lngLat.lat]);
  
		if (polygonCoordinates.length >= 3) {
		  drawPolygon();
		}
	  });
	};
  
	const drawPolygon = () => {
	  const polygonGeoJson = {
		type: 'Feature',
		geometry: {
		  type: 'Polygon',
		  coordinates: [polygonCoordinates.concat([polygonCoordinates[0]])] 
		}
	  };
  
	  map.getSource('drawn-polygon').setData({
		type: 'FeatureCollection',
		features: [polygonGeoJson]
	  });
	};
  
	const calculateH3Indices = () => {
	  console.log("Polygon Coordinates: ", polygonCoordinates.concat([polygonCoordinates[0]]));
	  const h3Resolution = 7; 
	  h3Indices = h3.polygonToCells(polygonCoordinates.concat([polygonCoordinates[0]]), 3);
	  console.log("H3 Indices: ", h3Indices);
	};
  
	const clearPolygon = () => {

	  polygonCoordinates = [];
	  h3Indices = [];
	  map.getSource('drawn-polygon').setData({
		type: 'FeatureCollection',
		features: []
	  });

	};
  
	onMount(() => {
	  initMap();
	});
  </script>
  
  <style>
	#map {
	  width: 100%;
	  height: 100vh;
	}
  
	.sidebar {
	  position: absolute;
	  top: 10px;
	  left: 10px;
	  background: white;
	  padding: 10px;
	  z-index: 1;
	  max-width: 200px;
	  border-radius: 4px;
	  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	}
  
	button {
	  margin-top: 10px;
	  padding: 5px;
	  background: #007bff;
	  color: white;
	  border: none;
	  border-radius: 4px;
	  cursor: pointer;
	}
  
	button.fetch {
	  background: #28a745;
	}
  </style>
  
  <div id="map"></div>
  
  <div class="sidebar">
	<h3>H3 Indices</h3>
	<ul>
	  {#each h3Indices as index}
		<li>{index}</li>
	  {/each}
	</ul>
  
	<button class="fetch" on:click={calculateH3Indices}>Fetch H3 Indices</button>
	<button on:click={clearPolygon}>Clear Polygon</button>
  </div>
  