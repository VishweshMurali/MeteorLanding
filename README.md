# Meteorite Dashboard

An interactive dashboard for visualizing meteorite landings data, built with FastAPI and Plotly.

## Features

- Interactive world map showing meteorite landings by year
- Animation capability to visualize landings over time
- Bar chart showing distribution of meteorite classifications
- Heatmap visualization of meteorite compositions
- Responsive design for desktop and mobile viewing

## Requirements

- Python 3.7+
- FastAPI
- Uvicorn
- Pandas
- Plotly

## Installation

1. Clone this repository or download the source code.
2. Install the required packages:

```bash
pip install -r requirements.txt
```

## Running the Application

Start the FastAPI server with:

```bash
uvicorn app_fastapi:app --reload
```

Then open your browser and navigate to `http://localhost:8000` to view the dashboard.

## Data Sources

The application uses the following data files:

- `Meteorite_Landings_With_Classification.csv` - Main meteorite data including locations and classifications
- `cleansed_meteorite_composition.csv` - Chemical composition data for meteorite classes

## Project Structure

- `app_fastapi.py` - Main FastAPI application
- `templates/` - HTML templates
- `static/` - JavaScript, CSS, and other static files
- `assets/` - Images and custom styling

## Converting from Dash to FastAPI

This project was converted from a Dash/Flask application to FastAPI. The key differences are:

1. Dash uses a declarative approach to define the UI, while FastAPI uses templates
2. Dash callbacks are replaced with API endpoints in FastAPI
3. Client-side interactivity is handled with JavaScript in the FastAPI version 