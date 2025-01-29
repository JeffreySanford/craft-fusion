import requests
from bs4 import BeautifulSoup
import json
import time
import matplotlib.pyplot as plt
import pandas as pd
from collections import Counter

# ETCSL main myth index URL
etcs_index_url = "https://etcsl.orinst.ox.ac.uk/section1/tr1.htm"

# Fetch the index page with the list of all texts
print("Fetching myth index page...")
start_time = time.time()
response = requests.get(etcs_index_url)
index_fetch_time = time.time() - start_time
print(f"Index page fetched in {index_fetch_time:.2f} seconds.")

# Parse the page
soup = BeautifulSoup(response.content, 'html.parser')

# Find all links to the individual myth texts
myth_links = []
for link in soup.find_all('a', href=True):
    href = link['href']
    if "etcsl" in href and "myth" in href:
        myth_links.append(f"https://etcsl.orinst.ox.ac.uk/{href}")

print(f"Found {len(myth_links)} myths.")

# Core values (can be loaded from core_values.jsonl if needed)
core_values = {
    "Justice": "The principle of fairness...",
    "Freedom": "The ability to act without restraint...",
    "Sumerian Law": "The system of laws in Sumer...",
    "American Exceptionalism": "America’s unique role in history...",
    "Truth": "Honesty and integrity...",
    "Self-Reliance": "Independence and self-sufficiency...",
    "Innovation": "Creating new solutions...",
    "Honor and Integrity": "Acting with moral principles...",
    "Community and Collaboration": "Working together for common goals...",
    "Perseverance": "The determination to keep moving forward..."
}

# Function to create JSONL entry with referenced core values
def create_jsonl_entry(title, text, transliteration, cdli_reference, relevant_core_values, category="Mythology"):
    return {
        "title": title,
        "text": text,
        "transliteration": transliteration,
        "cdli_reference": cdli_reference,
        "category": category,
        "core_values": relevant_core_values
    }

# Function to parse the ETCSL myth text and retrieve necessary data
def parse_etcs_entry(url):
    # Fetch the page content
    response = requests.get(url)
    
    if response.status_code == 200:
        content = response.content
        soup = BeautifulSoup(content, 'xml')
        
        # Extract text, transliteration, and CDLI reference
        title = soup.find('title').get_text()
        text = soup.find('text').get_text() if soup.find('text') else "N/A"
        transliteration = soup.find('transliteration').get_text() if soup.find('transliteration') else "N/A"
        cdli_reference = soup.find('cdli_reference').get_text() if soup.find('cdli_reference') else "N/A"
        
        # Define which core values are relevant for this myth (this could be done manually or based on the content)
        relevant_core_values = ["Justice", "Freedom", "Innovation"]  # Example of highlighted core values
        
        # Create and return the JSONL entry
        jsonl_entry = create_jsonl_entry(title, text, transliteration, cdli_reference, relevant_core_values)
        return jsonl_entry
    else:
        print(f"Error fetching URL: {url}")
        return None

# Loop through all myth URLs and process them
def process_etcs_data():
    all_entries = []
    total_myths = len(myth_links)
    
    # Start the timer for overall performance tracking
    start_time = time.time()

    for idx, url in enumerate(myth_links):
        # Log progress every 10 myths for better readability
        if idx % 10 == 0:
            print(f"Processing myth {idx+1}/{total_myths}...")

        # Time the processing of each myth
        myth_start_time = time.time()

        entry = parse_etcs_entry(url)
        if entry:
            all_entries.append(entry)

        # Log time taken for the individual myth processing
        myth_end_time = time.time()
        myth_time = myth_end_time - myth_start_time
        print(f"Processed myth {idx+1}/{total_myths} in {myth_time:.2f} seconds.")

    # Calculate and print the total time taken
    end_time = time.time()
    total_time = end_time - start_time
    print(f"Processed all {total_myths} myths in {total_time:.2f} seconds.")

    # Write the entries to a JSONL file
    with open("all_sumerian_myths.jsonl", "w") as f:
        for entry in all_entries:
            f.write(json.dumps(entry) + "\n")
    
    print(f"All myths processed and saved to 'all_sumerian_myths.jsonl'.")

    # Create a visualization of core values from the collected myths
    visualize_core_values(all_entries)

# Visualization of core values distribution across myths
def visualize_core_values(entries):
    print("Visualizing core values distribution...")

    # Collect all core values from the processed entries
    all_core_values = []
    for entry in entries:
        all_core_values.extend(entry['core_values'])

    # Count occurrences of each core value
    core_values_count = Counter(all_core_values)

    # Create a pandas DataFrame for better visualization
    df = pd.DataFrame(core_values_count.items(), columns=['Core Value', 'Count'])
    
    # Plot the data
    df.plot(kind='bar', x='Core Value', y='Count', legend=False, color='skyblue', title='Core Values Distribution')
    plt.xlabel('Core Value')
    plt.ylabel('Count')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.show()

# Start processing the data
process_etcs_data()
