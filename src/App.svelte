<script>
	import { onMount } from "svelte";
	import maplibregl from "maplibre-gl";
	import MapboxDraw from "@mapbox/mapbox-gl-draw";
	import * as h3 from "h3-js";
	import _ from 'lodash';

	const geojsonUrl = `https://data.texas.gov/resource/m3yf-ffwm.geojson`;

	let map;
	let draw;
	let h3Indices = [];
	let polygonCoordinates = [];
	let showFetchButton = false;
	let firstPoint = null;
	let secondPoint = null;
	let isDrawingRectangle = false;
	let countyLayerLoaded = false;
	let drawingEnabled = true;
	let currentZoom = 6; 

	onMount(async () => {
		map = new maplibregl.Map({
			container: "map",
			style: "https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/openStreetMap.json",
			center: [-99.9018, 31.9686],
			zoom: currentZoom,
		});
		await loadCountyBoundaries();

		map.on("zoom", () => {
			currentZoom = map.getZoom();
			console.log("Current zoom:", currentZoom);
		});

		const NewSimpleSelect = _.extend(MapboxDraw.modes.simple_select, {
			dragMove() {},
		});

		const NewDirectSelect = _.extend(MapboxDraw.modes.direct_select, {
			dragFeature() {},
		});

		draw = new MapboxDraw({
			displayControlsDefault: false,
			controls: {
				polygon: false,
				trash: false,
				rectangle: false,
				circle: false,
			},
			defaultMode: "draw_polygon",
			modes: {
				...MapboxDraw.modes,
				simple_select: NewSimpleSelect,
				direct_select: NewDirectSelect,
			},
		});

		map.addControl(draw, "top-right");

		map.addControl(
			new maplibregl.GeolocateControl({
				positionOptions: { enableHighAccuracy: true },
				trackUserLocation: true,
			}),
		);
		map.addControl(new maplibregl.NavigationControl());


		map.on("draw.create", (e) => {
			const feature = e.features[0];
			console.log("Feature:", feature);

			if (feature.geometry.type === "Polygon") {
				polygonCoordinates = feature.geometry.coordinates[0];
				showFetchButton = true;
				console.log(
					"Polygon coordinates captured:",
					polygonCoordinates,
				);
			}
		});

		map.on("click", (e) => {
			if (countyLayerLoaded) {
				const features = map.queryRenderedFeatures(e.point, {
					layers: ["county-boundaries-layer"],
				});

				if (features.length > 0) {
					const county = features[0];
					const countyCoordinates = county.geometry.coordinates[0];
					console.log("Selected County:", county);

					fetchH3IndicesForCounty(countyCoordinates);
				}
			}
		});
	});

	const loadCountyBoundaries = async () => {
		try {
			const response = await fetch(geojsonUrl);
			const geojson = await response.json();

			map.addSource("county-boundaries", {
				type: "geojson",
				data: geojson,
			});

			map.addLayer({
				id: "county-boundaries-layer",
				type: "fill",
				source: "county-boundaries",
				paint: {
					"fill-color": "#888888",
					"fill-opacity": 0.5,
					"fill-outline-color": "#000000",
				},
			});

			countyLayerLoaded = true;
		} catch (error) {
			console.error("Error loading county boundaries:", error);
		}
	};

	const getH3Resolution = (zoom) => {
		if (zoom >= 10) {
			return 7; 
		} else if (zoom >= 5) {
			return 5; 
		} else {
			return 3;
		}
	};

	const fetchH3IndicesForCounty = (countyCoordinates) => {
		if (countyCoordinates.length === 0) return;

		const closedCountyPolygon = countyCoordinates.concat([
			countyCoordinates[0],
		]);

		const formattedPolygon = closedCountyPolygon.map((coords) => [
			coords[1],
			coords[0],
		]);

		console.log("County Polygon Coordinates: ", formattedPolygon);

		const h3Resolution = getH3Resolution(currentZoom); // Get resolution based on zoom

		h3Indices = h3.polygonToCells(formattedPolygon, h3Resolution);

		console.log("H3 Indices for County at resolution", h3Resolution, ":", h3Indices);
	};

	const calculateH3Indices = () => {
		if (polygonCoordinates.length === 0) return;

		const closedPolygon = polygonCoordinates.concat([
			polygonCoordinates[0],
		]);

		const formattedPolygon = closedPolygon.map((coords) => [
			coords[1],
			coords[0],
		]);

		console.log("Polygon Coordinates: ", formattedPolygon);

		const h3Resolution = getH3Resolution(currentZoom); // Get resolution based on zoom

		h3Indices = h3.polygonToCells(formattedPolygon, h3Resolution);

		console.log("H3 Indices at resolution", h3Resolution, ":", h3Indices);
	};

	const clearPolygon = () => {
		draw.deleteAll();
		polygonCoordinates = [];
		firstPoint = null;
		secondPoint = null;
		showFetchButton = false;
		isDrawingRectangle = false;
		console.log("Cleared all polygons.");
		draw.changeMode("draw_polygon");
	};

	const createRectangle = () => {
		firstPoint = null;
		secondPoint = null;
		isDrawingRectangle = true;

		map.once("click", (e) => {
			if (!isDrawingRectangle) return;
			firstPoint = [e.lngLat.lng, e.lngLat.lat];
			console.log("First point:", firstPoint);

			map.once("click", (e) => {
				if (!isDrawingRectangle) return;
				secondPoint = [e.lngLat.lng, e.lngLat.lat];
				console.log("Second point:", secondPoint);

				if (firstPoint && secondPoint) {
					const bounds = [
						[firstPoint[0], firstPoint[1]],
						[secondPoint[0], firstPoint[1]],
						[secondPoint[0], secondPoint[1]],
						[firstPoint[0], secondPoint[1]],
						[firstPoint[0], firstPoint[1]],
					];

					draw.add({
						type: "Feature",
						geometry: {
							type: "Polygon",
							coordinates: [bounds],
						},
					});

					polygonCoordinates = bounds;

					isDrawingRectangle = false;

					showFetchButton = true;

					console.log("Rectangle created:", bounds);
				}
			});
		});
	};

	const toggleDrawing = () => {
		drawingEnabled = !drawingEnabled;
		if (drawingEnabled) {
			draw.changeMode("draw_polygon");
			console.log("Drawing enabled");
		} else {
			draw.changeMode("simple_select");
			console.log("Drawing disabled");
		}
	};
</script>

<div id="map"></div>

<div class="control-container">
	<button class="control-button" on:click={toggleDrawing}>
		{drawingEnabled ? "Disable Drawing" : "Enable Drawing"}
	</button>

	<button
		class="control-button {showFetchButton ? 'visible' : 'hidden'}"
		on:click={calculateH3Indices}
	>
		Fetch H3 Indices
	</button>

	<button class="control-button" on:click={clearPolygon}>Clear Polygon</button
	>

	<button class="control-button" on:click={createRectangle}
		>Draw Rectangle</button
	>
</div>

<style>
	#map {
		width: 100vw;
		height: 100vh;
	}

	.control-container {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 10;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.control-button {
		background-color: #fff;
		padding: 10px;
		cursor: pointer;
		border: 1px solid #ccc;
		border-radius: 3px;
		font-size: 14px;
		display: inline-block;
	}

	.hidden {
		display: none;
	}

	.visible {
		display: inline-block;
	}
</style>
