import dash
from dash import dcc, html, Input, Output
import pandas as pd
import plotly.express as px


df = pd.read_csv("Meteorite_Landings_With_Classification.csv")
df = df.dropna(subset=['year', 'reclat', 'reclong', 'recclass', 'superclass', 'megaclass'])
df['year'] = pd.to_numeric(df['year'], errors='coerce').astype('Int64')
df = df[df['year'].between(1850, 2013)]
df['mass (g)'] = df['mass (g)'].fillna(0)

# Fixed color palettes
dash_color_palettes = {
    'superclass': px.colors.qualitative.Safe,
    'megaclass': px.colors.qualitative.Pastel,
    'recclass': px.colors.qualitative.Set3
}

# App Initialization
app = dash.Dash(__name__)
app.title = "Meteorite Dashboard (Animation + Heatmap)"

# Layout
app.layout = html.Div([
    html.H1("Meteorite Dashboard", style={'textAlign': 'center', 'color': 'white'}),
    dcc.Tabs(
    id='tabs',
    value='tab-animation',
    children=[
        dcc.Tab(label='Meteorite Animation', value='tab-animation', style={
            'backgroundColor': '#121212',
            
            'color': 'white',
            'border': 'none',
            'fontWeight': 'bold'
        }, selected_style={
            'backgroundColor': '#333333',   
            'color': 'white',
            'fontWeight': 'bold',
            'border': 'none'
        }),
        dcc.Tab(label='Composition Heatmap', value='tab-heatmap', style={
            'backgroundColor': '#121212',
            'color': 'white',
            'border': 'none',
            'fontWeight': 'bold'
        }, selected_style={
            'backgroundColor': '#333333',
            'color': 'white',
            'fontWeight': 'bold',
            'border': 'none'
        })
    ],
    style={
    'backgroundImage': 'url("/assets/image1.jpg")',
    'backgroundSize': 'cover',
    'backgroundPosition': 'center',
    'backgroundRepeat': 'no-repeat',
    'backgroundAttachment': 'fixed',
    'backgroundColor': 'rgba(0,0,0,0.6)', 
    
    }
),
    html.Div([
        html.Div(id='tab-animation-content', children=[
            html.Button('Play / Pause', id='play-pause-btn', n_clicks=0, style={
    'backgroundColor': '#FF6347',  
    'color': 'white',
    'boxShadow': '0 0 12px rgba(255,99,71,0.8)',
    'padding': '10px 10px',
    'fontSize': '15px',
    'border': 'none',
    'borderRadius': '10px',
    'boxShadow': '0px 4px 6px rgba(0, 0, 0, 0.3)',
    'cursor': 'pointer',
    'transition': 'background-color 0.3s ease',
    'marginBottom': '20px',
    'fontWeight': 'bold'
}),
            dcc.Slider(id='year-slider', min=1850, max=2013, step=1, value=1850,
                       marks={year: str(year) for year in range(1850, 2013, 25)}, tooltip={'always_visible': True}),
            dcc.Dropdown(
    id='drilldown-dropdown',
    options=[
        {'label': 'Super Class', 'value': 'superclass'},
        {'label': 'Mega Class', 'value': 'megaclass'},
        {'label': 'Major Class', 'value': 'recclass'}
    ],
    value='megaclass',
    clearable=False,
    style={
    'width': '30%',
    'marginTop': '10px',
    'marginBottom': '10px',
    'backgroundColor': 'rgba(255,255,255,0.1)',  # semi-transparent white background
    'border': '1px solid rgba(255,255,255,0.3)',  # slightly stronger border
    'borderRadius': '8px',
    'padding': '10px',
    'fontSize': '16px',
    'color': 'white',
    'fontWeight': 'bold', 

    }
),
            html.Div(id='year-label', style={'textAlign': 'center', 'color': 'white'}),
            html.Div([
                dcc.Graph(id='map', style={'flex': '2'}),
                dcc.Graph(id='bar', style={'flex': '1'})
            ], style={'display': 'flex', 'gap': '20px'})
        ]),
        html.Div(id='tab-heatmap-content', children=[
            dcc.Dropdown(id='heatmap-drilldown-dropdown',
                         options=[{'label': 'Megaclass', 'value': 'megaclass'},
                                  {'label': 'Superclass', 'value': 'superclass'}],
                         value='megaclass',
                         clearable=False),
            dcc.Graph(id='composition-heatmap')
        ])
    ]),
    dcc.Interval(id='frame-interval', interval=200, n_intervals=0, disabled=True)
], style={ 'backgroundColor': 'rgba(0, 0, 0, 0.7)',
          'backgroundColor': '#121212', 'padding': '10px'})

# Tab switching
@app.callback(
    [Output('tab-animation-content', 'style'),
     Output('tab-heatmap-content', 'style')],
    Input('tabs', 'value')
)
def toggle_tabs(tab):
    if tab == 'tab-animation':
        return {'display': 'block'}, {'display': 'none'}
    else:
        return {'display': 'none'}, {'display': 'block'}

# Play/Pause button
@app.callback(
    [Output('frame-interval', 'disabled'),
     Output('play-pause-btn', 'children')],
    Input('play-pause-btn', 'n_clicks')
)
def toggle_animation(n_clicks):
    playing = n_clicks % 2 == 1
    button_label = '⏸ Pause' if playing else '▶ Play'
    return not playing, button_label

# Meteorite animation with updated year slider
@app.callback(
    [Output('map', 'figure'),
     Output('bar', 'figure'),
     Output('year-label', 'children'),
     Output('year-slider', 'value')],
    [Input('frame-interval', 'n_intervals'),
     Input('year-slider', 'value'),
     Input('drilldown-dropdown', 'value')]
)
def update_animation(n_intervals, slider_year, drilldown_column):
    ctx = dash.callback_context
    trigger = ctx.triggered[0]['prop_id'].split('.')[0] if ctx.triggered else None

    if trigger == 'frame-interval':
        year = 1850 + (n_intervals % (2013 - 1850 + 1))
    else:
        year = slider_year

    year_df = df[df['year'] == year].copy()
    palette = dash_color_palettes[drilldown_column]
    unique_vals = sorted(df[drilldown_column].dropna().unique())
    color_map = {val: palette[i % len(palette)] for i, val in enumerate(unique_vals)}
    year_df['color'] = year_df[drilldown_column].map(color_map)

    map_fig = px.scatter_mapbox(
        year_df,
        lat="reclat",
        lon="reclong",
        hover_name="name",
        hover_data={"mass (g)": True, "recclass": True, "superclass": True, "megaclass": True},
        color=drilldown_column,
        size="mass (g)",
        size_max=15,
        height=600,
        zoom=1.2,
        center={"lat": 10, "lon": 0},
        color_discrete_map=color_map
    )
    map_fig.update_layout(
        mapbox_style="carto-darkmatter",
        paper_bgcolor="#121212",
        plot_bgcolor="#121212",
        font_color="white",
        title=f"Meteorites in {year}",
        title_x=0.5,
        margin={"r": 0, "t": 30, "l": 0, "b": 0}
    )

    top_classes = year_df[drilldown_column].value_counts().nlargest(10).reset_index()
    top_classes.columns = [drilldown_column, 'count']
    bar_fig = px.bar(
    top_classes,
    x=drilldown_column,
    y='count',
    title='Top Meteorite Categories',
    text_auto=True,               
    color=drilldown_column,
    color_discrete_map=color_map
)

    bar_fig.update_traces(
        textposition='outside'           
    )

    bar_fig.update_layout(
        plot_bgcolor="#121212",
        paper_bgcolor="#121212",
        font_color="white",
        xaxis_tickangle=-90,
        title_x=0.5,
        uniformtext_minsize=10,
        uniformtext_mode='hide'
    )


    return map_fig, bar_fig, f" Year: {year}", year

# Heatmap update
@app.callback(
    Output('composition-heatmap', 'figure'),
    Input('heatmap-drilldown-dropdown', 'value')
)
def update_heatmap(selected_group):
    df_comp = pd.read_csv("cleansed_meteorite_composition.csv")

    exclude_cols = ['Unnamed: 0', 'superclass', 'megaclass', 'Sample SubType', 'Analyzed Material', 'TOTAL (wt%)']
    composition_cols = [col for col in df_comp.columns if col not in exclude_cols and "(wt%)" in col]

    if selected_group == 'megaclass':
        group_col = 'megaclass'
        title = "Average Composition per Megaclass"
    else:
        group_col = 'superclass'
        title = "Average Composition per Superclass"

    grouped_max = df_comp.groupby(group_col)[composition_cols].mean().fillna(0).reset_index()
    heatmap_data = grouped_max.set_index(group_col)

    fig = px.imshow(
        heatmap_data,
        labels=dict(x="Chemical Element", y=group_col.capitalize(), color="Avg Composition %"),
        color_continuous_scale='cividis',
        aspect="auto"
    )

    fig.update_layout(
        title=title,
        paper_bgcolor="#121212",
        plot_bgcolor="#121212",
        font_color="white",
        height=700,
        margin={"r": 0, "t": 40, "l": 0, "b": 0}
    )

    fig.update_traces(
        hovertemplate=f"{group_col.capitalize()}: "+"%{y}<br>Element: %{x}<br>Avg Concentration: %{z:.2f}%<extra></extra>",
        showscale=True,
        hoverongaps=False
    )

    return fig

# Run App
if __name__ == '__main__':
    app.run(debug=True)
