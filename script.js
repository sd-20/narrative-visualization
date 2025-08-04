// Narrative Visualization Parameters (State Variables)
let currentScene = 0;
let titanicData = [];
let filteredData = [];
let selectedClass = 'all';
let selectedGender = 'all';

// Visualization dimensions and margins
const margin = { top: 60, right: 80, bottom: 80, left: 80 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Color schemes
const survivalColors = { 0: '#e74c3c', 1: '#27ae60' };
const classColors = { 1: '#3498db', 2: '#f39c12', 3: '#9b59b6' };
const genderColors = { 'male': '#3498db', 'female': '#e91e63' };

// Scene configurations
const scenes = [
    {
        title: "The Tragedy Unfolds",
        description: "On April 15, 1912, the RMS Titanic sank in the North Atlantic. Of the 1310 passengers aboard, only 710 survived. Let's explore the survival patterns of the passengers.",
        type: "overview"
    },
    {
        title: "Class Matters: The Stark Reality",
        description: "Passenger class played a crucial role in survival. First-class passengers had significantly higher survival rates than those in second and third class.",
        type: "class_analysis"
    },
    {
        title: "Women and Children First",
        description: "The maritime tradition of 'women and children first' is clearly visible in the Titanic data. Gender and age were critical factors in determining who survived.",
        type: "demographic_analysis"
    }
];

// Initialize the visualization
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
});

// Load and parse the Titanic data
async function loadData() {
    try {
        // Load the titanic3 dataset
        titanicData = await d3.csv('titanic3.csv', function(d) {
            // Parse and clean the data - mapping new column names
            return {
                PassengerId: d.name ? d.name.split(',')[0] : 'Unknown', // Use name as identifier if no PassengerId
                Survived: +d.survived, // Convert to number (0 or 1)
                Pclass: +d.pclass, // Convert to number (1, 2, or 3)
                Name: d.name || 'Unknown',
                Sex: d.sex ? d.sex.toLowerCase() : 'unknown', // Normalize to lowercase
                Age: d.age ? +d.age : null, // Convert to number, handle missing values
                SibSp: d.sibsp ? +d.sibsp : 0,
                Parch: d.parch ? +d.parch : 0,
                Ticket: d.ticket || 'Unknown',
                Fare: d.fare ? +d.fare : null // Convert to number, handle missing values
            };
        });
        
        // Filter out rows with missing critical data (but keep age-missing for overview)
        titanicData = titanicData.filter(d => 
            d.Survived !== null && 
            d.Pclass !== null && 
            d.Sex
        );
        
        filteredData = [...titanicData];
        
        console.log(`Loaded ${titanicData.length} passenger records from Titanic dataset`);
        
        // Initialize the first scene
        updateScene();
    } catch (error) {
        console.error('Error loading Titanic data:', error);
        // Fallback message for users
        alert('Error loading Titanic dataset. Please make sure titanic3.csv is in the same directory as this HTML file.');
    }
}

// Setup event listeners for navigation and interactions
function setupEventListeners() {
    // Navigation buttons
    document.getElementById('prev-btn').addEventListener('click', () => {
        if (currentScene > 0) {
            currentScene--;
            updateScene();
        }
    });
    
    document.getElementById('next-btn').addEventListener('click', () => {
        if (currentScene < scenes.length - 1) {
            currentScene++;
            updateScene();
        }
    });
    
    // Scene dots
    document.querySelectorAll('.scene-dot').forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentScene = index;
            updateScene();
        });
    });
}

// Main function to update the current scene
function updateScene() {
    updateNavigation();
    updateSceneContent();
    
    // Clear previous visualization
    d3.select('#visualization').selectAll('*').remove();
    d3.select('#annotations').selectAll('*').remove();
    d3.select('#scene-controls').selectAll('*').remove();
    
    // Render the appropriate scene
    switch (currentScene) {
        case 0:
            renderOverviewScene();
            break;
        case 1:
            renderClassAnalysisScene();
            break;
        case 2:
            renderDemographicAnalysisScene();
            break;
    }
    
    // Add fade-in animation
    d3.select('#visualization').classed('fade-in', true);
}

// Update navigation state
function updateNavigation() {
    document.getElementById('prev-btn').disabled = currentScene === 0;
    document.getElementById('next-btn').disabled = currentScene === scenes.length - 1;
    
    document.querySelectorAll('.scene-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentScene);
    });
}

// Update scene title and description
function updateSceneContent() {
    const scene = scenes[currentScene];
    document.getElementById('scene-title').textContent = scene.title;
    document.getElementById('scene-description').textContent = scene.description;
}

// Scene 1: Overview - Survival Rate Pie Chart
function renderOverviewScene() {
    const svg = d3.select('#visualization')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
    
    const g = svg.append('g')
        .attr('transform', `translate(${(width + margin.left + margin.right) / 2}, ${(height + margin.top + margin.bottom) / 2})`);
    
    // Calculate survival statistics
    const survived = titanicData.filter(d => d.Survived === 1).length;
    const died = titanicData.filter(d => d.Survived === 0).length;
    const total = titanicData.length;
    
    const pieData = [
        { label: 'Survived', value: survived, color: survivalColors[1] },
        { label: 'Did not survive', value: died, color: survivalColors[0] }
    ];
    
    const radius = Math.min(width, height) / 3;
    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    
    // Create pie slices
    const slices = g.selectAll('.slice')
        .data(pie(pieData))
        .enter()
        .append('g')
        .attr('class', 'slice');
    
    slices.append('path')
        .attr('d', arc)
        .attr('fill', d => d.data.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            showTooltip(event, `${d.data.label}: ${d.data.value} passengers (${(d.data.value/total*100).toFixed(1)}%)`);
            d3.select(this).style('opacity', 0.8);
        })
        .on('mouseout', function() {
            hideTooltip();
            d3.select(this).style('opacity', 1);
        });
    
    // Add labels
    slices.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', 'white')
        .text(d => `${(d.data.value/total*100).toFixed(1)}%`);
    
    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width + margin.left - 150}, ${margin.top})`);
    
    pieData.forEach((d, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);
        
        legendRow.append('rect')
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', d.color);
        
        legendRow.append('text')
            .attr('x', 25)
            .attr('y', 14)
            .attr('font-size', '14px')
            .text(`${d.label} (${d.value})`);
    });
    
    // Add annotations
    addAnnotations([
        {
            note: { 
                label: `Only ${(survived/total*100).toFixed(1)}% of passengers survived`,
                title: "Low Survival Rate"
            },
            x: width/2 + 100,
            y: height/2 - 50,
            dx: 50,
            dy: -30
        }
    ]);
}

// Scene 2: Class Analysis - Bar Chart
function renderClassAnalysisScene() {
    // Use much larger height and margins to accommodate responsive annotations
    const sceneMargin = { top: 200, right: 150, bottom: 80, left: 80 }; // Increased right margin for legend
    const sceneHeight = 700 - sceneMargin.top - sceneMargin.bottom; // Increased total height
    
    const svg = d3.select('#visualization')
        .append('svg')
        .attr('width', width + sceneMargin.left + sceneMargin.right)
        .attr('height', sceneHeight + sceneMargin.top + sceneMargin.bottom);
    
    const g = svg.append('g')
        .attr('transform', `translate(${sceneMargin.left}, ${sceneMargin.top})`);
    
    // Filter data by selected gender if applicable
    const filteredTitanicData = selectedGender === 'all' 
        ? titanicData 
        : titanicData.filter(d => d.Sex === selectedGender);
    
    // Calculate survival by class with gender filter applied
    const classData = [1, 2, 3].map(pclass => {
        const classPassengers = filteredTitanicData.filter(d => d.Pclass === pclass);
        const survived = classPassengers.filter(d => d.Survived === 1).length;
        const total = classPassengers.length;
        return {
            class: pclass,
            survived: survived,
            died: total - survived,
            total: total,
            survivalRate: survived / total
        };
    });
    
    // Create scales
    const x = d3.scaleBand()
        .domain(classData.map(d => `Class ${d.class}`))
        .range([0, width])
        .padding(0.3);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(classData, d => d.total)])
        .range([sceneHeight, 0]);
    
    // Create stacked data
    const stackedData = classData.map(d => [
        { class: d.class, type: 'died', value: d.died, color: survivalColors[0] },
        { class: d.class, type: 'survived', value: d.survived, color: survivalColors[1] }
    ]);
    
    // Draw bars
    classData.forEach((d, i) => {
        let yPos = sceneHeight;
        
        // Died portion
        g.append('rect')
            .attr('x', x(`Class ${d.class}`))
            .attr('y', y(d.died))
            .attr('width', x.bandwidth())
            .attr('height', sceneHeight - y(d.died))
            .attr('fill', survivalColors[0])
            .attr('class', 'bar')
            .on('mouseover', function(event) {
                showTooltip(event, `Class ${d.class} - Did not survive: ${d.died} passengers`);
            })
            .on('mouseout', hideTooltip);
        
        // Survived portion
        g.append('rect')
            .attr('x', x(`Class ${d.class}`))
            .attr('y', y(d.total))
            .attr('width', x.bandwidth())
            .attr('height', y(d.died) - y(d.total))
            .attr('fill', survivalColors[1])
            .attr('class', 'bar')
            .on('mouseover', function(event) {
                showTooltip(event, `Class ${d.class} - Survived: ${d.survived} passengers (${(d.survivalRate*100).toFixed(1)}%)`);
            })
            .on('mouseout', hideTooltip);
        
        // Add survival rate labels with better positioning and styling to avoid overlaps
        const labelY = y(d.total) - 30; // More space above the bar to avoid overlap
        const labelX = x(`Class ${d.class}`) + x.bandwidth()/2;
        
        // Add background rectangle for label
        g.append('rect')
            .attr('x', labelX - 30)
            .attr('y', labelY - 15)
            .attr('width', 60)
            .attr('height', 25)
            .attr('fill', 'white')
            .attr('stroke', '#2a5298')
            .attr('stroke-width', 2)
            .attr('rx', 5)
            .attr('opacity', 0.95);
        
        g.append('text')
            .attr('x', labelX)
            .attr('y', labelY - 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .attr('fill', '#1e3c72')
            .text(`${(d.survivalRate*100).toFixed(1)}%`);
    });
    
    // Add axes
    g.append('g')
        .attr('transform', `translate(0, ${sceneHeight})`)
        .call(d3.axisBottom(x))
        .attr('class', 'axis');
    
    g.append('g')
        .call(d3.axisLeft(y))
        .attr('class', 'axis');
    
    // Add axis labels
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - sceneMargin.left)
        .attr('x', 0 - (sceneHeight / 2))
        .attr('dy', '1em')
        .attr('class', 'axis-label')
        .text('Number of Passengers');
    
    g.append('text')
        .attr('transform', `translate(${width / 2}, ${sceneHeight + sceneMargin.bottom - 10})`)
        .attr('class', 'axis-label')
        .text('Passenger Class');
    
    // Add legend positioned to slightly overlap the right side but still allow hover
    const legend = svg.append('g')
        .attr('transform', `translate(${width + sceneMargin.left - 60}, ${sceneMargin.top + 50})`);
    
    // Add legend background for better visibility
    const legendBg = legend.append('rect')
        .attr('x', -10)
        .attr('y', -5)
        .attr('width', 190) // Increased width to fit "Did not survive" text
        .attr('height', 60)
        .attr('fill', 'white')
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1)
        .attr('rx', 5)
        .attr('opacity', 0.9)
        .style('pointer-events', 'none'); // Allow clicks to pass through
    
    [{ label: 'Survived', color: survivalColors[1] }, 
     { label: 'Did not survive', color: survivalColors[0] }].forEach((d, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`)
            .style('pointer-events', 'none'); // Allow clicks to pass through
        
        legendRow.append('rect')
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', d.color)
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
        
        legendRow.append('text')
            .attr('x', 25)
            .attr('y', 14)
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .attr('fill', '#333')
            .text(d.label);
    });
    
    // Add responsive annotations attached directly to the top of percentage containers
    const class1LabelY = y(classData[0].total) - 30; // Position of percentage label text
    const class3LabelY = y(classData[2].total) - 30; // Position of percentage label text
    const class1ContainerTop = class1LabelY - 15; // Top of the percentage label container
    const class3ContainerTop = class3LabelY - 15; // Top of the percentage label container
    
    // Calculate bar center positions
    const class1BarCenter = x('Class 1') + x.bandwidth()/2 + sceneMargin.left;
    const class3BarCenter = x('Class 3') + x.bandwidth()/2 + sceneMargin.left;
    
    addAnnotations([
        {
            note: { 
                label: "First class had the highest survival rate at 61.9%",
                title: "Class Privilege",
                wrap: 120
            },
            x: class1BarCenter, // Center above the bar
            y: sceneMargin.top + class1ContainerTop, // Attach to top of percentage container
            dx: 0, // No horizontal offset
            dy: -5 // Small offset above the container
        },
        {
            note: { 
                label: "Third class had the lowest survival rate at 25.5%",
                title: "Limited Access",
                wrap: 120
            },
            x: class3BarCenter, // Center above the bar
            y: sceneMargin.top + class3ContainerTop, // Attach to top of percentage container
            dx: 0, // No horizontal offset
            dy: -5 // Small offset above the container
        }
    ]);
    
    // Add interactive controls
    addClassControls();
}

// Scene 3: Demographic Analysis - Grouped Bar Chart
function renderDemographicAnalysisScene() {
    const sceneMargin = { top: 250, right: 150, bottom: 100, left: 150 }; // Increased top margin for annotations
    const sceneHeight = 750 - sceneMargin.top - sceneMargin.bottom;
    const sceneWidth = width + sceneMargin.left + sceneMargin.right; // Use consistent width calculation
    
    const svg = d3.select('#visualization')
        .append('svg')
        .attr('width', sceneWidth)
        .attr('height', sceneHeight + sceneMargin.top + sceneMargin.bottom)
        .style('display', 'block')
        .style('margin', '0 auto'); // Center the SVG horizontally
    
    const g = svg.append('g')
        .attr('transform', `translate(${sceneMargin.left}, ${sceneMargin.top})`);
    
    // Define age groups
    const isChild = d => d.Age < 16; // Under 16 is considered a child
    
    // Process data for visualization
    // Create groups: Female Children, Female Adults, Male Children, Male Adults
    const demographicGroups = [
        { id: 'fc', label: 'Female\nChildren', gender: 'female', ageGroup: 'child' },
        { id: 'fa', label: 'Female\nAdults', gender: 'female', ageGroup: 'adult' },
        { id: 'mc', label: 'Male\nChildren', gender: 'male', ageGroup: 'child' },
        { id: 'ma', label: 'Male\nAdults', gender: 'male', ageGroup: 'adult' }
    ];
    
    // Calculate survival statistics for each demographic group (only passengers with age data)
    const demographicData = demographicGroups.map(group => {
        const filtered = titanicData.filter(d => {
            const hasAge = d.Age !== null; // Only include passengers with age data
            const matchesGender = d.Sex === group.gender;
            const matchesAge = (group.ageGroup === 'child') ? isChild(d) : !isChild(d);
            return hasAge && matchesGender && matchesAge;
        });
        
        const survived = filtered.filter(d => d.Survived === 1).length;
        const total = filtered.length;
        
        return {
            ...group,
            survived: survived,
            died: total - survived,
            total: total,
            survivalRate: survived / total
        };
    });
    
    // Calculate the maximum values across ALL possible filter combinations to ensure fixed y-axis
    // This will check all classes (1, 2, 3) and find the maximum bar height
    let globalMaxValue = 0;
    for (let classNum of [1, 2, 3]) {
        const classFilteredData = titanicData.filter(d => d.Pclass === classNum);
        const classDemographicData = demographicGroups.map(group => {
            const filtered = classFilteredData.filter(d => {
                const matchesGender = d.Sex === group.gender;
                const matchesAge = (group.ageGroup === 'child') ? isChild(d) : !isChild(d);
                return matchesGender && matchesAge;
            });
            const survived = filtered.filter(d => d.Survived === 1).length;
            const total = filtered.length;
            return {
                survived: survived,
                died: total - survived
            };
        });
        const classMaxValue = d3.max(classDemographicData, d => Math.max(d.survived, d.died));
        globalMaxValue = Math.max(globalMaxValue, classMaxValue);
    }
    
    // Also check the "all classes" maximum
    const allClassesMaxValue = d3.max(demographicData, d => Math.max(d.survived, d.died));
    globalMaxValue = Math.max(globalMaxValue, allClassesMaxValue);
    
    // Add some padding to the maximum for better visualization
    globalMaxValue = Math.ceil(globalMaxValue * 1.1);
    
    // Create scales using the standard width for proper centering
    const x0 = d3.scaleBand()
        .domain(demographicData.map(d => d.label))
        .range([0, width])
        .padding(0.2);
    
    const x1 = d3.scaleBand()
        .domain(['Survived', 'Died'])
        .range([0, x0.bandwidth()])
        .padding(0.05);
    
    // Use the global maximum value for y-scale to keep it fixed
    const y = d3.scaleLinear()
        .domain([0, globalMaxValue])
        .range([sceneHeight, 0])
        .nice();
    
    // Store the fixed y-scale as a data attribute on the SVG for use in filter updates
    svg.node().fixedYScale = y;
        
    // Add bar groups
    const barGroups = g.selectAll('.bar-group')
        .data(demographicData)
        .enter()
        .append('g')
        .attr('class', 'bar-group')
        .attr('transform', d => `translate(${x0(d.label)}, 0)`);
        
    // Add bars for survived
    barGroups.append('rect')
        .attr('class', 'bar survived')
        .attr('x', x1('Survived'))
        .attr('y', d => y(d.survived))
        .attr('width', x1.bandwidth())
        .attr('height', d => sceneHeight - y(d.survived))
        .attr('fill', survivalColors[1])
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .attr('rx', 3)
        .on('mouseover', function(event, d) {
            showTooltip(event, `${d.label.replace('\n', ' ')}: ${d.survived} survived (${(d.survivalRate*100).toFixed(1)}%)`);
            d3.select(this).attr('opacity', 0.8);
        })
        .on('mouseout', function() {
            hideTooltip();
            d3.select(this).attr('opacity', 1);
        });
        
    // Add bars for died
    barGroups.append('rect')
        .attr('class', 'bar died')
        .attr('x', x1('Died'))
        .attr('y', d => y(d.died))
        .attr('width', x1.bandwidth())
        .attr('height', d => sceneHeight - y(d.died))
        .attr('fill', survivalColors[0])
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .attr('rx', 3)
        .on('mouseover', function(event, d) {
            showTooltip(event, `${d.label.replace('\n', ' ')}: ${d.died} did not survive`);
            d3.select(this).attr('opacity', 0.8);
        })
        .on('mouseout', function() {
            hideTooltip();
            d3.select(this).attr('opacity', 1);
        });
        
    // Add survival rate labels positioned above the green (survived) bars
    barGroups.append('text')
        .attr('class', 'survival-rate')
        .attr('x', x1('Survived') + x1.bandwidth() / 2) // Center above the survived bar
        .attr('y', d => y(d.survived) - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#1e3c72')
        .text(d => `${(d.survivalRate*100).toFixed(1)}%`);
        
    // Add death rate labels positioned above the red (died) bars
    barGroups.append('text')
        .attr('class', 'death-rate')
        .attr('x', x1('Died') + x1.bandwidth() / 2) // Center above the died bar
        .attr('y', d => y(d.died) - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#1e3c72')
        .text(d => d.total > 0 ? `${((1 - d.survivalRate)*100).toFixed(1)}%` : '0%');
        
    // Add axes
    g.append('g')
        .attr('transform', `translate(0, ${sceneHeight})`)
        .call(d3.axisBottom(x0))
        .call(g => g.selectAll('.domain, .tick line').attr('stroke', '#333'))
        .attr('class', 'axis x-axis');
    
    g.append('g')
        .call(d3.axisLeft(y).tickFormat(d => d))
        .call(g => g.selectAll('.domain, .tick line').attr('stroke', '#333'))
        .attr('class', 'axis y-axis');
    
    // Add axis label
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - sceneMargin.left + 20)
        .attr('x', 0 - (sceneHeight / 2))
        .attr('dy', '1em')
        .attr('text-anchor', 'middle')
        .attr('class', 'axis-label')
        .text('Number of Passengers');
    
    // Add legend  
    const sceneContentWidth = width;
    const legendGroup = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${sceneContentWidth + sceneMargin.left - 40}, ${sceneMargin.top - 50})`);
    
    // Add legend background
    legendGroup.append('rect')
        .attr('x', -10)
        .attr('y', -10)
        .attr('width', 140)
        .attr('height', 75)
        .attr('fill', 'white')
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1)
        .attr('rx', 5);
    
    const legendItems = [
        { label: 'Survived', color: survivalColors[1] },
        { label: 'Did not survive', color: survivalColors[0] }
    ];
    
    legendItems.forEach((item, i) => {
        const legendRow = legendGroup.append('g')
            .attr('transform', `translate(0, ${i * 25})`);
        
        legendRow.append('rect')
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', item.color)
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
        
        legendRow.append('text')
            .attr('x', 25)
            .attr('y', 14)
            .attr('font-size', '14px')
            .text(item.label);
    });
    
    
    // Add vertical line annotations instead of traditional annotations
    addVerticalLineAnnotations(svg, g, [
        {
            label: "Women had much higher survival rates than men",
            title: "Gender Difference",
            barGroup: 'Female\nAdults',
            position: 'left'
        },
        {
            label: `Children had priority over adults of the same gender`,
            title: "Children First", 
            barGroup: 'Male\nChildren',
            position: 'center'
        },
        {
            label: `Female children had the highest survival rate at ${(demographicData[0].survivalRate*100).toFixed(1)}%`,
            title: "Highest Priority",
            barGroup: 'Female\nChildren',
            position: 'right'
        }
    ], x0, sceneMargin, sceneHeight);
    
    // Add interactive controls
    addDemographicControls();
}

// Add annotations to the current scene
function addAnnotations(annotations) {
    const svg = d3.select('#visualization svg');
    const makeAnnotations = d3.annotation()
        .annotations(annotations);
    
    svg.append('g')
        .attr('class', 'annotation-group')
        .call(makeAnnotations);
}

// Add vertical line annotations for demographic scene
function addVerticalLineAnnotations(svg, chartGroup, annotations, x0Scale, margin, chartHeight) {
    const annotationGroup = svg.append('g')
        .attr('class', 'vertical-annotation-group');
    
    // Pre-calculate positions to ensure no overlaps and better spacing
    const textWidth = 120; // Smaller width to ensure it fits
    const textHeight = 65; // Compact height
    const svgWidth = parseInt(svg.attr('width'));
    
    annotations.forEach((annotation, i) => {
        const barX = x0Scale(annotation.barGroup) + x0Scale.bandwidth() / 2 + margin.left;
        
        // Position annotations extremely close to their corresponding bars
        const baseOffset = 5; // Extremely close to chart
        const verticalOffset = margin.top - baseOffset - (i * 25); // Even tighter staggering
        const annotationY = Math.max(verticalOffset, 5); // Allow annotations very close to top edge
        
        // Position text box directly above the corresponding bar group
        let textX = barX; // Center directly above bar
        
        // Only adjust if annotation would go completely off-screen
        if (textX - textWidth/2 < 20) {
            textX = textWidth/2 + 20;
        }
        if (textX + textWidth/2 > svgWidth - 20) {
            textX = svgWidth - textWidth/2 - 20;
        }
        
        // Create truly vertical line from chart to annotation - ensure all lines are visible
        annotationGroup.append('line')
            .attr('x1', barX) // Bar center x-coordinate
            .attr('y1', margin.top - 2) // Just above chart
            .attr('x2', barX) // Same x-coordinate (truly vertical)
            .attr('y2', annotationY + textHeight + 3) // Bottom of annotation box
            .attr('stroke', '#333') // Darker color for better visibility
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,4') // More visible dash pattern
            .attr('opacity', 1); // Full opacity to ensure visibility
        
        // Create compact text background box
        annotationGroup.append('rect')
            .attr('x', textX - textWidth/2)
            .attr('y', annotationY)
            .attr('width', textWidth)
            .attr('height', textHeight)
            .attr('fill', 'white')
            .attr('stroke', '#2a5298')
            .attr('stroke-width', 2)
            .attr('rx', 6)
            .attr('opacity', 0.95)
            .style('filter', 'drop-shadow(1px 1px 3px rgba(0,0,0,0.1))');
        
        // Add title text
        annotationGroup.append('text')
            .attr('x', textX)
            .attr('y', annotationY + 16)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('font-weight', 'bold')
            .attr('fill', '#1e3c72')
            .text(annotation.title);
        
        // Simplified text handling with better abbreviations
        let displayText = annotation.label;
        
        // Specific abbreviations for better fit
        displayText = displayText.replace('survival rates', 'survival');
        displayText = displayText.replace('priority over adults', 'priority');
        displayText = displayText.replace('of the same gender', '');
        displayText = displayText.replace('had much higher', 'had higher');
        
        // Split into words and create lines
        const words = displayText.trim().split(' ');
        const lineHeight = 11;
        const maxWordsPerLine = 3; // Fewer words per line
        const maxLines = 3; // Limit to 3 lines
        
        let lineNumber = 0;
        for (let j = 0; j < words.length && lineNumber < maxLines; j += maxWordsPerLine) {
            const lineWords = words.slice(j, j + maxWordsPerLine);
            const lineText = lineWords.join(' ');
            
            annotationGroup.append('text')
                .attr('x', textX)
                .attr('y', annotationY + 30 + (lineNumber * lineHeight))
                .attr('text-anchor', 'middle')
                .attr('font-size', '9px')
                .attr('fill', '#333')
                .text(lineText);
            
            lineNumber++;
        }
    });
}

// Add interactive controls for class analysis scene
function addClassControls() {
    const controls = d3.select('#scene-controls');
    
    const controlGroup = controls.append('div')
        .attr('class', 'control-group');
    
    controlGroup.append('label')
        .text('Filter by Gender: ');
    
    const genderSelect = controlGroup.append('select')
        .attr('id', 'gender-filter')
        .on('change', function() {
            selectedGender = this.value;
            updateClassAnalysisData();
        });
    
    genderSelect.selectAll('option')
        .data(['all', 'male', 'female'])
        .enter()
        .append('option')
        .attr('value', d => d)
        .text(d => d === 'all' ? 'All Genders' : d.charAt(0).toUpperCase() + d.slice(1))
        .property('selected', d => d === selectedGender);
}

// Add interactive controls for demographic analysis scene
function addDemographicControls() {
    const controlsContainer = document.getElementById('scene-controls');
    
    // Create control group div
    const controlGroup = document.createElement('div');
    controlGroup.className = 'control-group';
    controlGroup.style.marginTop = '20px';
    controlGroup.style.textAlign = 'center';
    
    // Create label
    const label = document.createElement('label');
    label.textContent = 'Filter by Class: ';
    label.style.fontWeight = 'bold';
    label.style.marginRight = '10px';
    label.style.fontSize = '16px';
    controlGroup.appendChild(label);
    
    // Create select element using standard JavaScript
    const classSelect = document.createElement('select');
    classSelect.id = 'class-filter';
    classSelect.style.padding = '8px 12px';
    classSelect.style.border = '2px solid #2a5298';
    classSelect.style.borderRadius = '5px';
    classSelect.style.fontSize = '16px';
    classSelect.style.background = 'white';
    classSelect.style.cursor = 'pointer';
    classSelect.style.minWidth = '150px';
    classSelect.style.outline = 'none';
    classSelect.style.appearance = 'menulist'; // Ensure native dropdown appearance
    classSelect.style.webkitAppearance = 'menulist'; // For webkit browsers
    classSelect.style.mozAppearance = 'menulist'; // For Firefox
    classSelect.tabIndex = 0; // Make sure it's focusable
    
    // Create options
    const options = [
        { value: 'all', text: 'All Classes' },
        { value: '1', text: 'Class 1' },
        { value: '2', text: 'Class 2' },
        { value: '3', text: 'Class 3' }
    ];
    
    options.forEach(optionData => {
        const option = document.createElement('option');
        option.value = optionData.value;
        option.textContent = optionData.text;
        if (optionData.value === 'all') {
            option.selected = true;
        }
        classSelect.appendChild(option);
    });
    
    // Add multiple event listeners to ensure functionality
    classSelect.addEventListener('change', function(event) {
        const selectedValue = this.value;
        console.log('Class filter changed to:', selectedValue);
        highlightClass(selectedValue);
    });
    
    classSelect.addEventListener('click', function(event) {
        console.log('Select clicked');
        event.stopPropagation();
    });
    
    classSelect.addEventListener('focus', function(event) {
        console.log('Select focused');
    });
    
    // Append elements to the DOM
    controlGroup.appendChild(classSelect);
    controlsContainer.appendChild(controlGroup);
}

// Filter demographic data by class - Updated to properly filter and show ONLY class data
function highlightClass(classValue) {
    console.log(`Filtering to class: ${classValue}`);
    
    const svg = d3.select('#visualization svg');
    const g = svg.select('g');
    const sceneMargin = { top: 250, right: 150, bottom: 100, left: 150 }; // Match the original scene margins
    const sceneHeight = 750 - sceneMargin.top - sceneMargin.bottom;
    
    // Define age groups and demographic groups
    const isChild = d => d.Age < 16;
    const demographicGroups = [
        { id: 'fc', label: 'Female\nChildren', gender: 'female', ageGroup: 'child' },
        { id: 'fa', label: 'Female\nAdults', gender: 'female', ageGroup: 'adult' },
        { id: 'mc', label: 'Male\nChildren', gender: 'male', ageGroup: 'child' },
        { id: 'ma', label: 'Male\nAdults', gender: 'male', ageGroup: 'adult' }
    ];
    
    // Filter data based on class selection
    let dataToUse = titanicData;
    if (classValue !== 'all') {
        dataToUse = titanicData.filter(d => d.Pclass === Number(classValue));
        console.log(`Filtering for class ${classValue}: ${dataToUse.length} passengers`);
    }
    
    // Calculate updated demographic data using ONLY the filtered class data (with age data)
    const updatedDemographicData = demographicGroups.map(group => {
        const filtered = dataToUse.filter(d => {
            const hasAge = d.Age !== null; // Only include passengers with age data
            const matchesGender = d.Sex === group.gender;
            const matchesAge = (group.ageGroup === 'child') ? isChild(d) : !isChild(d);
            return hasAge && matchesGender && matchesAge;
        });
        
        const survived = filtered.filter(d => d.Survived === 1).length;
        const total = filtered.length;
        
        return {
            ...group,
            survived: survived,
            died: total - survived,
            total: total,
            survivalRate: total > 0 ? survived / total : 0
        };
    });
    
    console.log('Updated demographic data:', updatedDemographicData.map(d => ({
        label: d.label,
        survived: d.survived,
        died: d.died,
        total: d.total,
        rate: `${(d.survivalRate*100).toFixed(1)}%`
    })));
    
    // Use scales that remain consistent
    const x0 = d3.scaleBand()
        .domain(demographicGroups.map(d => d.label))
        .range([0, width])
        .padding(0.2);
    
    const x1 = d3.scaleBand()
        .domain(['Survived', 'Died'])
        .range([0, x0.bandwidth()])
        .padding(0.05);
    
    // Use the fixed y-scale that was stored when the scene was first rendered
    const y = svg.node().fixedYScale;
    
    // Update each bar group individually with its corresponding data
    const barGroups = g.selectAll('.bar-group')
        .data(updatedDemographicData);
    
    // Update survived bars instantly - bind data correctly to each bar group
    barGroups.select('.bar.survived')
        .attr('y', d => {
            const newY = y(d.survived);
            console.log(`Survived bar for ${d.label}: y=${newY}, height=${sceneHeight - newY}, survived=${d.survived}`);
            return newY;
        })
        .attr('height', d => Math.max(0, sceneHeight - y(d.survived)));
    
    // Update died bars instantly - bind data correctly to each bar group
    barGroups.select('.bar.died')
        .attr('y', d => {
            const newY = y(d.died);
            console.log(`Died bar for ${d.label}: y=${newY}, height=${sceneHeight - newY}, died=${d.died}`);
            return newY;
        })
        .attr('height', d => Math.max(0, sceneHeight - y(d.died)));
    
    // Update survival rate labels instantly - positioned above survived bars
    barGroups.select('.survival-rate')
        .attr('x', x1('Survived') + x1.bandwidth() / 2) // Center above the survived bar
        .attr('y', d => {
            const survivedBarTop = y(d.survived);
            const labelY = Math.max(survivedBarTop - 10, 15); // Ensure labels stay within bounds
            return labelY;
        })
        .text(d => d.total > 0 ? `${(d.survivalRate*100).toFixed(1)}%` : '0%')
        .attr('opacity', d => d.total > 0 ? 1 : 0.5); // Fade out labels for zero data
    
    // Update death rate labels instantly - positioned above died bars
    barGroups.select('.death-rate')
        .attr('x', x1('Died') + x1.bandwidth() / 2) // Center above the died bar
        .attr('y', d => {
            const diedBarTop = y(d.died);
            const labelY = Math.max(diedBarTop - 10, 15); // Ensure labels stay within bounds
            return labelY;
        })
        .text(d => d.total > 0 ? `${((1 - d.survivalRate)*100).toFixed(1)}%` : '0%')
        .attr('opacity', d => d.total > 0 ? 1 : 0.5); // Fade out labels for zero data
    
    // Update tooltips with new data - rebind event handlers
    barGroups.select('.bar.survived').on('mouseover', function(event, d) {
        const tooltipText = classValue === 'all' 
            ? `${d.label.replace('\n', ' ')}: ${d.survived} survived (${(d.survivalRate*100).toFixed(1)}%)`
            : `Class ${classValue} ${d.label.replace('\n', ' ')}: ${d.survived} survived (${(d.survivalRate*100).toFixed(1)}%)`;
        showTooltip(event, tooltipText);
        d3.select(this).attr('opacity', 0.8);
    })
    .on('mouseout', function() {
        hideTooltip();
        d3.select(this).attr('opacity', 1);
    });
        
    barGroups.select('.bar.died').on('mouseover', function(event, d) {
        const tooltipText = classValue === 'all'
            ? `${d.label.replace('\n', ' ')}: ${d.died} did not survive`
            : `Class ${classValue} ${d.label.replace('\n', ' ')}: ${d.died} did not survive`;
        showTooltip(event, tooltipText);
        d3.select(this).attr('opacity', 0.8);
    })
    .on('mouseout', function() {
        hideTooltip();
        d3.select(this).attr('opacity', 1);
    });
    
    // Remove existing class indicators and annotations
    svg.selectAll('.class-indicator').remove();
    svg.selectAll('.annotation-group').remove();
    svg.selectAll('.vertical-annotation-group').remove();
    
    // Re-add vertical line annotations with updated values
    addVerticalLineAnnotations(svg, g, [
        {
            label: "Women had much higher survival rates than men",
            title: "Gender Difference",
            barGroup: 'Female\nAdults',
            position: 'left'
        },
        {
            label: `Children had priority over adults of the same gender`,
            title: "Children First", 
            barGroup: 'Male\nChildren',
            position: 'center'
        },
        {
            label: `Female children had the highest survival rate at ${(updatedDemographicData[0].survivalRate*100).toFixed(1)}%`,
            title: "Highest Priority",
            barGroup: 'Female\nChildren',
            position: 'right'
        }
    ], x0, sceneMargin, sceneHeight);
    
    // Add class indicator if filtering by class
    if (classValue !== 'all') {
        const indicatorGroup = svg.append('g')
            .attr('class', 'class-indicator');
        
        // Add background rectangle
        indicatorGroup.append('rect')
            .attr('x', width / 2 + sceneMargin.left - 180)
            .attr('y', 10)
            .attr('width', 360)
            .attr('height', 60)
            .attr('fill', 'white')
            .attr('stroke', classColors[classValue])
            .attr('stroke-width', 3)
            .attr('rx', 10)
            .attr('opacity', 0.95);
        
        // Add title
        indicatorGroup.append('text')
            .attr('x', width / 2 + sceneMargin.left)
            .attr('y', 32)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .attr('fill', classColors[classValue])
            .text(`Showing Class ${classValue} Passengers Only`);
        
        // Add statistics - ensure they match the demographic breakdown
        const totalClassPassengers = dataToUse.length;
        const survivedClassPassengers = dataToUse.filter(d => d.Survived === 1).length;
        const classStatText = `${totalClassPassengers} passengers total • ${survivedClassPassengers} survived (${((survivedClassPassengers/totalClassPassengers)*100).toFixed(1)}%)`;
        
        indicatorGroup.append('text')
            .attr('x', width / 2 + sceneMargin.left)
            .attr('y', 52)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('fill', '#666')
            .text(classStatText);
    }
}

// Update only the data in Class Analysis scene without rebuilding the entire scene
function updateClassAnalysisData() {
    // Filter data by selected gender
    const filteredTitanicData = selectedGender === 'all' 
        ? titanicData 
        : titanicData.filter(d => d.Sex === selectedGender);
    
    // Calculate survival by class with gender filter applied
    const classData = [1, 2, 3].map(pclass => {
        const classPassengers = filteredTitanicData.filter(d => d.Pclass === pclass);
        const survived = classPassengers.filter(d => d.Survived === 1).length;
        const total = classPassengers.length;
        return {
            class: pclass,
            survived: survived,
            died: total - survived,
            total: total,
            survivalRate: survived / total
        };
    });
    
    const svg = d3.select('#visualization svg');
    const sceneMargin = { top: 200, right: 80, bottom: 80, left: 80 };
    const sceneHeight = 700 - sceneMargin.top - sceneMargin.bottom; // Match increased height
    
    // Get existing scales from SVG dimensions
    const x = d3.scaleBand()
        .domain(['Class 1', 'Class 2', 'Class 3'])
        .range([0, width])
        .padding(0.3);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(classData, d => d.total)])
        .range([sceneHeight, 0]);
    
    // Select the visualization group
    const g = svg.select('g');
    
    // Update existing bars instantly (no transition)
    classData.forEach((d, i) => {
        // Get the existing bars
        const diedBar = g.selectAll('.bar').filter((_, j) => j === i*2);
        const survivedBar = g.selectAll('.bar').filter((_, j) => j === i*2 + 1);
        
        // Update the died portion instantly
        diedBar
            .attr('y', y(d.died))
            .attr('height', sceneHeight - y(d.died));
        
        // Update the survived portion instantly
        survivedBar
            .attr('y', y(d.total))
            .attr('height', y(d.died) - y(d.total));
        
        // Update tooltips (no transition needed)
        diedBar.on('mouseover', function(event) {
            showTooltip(event, `Class ${d.class} - Did not survive: ${d.died} passengers (${(100 - d.survivalRate*100).toFixed(1)}%)`);
        });
        
        survivedBar.on('mouseover', function(event) {
            showTooltip(event, `Class ${d.class} - Survived: ${d.survived} passengers (${(d.survivalRate*100).toFixed(1)}%)`);
        });
        
        // Update survival rate labels and their background boxes together
        // First, find the label position with better spacing to avoid overlaps
        const labelY = y(d.total) - 30; // More space above the bar to avoid overlap
        const labelX = x(`Class ${d.class}`) + x.bandwidth()/2;
        
        // Find and update label background instantly - using more specific filtering
        const labelBg = g.selectAll('rect')
            .filter(function() {
                // Find the label background for this class by checking if it's a white background rect with stroke
                const rect = d3.select(this);
                const bx = parseFloat(rect.attr('x'));
                const fill = rect.attr('fill');
                const stroke = rect.attr('stroke');
                const width = parseFloat(rect.attr('width'));
                // Look for white background rects with blue stroke that are 60px wide (our label backgrounds)
                return Math.abs(bx - (labelX - 30)) < 5 && fill === 'white' && stroke === '#2a5298' && width === 60;
            });
            
        labelBg
            .attr('x', labelX - 30)
            .attr('y', labelY - 15);
        
        // Find and update label text instantly - using more specific filtering
        const labelText = g.selectAll('text')
            .filter(function() {
                // Find the label text for this class by checking position and content
                const text = d3.select(this);
                const tx = parseFloat(text.attr('x'));
                const fill = text.attr('fill');
                const fontWeight = text.attr('font-weight');
                // Look for bold blue text that contains % and is positioned at our labelX
                return Math.abs(tx - labelX) < 5 && fill === '#1e3c72' && fontWeight === 'bold' && text.text().includes('%');
            });
            
        labelText
            .attr('x', labelX)
            .attr('y', labelY - 2)
            .text(`${(d.survivalRate*100).toFixed(1)}%`);
    });
    
    // Remove old annotations and add new ones
    svg.selectAll('.annotation-group').remove();
    
    // Add responsive annotations attached directly to the top of percentage containers
    const class1LabelY = y(classData[0].total) - 30; // Position of percentage label text
    const class3LabelY = y(classData[2].total) - 30; // Position of percentage label text
    const class1ContainerTop = class1LabelY - 15; // Top of the percentage label container
    const class3ContainerTop = class3LabelY - 15; // Top of the percentage label container
    
    // Calculate bar center positions
    const class1BarCenter = x('Class 1') + x.bandwidth()/2 + sceneMargin.left;
    const class3BarCenter = x('Class 3') + x.bandwidth()/2 + sceneMargin.left;
    
    addAnnotations([
        {
            note: { 
                label: `${selectedGender === 'all' ? 'Overall, first' : 
                        selectedGender === 'male' ? 'Male first' : 'Female first'} class had the highest survival rate at ${(classData[0].survivalRate*100).toFixed(1)}%`,
                title: "Class Privilege",
                wrap: 120
            },
            x: class1BarCenter, // Center above the bar
            y: sceneMargin.top + class1ContainerTop, // Attach to top of percentage container
            dx: 0, // No horizontal offset
            dy: -5 // Small offset above the container
        },
        {
            note: { 
                label: `${selectedGender === 'all' ? 'Overall, third' : 
                        selectedGender === 'male' ? 'Male third' : 'Female third'} class had the lowest survival rate at ${(classData[2].survivalRate*100).toFixed(1)}%`,
                title: "Limited Access",
                wrap: 120
            },
            x: class3BarCenter, // Center above the bar
            y: sceneMargin.top + class3ContainerTop, // Attach to top of percentage container
            dx: 0, // No horizontal offset
            dy: -5 // Small offset above the container
        }
    ]);
}

// Tooltip functions
function showTooltip(event, text) {
    const tooltip = d3.select('body').selectAll('.tooltip')
        .data([null]);
    
    const tooltipEnter = tooltip.enter()
        .append('div')
        .attr('class', 'tooltip');
    
    const tooltipUpdate = tooltipEnter.merge(tooltip);
    
    tooltipUpdate
        .html(text)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .classed('visible', true);
}

function hideTooltip() {
    d3.selectAll('.tooltip')
        .classed('visible', false);
}
