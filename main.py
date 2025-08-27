import streamlit as st
import streamlit.components.v1 as components

# Load the HTML file
with open("index.html", "r") as f:
    html_code = f.read()

# Render inside Streamlit
components.html(html_code, height=600, scrolling=True)
