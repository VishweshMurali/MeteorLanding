from fastapi import FastAPI, Request, Form, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import pandas as pd
import plotly.express as px
import json
import uvicorn
from typing import Optional

# Load and process data
df = pd.read_csv("Meteorite_Landings_With_Classification.csv")
df = df.dropna(subset=['year', 'reclat', 'reclong', 'recclass', 'superclass', 'megaclass'])
df['year'] = pd.to_numeric(df['year'], errors='coerce').astype('Int64')
df = df[df['year'].between(1850, 2013)]
df['mass (g)'] = df['mass (g)'].fillna(0)

# Fixed color palettes
color_palettes = {
    'superclass': px.colors.qualitative.Safe,
    'megaclass': px.colors.qualitative.Pastel,
    'recclass': px.colors.qualitative.Set3
}

# Initialize FastAPI
app = FastAPI(title="Meteorite Dashboard")

# Mount static files
app.mount("/assets", StaticFiles(directory="assets"), name="assets")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set up Jinja2 templates
templates = Jinja2Templates(directory="templates")

# API endpoint for map data
@app.get("/api/map-data")
async def get_map_data(year: int = 1850, drilldown_column: str = "megaclass"):
    year_df = df[df['year'] == year].copy()
    
    # Create color mapping
    palette = color_palettes[drilldown_column]
    unique_vals = sorted(df[drilldown_column].dropna().unique())
    color_map = {val: palette[i % len(palette)] for i, val in enumerate(unique_vals)}
    
    # Prepare the data
    data = {
        "lat": year_df["reclat"].tolist(),
        "lon": year_df["reclong"].tolist(),
        "name": year_df["name"].tolist(),
        "mass": year_df["mass (g)"].tolist(),
        "recclass": year_df["recclass"].tolist(),
        "superclass": year_df["superclass"].tolist(),
        "megaclass": year_df["megaclass"].tolist(),
        "category": year_df[drilldown_column].tolist(),
        "color_map": color_map
    }
    
    # Get top classes for bar chart
    top_classes = year_df[drilldown_column].value_counts().nlargest(10)
    bar_data = {
        "categories": top_classes.index.tolist(),
        "counts": top_classes.values.tolist(),
        "color_map": {cat: color_map[cat] for cat in top_classes.index}
    }
    
    return {"map_data": data, "bar_data": bar_data}

# API endpoint for heatmap data
@app.get("/api/heatmap-data")
async def get_heatmap_data(selected_group: str = "megaclass"):
    df_comp = pd.read_csv("cleansed_meteorite_composition.csv")
    
    exclude_cols = ['Unnamed: 0', 'superclass', 'megaclass', 'Sample SubType', 'Analyzed Material', 'TOTAL (wt%)']
    composition_cols = [col for col in df_comp.columns if col not in exclude_cols and "(wt%)" in col]
    
    group_col = selected_group
    
    grouped_max = df_comp.groupby(group_col)[composition_cols].mean().fillna(0).reset_index()
    heatmap_data = grouped_max.set_index(group_col)
    
    # Convert to format for plotly.js
    z_values = heatmap_data.values.tolist()
    x_values = [col.replace(' (wt%)', '') for col in heatmap_data.columns]
    y_values = heatmap_data.index.tolist()
    
    return {
        "z": z_values,
        "x": x_values,
        "y": y_values,
        "title": f"Average Composition per {group_col.capitalize()}"
    }

# Route for the main page
@app.get("/", response_class=HTMLResponse)
async def get_home(request: Request):
    return templates.TemplateResponse(
        "index.html", 
        {"request": request}
    )

# For development only
if __name__ == "__main__":
    uvicorn.run("app_fastapi:app", host="0.0.0.0", port=8000, reload=True) 