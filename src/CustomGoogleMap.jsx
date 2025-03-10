import React, { useEffect, useRef, useState } from 'react';

export const CustomGoogleMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const infoWindowsRef = useRef([]);
  const [initialLocationSet, setInitialLocationSet] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Group venues by floor for better organization
  const getVenuesByDepartmentAndFloor = (departmentName) => {
    const filteredVenues = Venues.filter(venue => 
      venue.department === departmentName
    );
    
    // Group by floor
    const groupedByFloor = {};
    filteredVenues.forEach(venue => {
      if (!groupedByFloor[venue.floor]) {
        groupedByFloor[venue.floor] = [];
      }
      groupedByFloor[venue.floor].push(venue);
    });
    
    return groupedByFloor;
  };

  useEffect(() => {
    const initMap = () => {
      // Campus boundary coordinates
      const boundaryCoords = [
        { lat: 9.150050, lng: 77.830462 }, // Top Left
        { lat: 9.148119, lng: 77.834707 }, // Top Right
        { lat: 9.150166, lng: 77.833030 }, // Top center
        { lat: 9.146250, lng: 77.832484 }, // Bottom Right
        { lat: 9.148910, lng: 77.826296 }, // Bottom Left
      ];

      // Calculate center point of boundary
      const center = {
        lat: (Math.max(...boundaryCoords.map(c => c.lat)) + Math.min(...boundaryCoords.map(c => c.lat))) / 2,
        lng: (Math.max(...boundaryCoords.map(c => c.lng)) + Math.min(...boundaryCoords.map(c => c.lng))) / 2
      };

      // Create map container with round shape
      const mapContainer = mapRef.current;
      mapContainer.style.borderRadius = '50%';
      mapContainer.style.overflow = 'hidden';

      // Calculate initial zoom level to fit boundary
      const bounds = new window.google.maps.LatLngBounds();
      boundaryCoords.forEach(coord => bounds.extend(coord));

      // Create the map with updated options
      const map = new window.google.maps.Map(mapContainer, {
        center: center,
        zoom: 20,
        mapTypeId: 'satellite',
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false, 
        zoomControl: true,
        rotateControl: true,
        heading: 0,
        tilt: 45,
        gestureHandling: 'greedy',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          },
          // Custom styling to complement gradient theme
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#4682B4' }]
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#E8E8E8' }]
          }
        ],
        restriction: {
          latLngBounds: {
            north: bounds.getNorthEast().lat() + 0.001,
            south: bounds.getSouthWest().lat() - 0.001,
            east: bounds.getNorthEast().lng() + 0.001,
            west: bounds.getSouthWest().lng() - 0.001
          },
          strictBounds: true
        }
      });

      // Fit map to boundary with padding
      map.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      });

      mapInstanceRef.current = map;

      // Add current location marker
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

            // Create blue arrow marker for current location
            const locationMarker = new window.google.maps.Marker({
              position: pos,
              map: map,
              title: 'You are here',
              icon: {
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 8,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                rotation: position.coords.heading || 0
              },
              zIndex: 9999,
              optimized: false
            });
            currentLocationMarkerRef.current = locationMarker;

            // Center map on current location
            map.setCenter(pos);
            map.setZoom(19);

            // Watch for location updates
            navigator.geolocation.watchPosition(
              (newPosition) => {
                const newPos = {
                  lat: newPosition.coords.latitude,
                  lng: newPosition.coords.longitude
                };
                locationMarker.setPosition(newPos);
                if (newPosition.coords.heading !== null) {
                  const icon = locationMarker.getIcon();
                  icon.rotation = newPosition.coords.heading;
                  locationMarker.setIcon(icon);
                }
              },
              null,
              { enableHighAccuracy: true }
            );
          },
          (error) => {
            console.error('Location error:', error);
            alert('Please enable location access to see your position on the map');
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      }

      // Setup directions renderer with updated path styling
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 8,
          strokeOpacity: 0.8
        }
      });
      directionsRendererRef.current = directionsRenderer;

      // Function to get icon based on category
      const getIconForCategory = (category) => {
        const iconBase = 'https://maps.google.com/mapfiles/ms/icons/';
        switch (category) {
          case 'academic':
            return {
              url: `school.png`,
              scaledSize: new window.google.maps.Size(40, 40),
              labelOrigin: new window.google.maps.Point(15, -10)
            };
          case 'hostel':
            return {
              url: `Hostel.jpg`,
              scaledSize: new window.google.maps.Size(40, 40),
              labelOrigin: new window.google.maps.Point(15, -10)
            };
          case 'facility':
            return {
              url: `Library.jpg`,
              scaledSize: new window.google.maps.Size(40, 40),
              labelOrigin: new window.google.maps.Point(15, -10)
            };
          case 'entrance':
            return {
              url: `Entry.png`,
              scaledSize: new window.google.maps.Size(40, 40),
              labelOrigin: new window.google.maps.Point(15, -10)
            };
          default:
            return {
              url: `restaurant.png`,
              scaledSize: new window.google.maps.Size(40, 40),
              labelOrigin: new window.google.maps.Point(15, -10)
            };
        }
      };

      // Function to get department label
      const getDepartmentLabel = (name, category) => {
        if (category === 'academic') {
          if (name.includes('CSE')) return 'CSE';
          if (name.includes('IT')) return 'IT';
          if (name.includes('ECE')) return 'ECE';
          if (name.includes('EEE')) return 'EEE';
          if (name.includes('AIDS')) return 'AIDS';
          if (name.includes('S&H')) return 'S&H';
          if (name.includes('Mechanical')) return 'MECH';
          if (name.includes('Civil')) return 'CIVIL';
        } else if (category === 'hostel') {
          if (name.includes('BOYS')) return 'Boys Hostel';
          if (name.includes('Girls')) return 'Girls Hostel';
        } else if (category === 'facility') {
          return 'Library';
        }
        else if (category === 'entrance') {
            return 'Entrance';
          
        } else if (category === 'canteen') {
          return 'Canteen';
        }
        return '';
      };

      // Add locations with categories and descriptions
      const departments = [
        { 
          name: 'CSE Block', 
          position: { lat: 9.146681197724407, lng: 77.8323113316056 },
          category: 'academic',
          description: 'Computer Science and Engineering department'
        },
        { 
          name: 'IT Block', 
          position: { lat: 9.147593, lng: 77.831619 },
          category: 'academic',
          description: 'Information Technology department'
        },
        { 
          name: 'Mechanical Block', 
          position: { lat: 9.149662, lng: 77.830538 },
          category: 'academic',
          description: 'Mechanical Engineering department'
        },
        { 
          name: 'EEE Block', 
          position: { lat: 9.14649372916794, lng: 77.83159518680945 },
          category: 'academic',
          description: 'Electrical and Electronics Engineering department'
        },
        { 
          name: 'AIDS Block', 
          position: { lat: 9.14658097305328, lng: 77.83082289584259 },
          category: 'academic',
          description: 'Artificial Intelligence Engineering department'
        },
        { 
          name: 'ECE Block', 
          position: { lat: 9.147242306725596, lng: 77.83081224017988 },
          category: 'academic',
          description: 'Electronics and Communication Engineering department'
        },
        { 
          name: 'BOYS HOSTEL 1', 
          position: { lat: 9.147170, lng: 77.827959 },
          category: 'hostel',
          description: 'Accommodation for male students'
        },
        { 
          name: 'Entrance', 
          position: { lat: 9.147921, lng: 77.834648 },
          category: 'entrance',
          description: 'Main entrance gate'
        },
        { 
          name: 'Girls Hostel', 
          position: { lat: 9.150107, lng: 77.833010 },
          category: 'hostel',
          description: 'Accommodation for female students'
        },
        { 
          name: 'Canteen Boys/Girls', 
          position: { lat: 9.147295601717621, lng: 77.83241690047365 },
          category: 'canteen',
          description: 'Main campus cafeteria'
        },
        { 
          name: 'Auditorium',
          position: { lat: 9.149432473997337, lng: 77.83210688876441 },
          category: 'canteen',
          description: 'Main campus cafeteria'
        },
        { 
          name: 'Library',
          position: { lat: 9.148418781524288, lng: 77.83118898864282 },
          category: 'facility',
          description: 'Central library with study areas'
        },
        { 
          name: 'BOYS Hostel 2', 
          position: { lat: 9.14876500396776, lng: 77.8271088098364 },
          category: 'hostel',
          description: 'Boys Hostel 2'
        },
        { 
          name: 'Civil Block', 
          position: { lat: 9.148952427380262, lng: 77.83121674272778 },
          category: 'academic',
          description: 'Civil Engineering department'
        },
        { 
          name: 'S&H Block', 
          position: { lat:9.148280077767497, lng: 77.83221497408572 },
          category: 'academic',
          description: 'S&H Block'
        }
      ];

      // Function to close all info windows
      const closeAllInfoWindows = () => {
        infoWindowsRef.current.forEach(window => window.close());
      };

      // No more click listener for coordinates display as requested by user
      
      departments.forEach(dept => {
        const marker = new window.google.maps.Marker({
          position: dept.position,
          map: map,
          title: dept.name,
          icon: getIconForCategory(dept.category),
          label: {
            text: getDepartmentLabel(dept.name, dept.category),
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 'bold',
            className: 'marker-label'
          }
        });

        // Styled info window that matches the theme
        const infowindow = new window.google.maps.InfoWindow({
          content: 
            `<div style="padding: 16px; min-width: 200px; background-color: #21013c; color: white; border-radius: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 8px; color: white;">${dept.name}</h3>
              <p style="margin-bottom: 12px; color: #e0e0e0;">${dept.description}</p>
              <button 
                onclick="window.showRoute(${dept.position.lat}, ${dept.position.lng})"
                style="
                  background: #1a73e8;
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 20px;
                  cursor: pointer;
                  font-weight: 500;
                  width: 100%;
                  ${dept.category === 'academic' ? 'margin-bottom: 8px;' : ''}
                "
              >
                Show Path
              </button>
              ${dept.category === 'academic' ? `
              <button 
                onclick="window.showDetails('${dept.name}')"
                style="
                  background: #1a73e8;
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 20px;
                  cursor: pointer;
                  font-weight: 500;
                  width: 100%;
                "
              >
                Show Details
              </button>` : ''}
            </div>`
        });
        infoWindowsRef.current.push(infowindow);

        marker.addListener('click', () => {
          // Close all other info windows first
          closeAllInfoWindows();
          
          // Center the map on the marker
          const markerPosition = marker.getPosition();
          map.setCenter(markerPosition);
          
          // Open the InfoWindow in the center of the map (not at marker position)
          infowindow.setPosition(map.getCenter());
          infowindow.open(map);
        });

        // Add click listener to close InfoWindow when clicking outside
        map.addListener('click', () => {
          closeAllInfoWindows();
        });
      });

      // Function to show route with real-time updates - modified to not scroll for non-academic categories
      window.showRoute = (destLat, destLng) => {
        // Close all info windows first
        closeAllInfoWindows();
        
        // Get campus center coordinates for fallback
        const campusCenter = {
          lat: (Math.max(...boundaryCoords.map(c => c.lat)) + Math.min(...boundaryCoords.map(c => c.lat))) / 2,
          lng: (Math.max(...boundaryCoords.map(c => c.lng)) + Math.min(...boundaryCoords.map(c => c.lng))) / 2
        };
        
        // Define campus radius (approximate)
        const campusRadius = 0.003; // roughly 300 meters
        
        // Check if user location is available
        if (!userLocation) {
          // Use campus center as fallback without showing an error alert
          const directionsService = new window.google.maps.DirectionsService();
          const destination = { lat: destLat, lng: destLng };
          
          directionsService.route({
            origin: campusCenter,
            destination: destination,
            travelMode: 'WALKING'
          }, (response, status) => {
            if (status === 'OK' && directionsRendererRef.current) {
              directionsRendererRef.current.setDirections(response);
              
              // Find the department associated with this destination
              const targetDept = departments.find(dept => 
                Math.abs(dept.position.lat - destLat) < 0.0001 && 
                Math.abs(dept.position.lng - destLng) < 0.0001
              );
              
              // Only set selected department but don't scroll for Show Path
              if (targetDept) {
                setSelectedDepartment(targetDept);
                // Only show details for academic buildings but don't scroll
                if (targetDept.category === 'academic') {
                  setShowDetails(true);
                }
              }
            } else {
              console.error('Directions request failed due to ' + status);
            }
          });
          return;
        }
        
        // Check if user is inside campus radius
        const isInsideCampus = Math.sqrt(
          Math.pow(userLocation.lat - campusCenter.lat, 2) + 
          Math.pow(userLocation.lng - campusCenter.lng, 2)
        ) <= campusRadius;
        
        const directionsService = new window.google.maps.DirectionsService();
        const destination = { lat: destLat, lng: destLng };
        
        // Use the Directions API to render the path
        directionsService.route({
          origin: isInsideCampus ? userLocation : campusCenter,
          destination: destination,
          travelMode: 'WALKING'
        }, (response, status) => {
          if (status === 'OK' && directionsRendererRef.current) {
            directionsRendererRef.current.setDirections(response);
            
            // Find the department associated with this destination
            const targetDept = departments.find(dept => 
              Math.abs(dept.position.lat - destLat) < 0.0001 && 
              Math.abs(dept.position.lng - destLng) < 0.0001
            );
            
            // Only set selected department but don't scroll for Show Path
            if (targetDept) {
              setSelectedDepartment(targetDept);
              // Only show details for academic buildings but don't scroll
              if (targetDept.category === 'academic') {
                setShowDetails(true);
              }
            }
          } else {
            console.error('Directions request failed due to ' + status);
          }
        });
      };

      // Function to show details
      window.showDetails = (departmentName) => {
        // Close all info windows first
        closeAllInfoWindows();
        
        const department = departments.find(dept => dept.name === departmentName);
        if (department) {
          setSelectedDepartment(department);
          setShowDetails(true);
          
          // Scroll to venue section with smooth animation
          setTimeout(() => {
            const venueSection = document.querySelector('.venue-info');
            if (venueSection) {
              venueSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100); // Reduced delay for faster scrolling
        }
      };

      // Watch user location without auto-centering the map
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

            // Update user location state for path calculation
            setUserLocation(pos);

            // Create or update current location marker
            if (!currentLocationMarkerRef.current) {
              currentLocationMarkerRef.current = new window.google.maps.Marker({
                position: pos,
                map: mapInstanceRef.current,
                title: 'You are here',
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: '#4285F4',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                  scale: 12
                },
                zIndex: 999
              });
            } else {
              currentLocationMarkerRef.current.setPosition(pos);
            }

            // Set initial location flag only once
            if (!initialLocationSet) {
              setInitialLocationSet(true);
              mapInstanceRef.current.setCenter(pos);
              mapInstanceRef.current.setZoom(19);
            }

            // If there's an active directions request, update it
            if (directionsRendererRef.current && directionsRendererRef.current.getDirections()) {
              const currentRoute = directionsRendererRef.current.getDirections();
              if (currentRoute) {
                const destination = currentRoute.routes[0].legs[0].end_location;
                window.showRoute(destination.lat(), destination.lng());
              }
            }
          },
          (error) => console.error('Error watching position:', error),
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
          }
        );
      }
    };

    // Load Google Maps
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyA25G33CgnTSorkzsS39vJtmE6T3gRQ-bw';
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    // Cleanup function
    return () => {
      if (window.google && mapInstanceRef.current) {
        window.google.maps.event.clearInstanceListeners(mapInstanceRef.current);
      }
      delete window.showRoute;
      delete window.showDetails;
    };
  }, [userLocation]);

  // Enhanced "Move to Current Location" button with better performance
  const handleMoveToCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Remove existing marker if any
          if (currentLocationMarkerRef.current) {
            currentLocationMarkerRef.current.setMap(null);
          }

          // Create new marker at current location
          currentLocationMarkerRef.current = new window.google.maps.Marker({
            position: pos,
            map: mapInstanceRef.current,
            title: 'You are here',
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              rotation: position.coords.heading || 0
            },
            zIndex: 9999,
            optimized: false
          });

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(pos);
            mapInstanceRef.current.setZoom(19);
          }
        },
        (error) => {
          console.error('Location error:', error);
          alert('Please enable location access to see your position on the map');
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by this browser');
    }
  };

  // Venues data organized by department
  const Venues = [
    // CSE Venues
    { name: 'Seminar Hall', floor: 'Second Floor', department: 'CSE Block' },
    { name: 'Activity Halls', floor: 'Second Floor', department: 'CSE Block' },
    { name: 'S6', floor: 'Second Floor', department: 'CSE Block' },
    { name: 'F7', floor: 'First Floor', department: 'CSE Block' },
    { name: 'F12', floor: 'First Floor', department: 'CSE Block' },
    { name: 'F14', floor: 'First Floor', department: 'CSE Block' },
    { name: 'ICL Lab', floor: 'Ground Floor', department: 'CSE Block' },
    { name: 'IBM Lab', floor: 'Ground Floor', department: 'CSE Block' },
    { name: 'APJ Lab', floor: 'Ground Floor', department: 'CSE Block' },
    { name: 'CVR Lab', floor: 'Ground Floor', department: 'CSE Block' },
    { name: 'CISCO Lab', floor: 'Ground Floor', department: 'CSE Block' },
    { name: 'RM Lab', floor: 'Ground Floor', department: 'CSE Block' },
    
    //IT Venues
    { name: 'Seminar Hall', floor: 'Second Floor', department: 'IT Block' },
    { name: 'Smart Classroom 1', floor: 'First Floor', department: 'IT Block' },
    { name: 'Smart Classroom 2', floor: 'First Floor', department: 'IT Block' },
    { name: 'UG I', floor: 'Ground Floor', department: 'IT Block' },
    { name: 'UG II', floor: 'Ground Floor', department: 'IT Block' },
    { name: 'UG III', floor: 'First Floor', department: 'IT Block' },

    //AIDS Venues
    { name: 'Seminar Hall', floor: 'First Floor', department: 'AIDS Block' },
    { name: 'Lecture Hall', floor: 'First Floor', department: 'AIDS Block' },
    { name: 'AI Lab', floor: 'Ground Floor', department: 'AIDS Block' },
    { name: 'DA Lab', floor: 'Ground Floor', department: 'AIDS Block' },
    { name: 'DL Lab', floor: 'Ground Floor', department: 'AIDS Block' },

    //Civil Venues
    { name: 'LH3', floor: 'First Floor', department: 'Civil Block' },
    { name: 'LH4', floor: 'First Floor', department: 'Civil Block' },
    { name: 'Smart Classroom', floor: 'First Floor', department: 'Civil Block' },
    { name: 'Seminar Hall', floor: 'First Floor', department: 'Civil Block' },
    { name: 'Survey Lab', floor: 'First Floor', department: 'Civil Block' },
    { name: 'Soil Lab', floor: 'Ground Floor', department: 'Civil Block' },
    { name: 'CAD Lab', floor: 'Ground Floor', department: 'Civil Block' },

    //ECE Venues
    { name: 'Networks Lab', floor: 'Ground Floor', department: 'ECE Block' },
    { name: 'Embedded Lab', floor: 'Ground Floor', department: 'ECE Block' },
    { name: 'Devices Lab', floor: 'Ground Floor', department: 'ECE Block' },
    { name: 'Smart Classroom', floor: 'First Floor', department: 'ECE Block' },
    { name: 'VLSI Lab', floor: 'First Floor', department: 'ECE Block' },
    { name: 'H14', floor: 'First Floor', department: 'ECE Block' },
    { name: 'Seminar Hall', floor: 'Second Floor', department: 'ECE Block' },
    { name: 'H21', floor: 'Second Floor', department: 'ECE Block' },
    { name: 'DSP Lab', floor: 'Second Floor', department: 'ECE Block' },

    //MECH Venues
    { name: 'Lecture Halls', floor: 'First Floor', department: 'Mechanical Block' },
    { name: 'CAD Lab', floor: 'Ground Floor', department: 'Mechanical Block' },
    { name: 'Seminar Hall', floor: 'Ground Floor', department: 'Mechanical Block' },
    { name: 'Smart Classroom', floor: 'Ground Floor', department: 'Mechanical Block' },

    //EEE Venues
    { name: 'Seminar Hall', floor: 'Second Floor', department: 'EEE Block' },
    { name: 'Active Classroom', floor: 'Second Floor', department: 'EEE Block' },
    { name: 'H2', floor: 'First Floor', department: 'EEE Block' },
    { name: 'H3', floor: 'First Floor', department: 'EEE Block' },
    { name: 'H5', floor: 'First Floor', department: 'EEE Block' },
    { name: 'Electronics Lab', floor: 'First Floor', department: 'EEE Block' },
    { name: 'Control System Lab', floor: 'First Floor', department: 'EEE Block' },
    { name: 'Electrical Workshop lab', floor: 'Ground Floor', department: 'EEE Block' },
    { name: 'Power Electronics lab', floor: 'Ground Floor', department: 'EEE Block' },
    { name: 'New computer lab', floor: 'Ground Floor', department: 'EEE Block' },
    { name: 'High Voltage Lab', floor: 'Ground Floor', department: 'EEE Block' },
    { name: 'Smart Protection and Control Lab', floor: 'Ground Floor', department: 'EEE Block' },


    //S&H Block
    { name: 'English Lab', floor: 'Second Floor', department: 'S&H Block' },
    { name: 'Drawing Hall ', floor: 'Second Floor', department: 'S&H Block' },
    { name: 'Seminar hall', floor: 'First Floor', department: 'S&H Block' },
    { name: 'Smart Classroom', floor: 'Ground Floor', department: 'S&H Block' },
    { name: 'LH3', floor: 'Ground Floor', department: 'S&H Block' },
    { name: 'LH2', floor: 'Ground Floor', department: 'S&H Block' },


  ];

  // Convert venues to organized structure by floor for the selected department
  const organizedVenues = selectedDepartment 
    ? getVenuesByDepartmentAndFloor(selectedDepartment.name) 
    : {};

  return (
    <div className="flex flex-col items-center w-full min-h-screen overflow-y-auto pb-8" style={{
      background: 'linear-gradient(135deg, #21013c, #2d024f, #2b024b, #1f0139, #0e001e, #0b001a, #300552, #300254, #310255, #0a0018)',
      fontFamily: 'Poppins, sans-serif',
      color: '#ffffff',
    }}>
      <h2 className="text-2xl font-bold my-2 text-white text-center">NEC Campus Compass</h2>
      
      {/* Map container with pulse animation - improved for better centering and responsive sizing */}
      <div className="w-full flex justify-center"> 
        <div 
          ref={mapRef} 
          style={{ 
            height: '80vw', // Responsive height based on viewport width
            width: '80vw', // Responsive width based on viewport width
            maxHeight: '500px', // Maximum height
            maxWidth: '500px', // Maximum width
            position: 'relative',
            borderRadius: '50%',
            padding: '0',
            animation: 'pulse 2s infinite',
            margin: '0 auto' // Center the map
          }} 
          className="mb-2"
        />
      </div>
      
      {/* Animation styles with improved media queries */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(49, 2, 85, 0.7); }
            50% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(49, 2, 85, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(49, 2, 85, 0); }
          }
          
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          
          @keyframes slideIn {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
          }
          
          .animate-slideIn {
            animation: slideIn 0.5s ease-out forwards;
          }
          
          @media (max-width: 768px) {
            h2 {
              font-size: 1.25rem !important;
              margin: 0.5rem 0 !important;
            }
            
            button {
              font-size: 0.875rem !important;
              padding: 0.5rem 0.875rem !important;
              margin-top: 0.5rem !important;
            }
            
            .venue-info {
              padding: 0.5rem !important;
            }
            
            .venue-table th,
            .venue-table td {
              padding: 0.25rem 0.5rem !important;
              font-size: 0.875rem !important;
            }
          }
          
          /* For very small screens */
          @media (max-width: 480px) {
            h2 {
              font-size: 1rem !important;
            }
            
            .map-helper-text {
              font-size: 0.75rem !important;
              padding: 0.5rem !important;
              margin-top: 0.25rem !important;
            }
          }
        `}
      </style>
      
      {/* Move to Current Location button removed as requested */}
      
      {/* Helper text - more compact */}
      <div className="mt-2 p-2 rounded-lg text-center w-full max-w-md map-helper-text" 
        style={{
          background: 'rgba(33, 1, 60, 0.7)',
          color: 'white',
          borderRadius: '10px',
          backdropFilter: 'blur(5px)',
          fontSize: '0.9rem'
        }}>
        <p>Zoom and pan to explore. Click markers for walking paths.</p>
      </div>
      
      {/* Venue details table with enhanced styling and floor grouping - improved for mobile and PC */}
      {showDetails && selectedDepartment && selectedDepartment.category === 'academic' && (
        <div className="mt-4 p-4 rounded-lg w-full max-w-4xl venue-table venue-info overflow-y-auto animate-fadeIn"
          style={{
            background: 'rgba(33, 1, 60, 0.9)',
            color: 'white',
            borderRadius: '15px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            marginBottom: '1.5rem',
            transition: 'all 0.3s ease-in-out',
            animation: 'fadeIn 0.5s ease-out',
            border: '2px solid rgba(156, 39, 176, 0.3)'
          }}>
          <h3 className="text-2xl font-bold mb-4 text-center" 
            style={{
              background: 'linear-gradient(90deg, #9c27b0, #673ab7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
            {selectedDepartment.name} Venues
          </h3>
          <div className="text-center mb-3 text-purple-200 text-sm">
            <p>Below are all available venues in {selectedDepartment.name}</p>
          </div>
          
          {/* Loop through each floor group with animations */}
          {Object.keys(organizedVenues).sort((a, b) => {
            // Sort floors in logical order: Ground Floor, First Floor, Second Floor, etc.
            const floorOrder = {
              'Ground Floor': 1,
              'First Floor': 2,
              'Second Floor': 3,
              'Third Floor': 4
            };
            return floorOrder[a] - floorOrder[b];
          }).map((floor, floorIndex) => (
            <div key={floorIndex} className="mb-5 animate-slideIn" 
              style={{
                animation: `slideIn 0.3s ease-out forwards ${0.1 + (floorIndex * 0.1)}s`,
                opacity: 0,
                transform: 'translateY(20px)'
              }}>
              <h4 className="text-lg font-semibold mb-2 pl-2 border-l-4 border-purple-500"
                style={{
                  background: 'linear-gradient(90deg, #673ab7, #9c27b0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                {floor}
              </h4>
              
              {/* Proper table layout that works well on both mobile and PC */}
              <div className="overflow-x-auto rounded-lg shadow-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-purple-900/50 border-b border-purple-700">
                      <th className="py-2 px-3 text-left text-sm font-semibold text-white">Venue Name</th>
                      <th className="py-2 px-3 text-left text-sm font-semibold text-white">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizedVenues[floor].map((venue, venueIndex) => (
                      <tr 
                        key={venueIndex}
                        className="border-b border-purple-800/30 hover:bg-purple-800/40 transition-colors duration-150"
                        style={{ 
                          animation: `fadeIn 0.3s ease-out forwards ${0.2 + (venueIndex * 0.05)}s`,
                          opacity: 0
                        }}
                      >
                        <td className="py-2 px-3">
                          <div className="flex items-center">
                            <span className="inline-block w-3 h-3 rounded-full bg-purple-400 mr-2"></span>
                            <span className="font-medium text-white">{venue.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-purple-200 text-sm">
                          {venue.name.toLowerCase().includes('lab') ? 'Laboratory' :
                           venue.name.toLowerCase().includes('hall') ? 'Hall' :
                           venue.name.toLowerCase().includes('classroom') ? 'Classroom' :
                           'Room'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};