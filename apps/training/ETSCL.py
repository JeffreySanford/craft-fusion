import requests
from bs4 import BeautifulSoup
import json
import time
import matplotlib.pyplot as plt
import pandas as pd
from collections import Counter
from colorama import Fore, Style, init
from urllib.parse import urljoin

# Initialize colorama
init(autoreset=True)

# ETCSL base URL
etcs_base_url = "https://etcsl.orinst.ox.ac.uk/"

# Sections to iterate through
sections = ["section1/tr1.htm", "section2/tr2.htm", "section3/tr3.htm", "section4/tr4.htm", "section5/tr5.htm", "section6/tr6.htm"]

# Function to fetch and parse a section page
def fetch_section_page(section_url):
    print(Fore.CYAN + f"Fetching section page: {section_url}")
    start_time = time.time()
    response = requests.get(section_url)
    fetch_time = time.time() - start_time
    print(Fore.GREEN + f"Section page fetched in {fetch_time:.2f} seconds.")
    return BeautifulSoup(response.content, 'html.parser')

# Loop through each section and find all myth links
myth_links = []
for section in sections:
    section_url = urljoin(etcs_base_url, section)
    soup = fetch_section_page(section_url)
    for link in soup.find_all('a', href=True):
        href = link['href']
        if "etcsl" in href and "myth" in href:
            full_url = urljoin(section_url, href)
            myth_links.append(full_url)
            print(Fore.GREEN + f"Found myth link: {full_url}")

print(Fore.YELLOW + f"Found {len(myth_links)} myths.")

# ETCSL full catalog URL
etcs_catalog_url = "https://etcsl.orinst.ox.ac.uk/edition2/etcslfullcat.php"

# Fetch the catalog page with the list of all sections
print(Fore.CYAN + "Fetching catalog page...")
start_time = time.time()
response = requests.get(etcs_catalog_url)
catalog_fetch_time = time.time() - start_time
print(Fore.GREEN + f"Catalog page fetched in {catalog_fetch_time:.2f} seconds.")

# Parse the catalog page
soup = BeautifulSoup(response.content, 'html.parser')

# Find all links to the individual sections
section_links = []
for link in soup.find_all('a', href=True):
    href = link['href']
    if "section" in href:
        full_url = urljoin(etcs_catalog_url, href)
        section_links.append(full_url)
        print(Fore.GREEN + f"Found section link: {full_url}")

print(Fore.YELLOW + f"Found {len(section_links)} sections.")

# Function to get all myth links from a section
def get_myth_links_from_section(section_url):
    print(Fore.CYAN + f"Fetching section page: {section_url}")
    response = requests.get(section_url)
    soup = BeautifulSoup(response.content, 'html.parser')
    links = []
    for link in soup.find_all('a', href=True):
        href = link['href']
        if "etcsl" in href and "myth" in href:
            full_url = urljoin(section_url, href)
            print(Fore.GREEN + f"Found myth link: {full_url}")
            links.append(full_url)
    return links

# Loop through all section URLs and collect all myth links
all_myth_links = []
for section_url in section_links:
    print(Fore.CYAN + f"Processing section: {section_url}")
    section_myth_links = get_myth_links_from_section(section_url)
    all_myth_links.extend(section_myth_links)

print(Fore.YELLOW + f"Found a total of {len(all_myth_links)} myths.")

# Update the myth_links to use all_myth_links
myth_links = all_myth_links

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
def create_jsonl_entry(title, text, transliteration, cdli_reference, relevant_core_values, category, first_paragraph):
    return {
        "title": title,
        "text": text,
        "transliteration": transliteration,
        "cdli_reference": cdli_reference,
        "category": category,
        "core_values": relevant_core_values,
        "first_paragraph": first_paragraph
    }

# Function to parse the ETCSL myth text and retrieve necessary data
def parse_etcs_entry(url, category):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for HTTP errors
    except requests.RequestException as e:
        print(Fore.RED + f"Error fetching URL: {url} - {e}")
        return None
    
    content = response.content
    soup = BeautifulSoup(content, 'html.parser')  # Consistent parser
    
    # Extract text, transliteration, and CDLI reference
    title = soup.find('title').get_text()
    text = soup.find('text').get_text() if soup.find('text') else "N/A"
    transliteration = soup.find('transliteration').get_text() if soup.find('transliteration') else "N/A"
    cdli_reference = soup.find('cdli_reference').get_text() if soup.find('cdli_reference') else "N/A"
    
    # Extract the first paragraph or sentence
    first_paragraph = text.split('.')[0] if text != "N/A" else "N/A"
    
    # Define which core values are relevant for this myth (this could be done manually or based on the content)
    relevant_core_values = ["Justice", "Freedom", "Innovation"]  # Example of highlighted core values
    
    # Create and return the JSONL entry
    jsonl_entry = create_jsonl_entry(title, text, transliteration, cdli_reference, relevant_core_values, category, first_paragraph)
    return jsonl_entry

# Loop through all myth URLs and process them
def process_etcs_data():
    all_entries = []
    total_myths = len(myth_links)
    
    # Start the timer for overall performance tracking
    start_time = time.time()

    for idx, url in enumerate(myth_links):
        # Log progress every 10 myths for better readability
        if idx % 10 == 0:
            print(Fore.CYAN + f"Processing myth {idx+1}/{total_myths}...")

        # Time the processing of each myth
        myth_start_time = time.time()

        entry = parse_etcs_entry(url, "Mythology")
        if entry:
            all_entries.append(entry)

        # Log time taken for the individual myth processing
        myth_end_time = time.time()
        myth_time = myth_end_time - myth_start_time
        print(Fore.GREEN + f"Processed myth {idx+1}/{total_myths} in {myth_time:.2f} seconds.")

    # Calculate and print the total time taken
    end_time = time.time()
    total_time = end_time - start_time
    print(Fore.YELLOW + f"Processed all {total_myths} myths in {total_time:.2f} seconds.")

    # Write the entries to a JSONL file
    with open("all_sumerian_myths.jsonl", "w") as f:
        for entry in all_entries:
            f.write(json.dumps(entry) + "\n")
    
    print(Fore.GREEN + f"All myths processed and saved to 'all_sumerian_myths.jsonl'.")

    # Ensure there are myths to process before visualizing
    if all_entries:
        visualize_core_values(all_entries)
    else:
        print(Fore.RED + "No myths found to visualize.")

# Visualization of core values distribution across myths
def visualize_core_values(entries):
    print(Fore.CYAN + "Visualizing core values distribution...")

    # Collect all core values from the processed entries
    core_values_by_category = {}
    for entry in entries:
        category = entry['category']
        if category not in core_values_by_category:
            core_values_by_category[category] = []
        core_values_by_category[category].extend(entry['core_values'])

    # Create a pandas DataFrame for better visualization
    data = []
    for category, core_values in core_values_by_category.items():
        core_values_count = Counter(core_values)
        for core_value, count in core_values_count.items():
            data.append({"Category": category, "Core Value": core_value, "Count": count})
    
    df = pd.DataFrame(data)
    
    # Plot the data
    pivot_df = df.pivot_table(index="Core Value", columns="Category", values="Count", fill_value=0)
    pivot_df.plot(kind='bar', stacked=True, colormap='viridis', title='Core Values Distribution by Category')
    plt.xlabel('Core Value')
    plt.ylabel('Count')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.show()

# ETCSL texts by number URL
etcs_texts_url = "https://etcsl.orinst.ox.ac.uk/edition2/etcslbynumb.php"

# Fetch the page with the list of all texts
print(Fore.CYAN + "Fetching texts by number page...")
start_time = time.time()
response = requests.get(etcs_texts_url)
texts_fetch_time = time.time() - start_time
print(Fore.GREEN + f"Texts by number page fetched in {texts_fetch_time:.2f} seconds.")

# Parse the page
soup = BeautifulSoup(response.content, 'html.parser')

# Find all links to the individual texts
text_links = []
for link in soup.find_all('a', href=True):
    href = link['href']
    if "cgi-bin/etcsl.cgi?text=" in href:
        full_url = urljoin(etcs_texts_url, href)
        text_links.append(full_url)
        print(Fore.GREEN + f"Found text link: {full_url}")

print(Fore.YELLOW + f"Found {len(text_links)} texts.")

# Function to parse the ETCSL text and retrieve necessary data
def parse_etcs_text(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for HTTP errors
    except requests.RequestException as e:
        print(Fore.RED + f"Error fetching URL: {url} - {e}")
        return None
    
    content = response.content
    soup = BeautifulSoup(content, 'html.parser')  # Consistent parser
    
    # Extract text, transliteration, and CDLI reference
    title = soup.find('title').get_text()
    text = soup.find('text').get_text() if soup.find('text') else "N/A"
    transliteration = soup.find('transliteration').get_text() if soup.find('transliteration') else "N/A"
    cdli_reference = soup.find('cdli_reference').get_text() if soup.find('cdli_reference') else "N/A"
    
    # Extract the first paragraph or sentence
    first_paragraph = text.split('.')[0] if text != "N/A" else "N/A"
    
    # Define which core values are relevant for this text (this could be done manually or based on the content)
    relevant_core_values = ["Justice", "Freedom", "Innovation"]  # Example of highlighted core values
    
    # Create and return the JSONL entry
    jsonl_entry = create_jsonl_entry(title, text, transliteration, cdli_reference, relevant_core_values, "Text", first_paragraph)
    return jsonl_entry

# Loop through all text URLs and process them
def process_etcs_texts():
    all_entries = []
    total_texts = len(text_links)
    
    # Start the timer for overall performance tracking
    start_time = time.time()

    for idx, url in enumerate(text_links):
        # Log progress every 10 texts for better readability
        if idx % 10 == 0:
            print(Fore.CYAN + f"Processing text {idx+1}/{total_texts}...")

        # Time the processing of each text
        text_start_time = time.time()

        entry = parse_etcs_text(url)
        if entry:
            all_entries.append(entry)

        # Log time taken for the individual text processing
        text_end_time = time.time()
        text_time = text_end_time - text_start_time
        print(Fore.GREEN + f"Processed text {idx+1}/{total_texts} in {text_time:.2f} seconds.")

    # Calculate and print the total time taken
    end_time = time.time()
    total_time = end_time - start_time
    print(Fore.YELLOW + f"Processed all {total_texts} texts in {total_time:.2f} seconds.")

    # Write the entries to a JSONL file
    with open("all_sumerian_texts.jsonl", "w") as f:
        for entry in all_entries:
            f.write(json.dumps(entry) + "\n")
    
    print(Fore.GREEN + f"All texts processed and saved to 'all_sumerian_texts.jsonl'.")

    # Ensure there are texts to process before visualizing
    if all_entries:
        visualize_core_values(all_entries)
    else:
        print(Fore.RED + "No texts found to visualize.")

# Start processing the texts
process_etcs_texts()

# Start processing the data
process_etcs_data()
