// DOM Elements
const tabAnimation = document.getElementById('tab-animation');
const tabHeatmap = document.getElementById('tab-heatmap');
const animationContent = document.getElementById('animation-content');
const heatmapContent = document.getElementById('heatmap-content');
const playPauseBtn = document.getElementById('play-pause-btn');
const playPauseIcon = playPauseBtn.querySelector('svg');
const playPauseText = playPauseBtn.querySelector('span');
const yearSlider = document.getElementById('year-slider');
const yearLabel = document.getElementById('year-label');
const drilldownDropdown = document.getElementById('drilldown-dropdown');
const heatmapDropdown = document.getElementById('heatmap-dropdown');

// Ensure dropdown styling is applied
document.addEventListener('DOMContentLoaded', function() {
    // Adjust dropdown widths to fit content if needed
    const adjustDropdownWidth = (select) => {
        // Create temporary element to measure text width
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.fontFamily = getComputedStyle(select).fontFamily;
        tempSpan.style.fontSize = getComputedStyle(select).fontSize;
        tempSpan.style.fontWeight = getComputedStyle(select).fontWeight;
        tempSpan.style.whiteSpace = 'nowrap';
        document.body.appendChild(tempSpan);
        
        // Find the longest option text
        let maxWidth = 0;
        Array.from(select.options).forEach(option => {
            tempSpan.textContent = option.text;
            const width = tempSpan.offsetWidth;
            maxWidth = Math.max(maxWidth, width);
        });
        
        // Add padding for arrow and general spacing
        const minWidth = maxWidth + 70; // 42px for arrow area + padding
        select.style.width = `${Math.max(200, minWidth)}px`;
        
        document.body.removeChild(tempSpan);
    };
    
    // Apply to both dropdowns
    adjustDropdownWidth(drilldownDropdown);
    adjustDropdownWidth(heatmapDropdown);
    
    // Re-adjust if window resizes
    window.addEventListener('resize', () => {
        adjustDropdownWidth(drilldownDropdown);
        adjustDropdownWidth(heatmapDropdown);
    });
});

// State variables
let isPlaying = false;
let animationInterval = null;
let currentYear = 1850;
let currentDrilldown = 'megaclass';

// Initialize maps and charts
let mapChart = null;
let barChart = null;
let heatmapChart = null;

// Tab switching with smooth transitions
tabAnimation.addEventListener('click', () => {
    if (!tabAnimation.classList.contains('active')) {
        // Add fade-out effect to current content
        heatmapContent.style.opacity = '0';
        
        setTimeout(() => {
            tabAnimation.classList.add('active');
            tabHeatmap.classList.remove('active');
            
            heatmapContent.classList.remove('active');
            animationContent.classList.add('active');
            
            // Fade in the new content
            setTimeout(() => {
                animationContent.style.opacity = '1';
            }, 50);
        }, 200);
    }
});

tabHeatmap.addEventListener('click', () => {
    if (!tabHeatmap.classList.contains('active')) {
        // Add fade-out effect to current content
        animationContent.style.opacity = '0';
        
        setTimeout(() => {
            tabHeatmap.classList.add('active');
            tabAnimation.classList.remove('active');
            
            animationContent.classList.remove('active');
            heatmapContent.classList.add('active');
            
            // Fade in the new content
            setTimeout(() => {
                heatmapContent.style.opacity = '1';
                
                // Initialize heatmap if needed
                if (!heatmapChart) {
                    updateHeatmap();
                }
            }, 50);
        }, 200);
    }
});

// Play/Pause animation with icon and text update
playPauseBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        playPauseIcon.innerHTML = '<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"></path>';
        playPauseText.textContent = 'Pause';
        playPauseBtn.classList.add('playing');
        startAnimation();
    } else {
        playPauseIcon.innerHTML = '<path d="M8 5v14l11-7z"></path>';
        playPauseText.textContent = 'Play';
        playPauseBtn.classList.remove('playing');
        stopAnimation();
    }
});

// Smooth year slider with debounce
let sliderTimeout = null;
yearSlider.addEventListener('input', () => {
    const year = parseInt(yearSlider.value);
    yearLabel.textContent = `Year: ${year}`;
    
    // Update the position marker with a glow effect
    const percent = (year - 1850) / (2013 - 1850) * 100;
    yearSlider.style.backgroundImage = `linear-gradient(to right, var(--cosmic-highlight) ${percent}%, rgba(30, 60, 110, 0.5) ${percent}%)`;
    
    // Debounce updating the map for smoother sliding experience
    clearTimeout(sliderTimeout);
    sliderTimeout = setTimeout(() => {
        currentYear = year;
        updateMap();
    }, 100);
});

// Drilldown dropdown with animation
drilldownDropdown.addEventListener('change', () => {
    // Apply a fade effect
    const mapDiv = document.getElementById('map');
    const barDiv = document.getElementById('bar-chart');
    mapDiv.style.opacity = '0.5';
    barDiv.style.opacity = '0.5';
    
    currentDrilldown = drilldownDropdown.value;
    
    setTimeout(() => {
        updateMap();
        setTimeout(() => {
            mapDiv.style.opacity = '1';
            barDiv.style.opacity = '1';
        }, 300);
    }, 100);
});

// Heatmap dropdown
heatmapDropdown.addEventListener('change', () => {
    const heatmapDiv = document.getElementById('composition-heatmap');
    heatmapDiv.style.opacity = '0.5';
    
    setTimeout(() => {
        updateHeatmap();
        setTimeout(() => {
            heatmapDiv.style.opacity = '1';
        }, 300);
    }, 100);
});

// Start animation with smooth transitions
function startAnimation() {
    if (animationInterval) {
        clearInterval(animationInterval);
    }
    
    animationInterval = setInterval(() => {
        if (currentYear >= 2013) {
            currentYear = 1850;
        } else {
            currentYear += 1;
        }
        
        yearSlider.value = currentYear;
        yearLabel.textContent = `Year: ${currentYear}`;
        
        // Update the position marker
        const percent = (currentYear - 1850) / (2013 - 1850) * 100;
        yearSlider.style.backgroundImage = `linear-gradient(to right, var(--cosmic-highlight) ${percent}%, rgba(30, 60, 110, 0.5) ${percent}%)`;
        
        updateMap();
    }, 800);
}

// Stop animation
function stopAnimation() {
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
}

// Update map and bar chart with loading indicator
async function updateMap() {
    try {
        // Show loading indicators
        const mapDiv = document.getElementById('map');
        const barDiv = document.getElementById('bar-chart');
        const mapTitle = document.getElementById('map-title');
        
        // Apply a subtle fade effect on the title
        mapTitle.style.opacity = '0.6';
        setTimeout(() => {
            mapTitle.textContent = `Meteorites in ${currentYear}`;
            mapTitle.style.opacity = '1';
        }, 200);
        
        // Fade out before updating charts
        mapDiv.style.transition = 'opacity 0.3s ease';
        barDiv.style.transition = 'opacity 0.3s ease';
        mapDiv.style.opacity = '0.7';
        barDiv.style.opacity = '0.7';
        
        // Only show loading spinners for longer data fetch operations
        // or when initially loading data
        const isInitialLoad = !mapDiv.hasChildNodes();
        if (isInitialLoad || Math.random() < 0.1) { // Occasionally show spinner for visual feedback
            if (!mapDiv.classList.contains('loading')) {
                const mapLoading = document.createElement('div');
                mapLoading.className = 'loading-spinner';
                mapDiv.appendChild(mapLoading);
                mapDiv.classList.add('loading');
            }
            
            if (!barDiv.classList.contains('loading')) {
                const barLoading = document.createElement('div');
                barLoading.className = 'loading-spinner';
                barDiv.appendChild(barLoading);
                barDiv.classList.add('loading');
            }
        }
        
        // Add a slight delay before fetching new data to allow for visual transition
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response = await fetch(`/api/map-data?year=${currentYear}&drilldown_column=${currentDrilldown}`);
        const data = await response.json();
        
        // Enhance color scheme for accessibility and night sky theme
        const categories = [...new Set(data.map_data.category)];
        const colorblindFriendlyPalette = [
            '#FFC857', // Yellow (bright)
            '#E9724C', // Orange/red (warm)
            '#C5D86D', // Light green (earthy)
            '#55D6BE', // Turquoise (cool)
            '#9B85A1', // Lavender/purple (different)
            '#F7F6CF', // Off-white (bright)
            '#8CB369', // Green (earthy)
            '#F49CBB', // Pink (bright)
            '#85C7F2', // Light blue (cool)
            '#636940', // Olive green (earthy)
            '#D4B483', // Tan (warm)
            '#6B9080', // Sage green (earthy)
            '#6D597A', // Plum (different)
            '#BAA898', // Taupe (warm)
            '#F6AA1C'  // Amber (bright)
        ];
        
        // Create enhanced color map
        const enhancedColorMap = {};
        categories.forEach((category, index) => {
            enhancedColorMap[category] = colorblindFriendlyPalette[index % colorblindFriendlyPalette.length];
        });
        
        // Apply enhanced color map to data
        data.map_data.color_map = enhancedColorMap;
        data.bar_data.color_map = enhancedColorMap;
        
        // Remove loading indicators
        const mapSpinner = mapDiv.querySelector('.loading-spinner');
        const barSpinner = barDiv.querySelector('.loading-spinner');
        if (mapSpinner) mapDiv.removeChild(mapSpinner);
        if (barSpinner) barDiv.removeChild(barSpinner);
        mapDiv.classList.remove('loading');
        barDiv.classList.remove('loading');
        
        renderMap(data.map_data);
        renderBarChart(data.bar_data);
        
        // Fade in after update
        setTimeout(() => {
            mapDiv.style.opacity = '1';
            barDiv.style.opacity = '1';
        }, 200);
    } catch (error) {
        console.error('Error fetching map data:', error);
    }
}

// Update heatmap with loading indicator
async function updateHeatmap() {
    try {
        const selectedGroup = heatmapDropdown.value;
        const heatmapDiv = document.getElementById('composition-heatmap');
        
        if (!heatmapDiv.classList.contains('loading')) {
            const heatmapLoading = document.createElement('div');
            heatmapLoading.className = 'loading-spinner';
            heatmapDiv.appendChild(heatmapLoading);
            heatmapDiv.classList.add('loading');
        }
        
        const response = await fetch(`/api/heatmap-data?selected_group=${selectedGroup}`);
        const data = await response.json();
        
        // Remove loading indicator
        const heatmapSpinner = heatmapDiv.querySelector('.loading-spinner');
        if (heatmapSpinner) heatmapDiv.removeChild(heatmapSpinner);
        heatmapDiv.classList.remove('loading');
        
        renderHeatmap(data);
    } catch (error) {
        console.error('Error fetching heatmap data:', error);
    }
}

// Render map with Apple-inspired styling
function renderMap(data) {
    const mapDiv = document.getElementById('map');
    
    // Create data for scatter mapbox
    const traces = [];
    const categories = [...new Set(data.category)];
    
    categories.forEach(category => {
        const indices = data.category.map((cat, idx) => cat === category ? idx : -1).filter(idx => idx !== -1);
        
        const trace = {
            type: 'scattermapbox',
            lat: indices.map(i => data.lat[i]),
            lon: indices.map(i => data.lon[i]),
            hoverinfo: 'name+text',
            hoverlabel: {
                bgcolor: 'rgba(6, 19, 48, 0.9)',
                bordercolor: 'rgba(95, 143, 255, 0.6)',
                font: {color: 'white'}
            },
            hovertemplate: 
                '<b>%{customdata.name}</b><br>' +
                'Mass: %{customdata.mass}g<br>' +
                'Class: %{customdata.recclass}<br>' +
                'Superclass: %{customdata.superclass}<br>' +
                'Megaclass: %{customdata.megaclass}<extra></extra>',
            customdata: indices.map(i => ({
                name: data.name[i],
                mass: data.mass[i],
                recclass: data.recclass[i],
                superclass: data.superclass[i],
                megaclass: data.megaclass[i]
            })),
            name: category,
            marker: {
                size: indices.map(i => Math.min(Math.max(Math.sqrt(data.mass[i]) / 10, 5), 15)),
                color: data.color_map[category],
                opacity: 0.9,
                line: {
                    color: '#ffffff',
                    width: 1
                }
            },
            mode: 'markers'
        };
        
        traces.push(trace);
    });
    
    const layout = {
        mapbox: {
            style: 'carto-darkmatter',
            center: { lat: 10, lon: 0 },
            zoom: 1.2
        },
        paper_bgcolor: 'rgba(4, 11, 28, 0.4)',
        plot_bgcolor: 'rgba(4, 11, 28, 0.2)',
        font: { 
            family: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
            color: 'white',
            size: 14
        },
        margin: { r: 0, t: 10, l: 0, b: 0 }, // Reduce top margin since we have a separate title
        showlegend: true,
        legend: { 
            bgcolor: 'rgba(6, 19, 48, 0.6)',
            bordercolor: 'rgba(63, 92, 158, 0.4)',
            borderwidth: 1,
            font: {
                family: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                size: 12,
                color: 'white'
            }
        },
        hoverlabel: {
            bgcolor: 'rgba(6, 19, 48, 0.9)',
            bordercolor: 'rgba(95, 143, 255, 0.6)',
            font: {
                family: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                color: 'white',
                size: 14
            },
            borderwidth: 1
        }
    };
    
    const config = {
        mapboxAccessToken: 'pk.eyJ1IjoicGxvdGx5bWFwYm94IiwiYSI6ImNrOWJqb2F4djBnMjEzbG50amg0dnJieG4ifQ.Zme1-Uzoi75IaFbieBDl3A',
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot(mapDiv, traces, layout, config);
}

// Render bar chart with Apple-inspired styling
function renderBarChart(data) {
    const barDiv = document.getElementById('bar-chart');
    
    const trace = {
        type: 'bar',
        x: data.categories,
        y: data.counts,
        text: data.counts,
        textposition: 'outside',
        marker: {
            color: data.categories.map(cat => data.color_map[cat]),
            opacity: 0.9,
            line: {
                color: '#ffffff',
                width: 1
            }
        },
        hovertemplate: '<b>%{x}</b><br>Count: %{y}<extra></extra>'
    };
    
    const layout = {
        title: {
            text: 'Top Meteorite Categories',
            font: {
                family: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                size: 18,
                color: 'white'
            }
        },
        plot_bgcolor: 'rgba(4, 11, 28, 0.3)',
        paper_bgcolor: 'rgba(4, 11, 28, 0.3)',
        font: {
            family: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
            color: 'white',
            size: 12
        },
        xaxis: {
            tickangle: -45,
            tickfont: {
                family: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                size: 11
            },
            gridcolor: 'rgba(30, 60, 110, 0.5)',
            linecolor: 'rgba(63, 92, 158, 0.6)'
        },
        yaxis: {
            gridcolor: 'rgba(30, 60, 110, 0.5)',
            linecolor: 'rgba(63, 92, 158, 0.6)'
        },
        margin: { t: 50, b: 120, l: 50, r: 20 },
        bargap: 0.3,
        hoverlabel: {
            bgcolor: 'rgba(6, 19, 48, 0.9)',
            bordercolor: 'rgba(95, 143, 255, 0.6)',
            font: {
                family: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                color: 'white',
                size: 14
            },
            borderwidth: 1
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot(barDiv, [trace], layout, config);
}

// Render heatmap with Apple-inspired styling
function renderHeatmap(data) {
    const heatmapDiv = document.getElementById('composition-heatmap');
    
    const trace = {
        type: 'heatmap',
        z: data.z,
        x: data.x,
        y: data.y,
        colorscale: [
            [0, '#0D1321'],      // Very dark blue (almost black)
            [0.25, '#1D2D44'],    // Dark blue
            [0.50, '#3E5C76'],    // Medium blue
            [0.75, '#748CAB'],    // Light blue
            [1, '#F0EBD8'],    // Cream/off-white
        ],
        hovertemplate: '<b>%{y}</b><br>Element: %{x}<br>Composition: %{z:.2f}%<extra></extra>'
    };
    
    const layout = {
        title: {
            text: data.title,
            font: {
                family: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                size: 20,
                color: 'white'
            }
        },
        paper_bgcolor: 'rgba(4, 11, 28, 0.4)',
        plot_bgcolor: 'rgba(4, 11, 28, 0.2)',
        font: {
            family: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
            color: 'white',
            size: 14
        },
        xaxis: {
            title: 'Chemical Elements',
            titlefont: {
                family: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                size: 16,
                color: 'white'
            },
            gridcolor: 'rgba(30, 60, 110, 0.5)',
            linecolor: 'rgba(63, 92, 158, 0.6)'
        },
        yaxis: {
            title: 'Classification',
            titlefont: {
                family: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                size: 16,
                color: 'white'
            },
            gridcolor: 'rgba(30, 60, 110, 0.5)',
            linecolor: 'rgba(63, 92, 158, 0.6)'
        },
        height: 700,
        margin: { t: 50, b: 80, l: 100, r: 20 },
        hoverlabel: {
            bgcolor: 'rgba(6, 19, 48, 0.9)',
            bordercolor: 'rgba(95, 143, 255, 0.6)',
            font: {
                family: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                color: 'white',
                size: 14
            },
            borderwidth: 1
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot(heatmapDiv, [trace], layout, config);
}

// Initialize the app with smooth loading
window.addEventListener('DOMContentLoaded', () => {
    // Show initial loading state
    document.body.classList.add('loading');
    
    // Set initial background for slider
    yearSlider.style.backgroundImage = 'linear-gradient(to right, var(--cosmic-highlight) 0%, rgba(30, 60, 110, 0.5) 0%)';
    
    // Apply smooth transitions to content
    animationContent.style.transition = 'opacity 0.2s ease-in-out';
    heatmapContent.style.transition = 'opacity 0.2s ease-in-out';
    
    // Initialize the first tab
    updateMap().then(() => {
        document.body.classList.remove('loading');
        animationContent.style.opacity = '1';
    });
    
    // Add loading spinner styles
    const style = document.createElement('style');
    style.textContent = `
        .loading-spinner {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            margin: -20px 0 0 -20px;
            border: 3px solid rgba(95, 143, 255, 0.2);
            border-radius: 50%;
            border-top-color: var(--cosmic-highlight);
            animation: spin 1s ease-in-out infinite;
            z-index: 10;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        #map.loading, #bar-chart.loading, #composition-heatmap.loading {
            position: relative;
        }
        
        body.loading:after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(4, 11, 28, 0.8);
            z-index: 1000;
        }
    `;
    document.head.appendChild(style);
}); 